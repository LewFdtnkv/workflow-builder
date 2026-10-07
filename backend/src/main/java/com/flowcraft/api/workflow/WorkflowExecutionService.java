package com.flowcraft.api.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
/**
 * Validates and executes persisted workflow graphs.
 *
 * <p>The service follows edges from the single Start node, invokes public HTTP nodes,
 * evaluates Condition nodes, and records a short execution result in the graph.</p>
 */
public class WorkflowExecutionService {
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final Map<UUID, Execution> executions = new ConcurrentHashMap<>();

    /**
     * Result of graph validation, including every detected user-facing error.
     */
    public record Validation(boolean valid, List<String> errors) {
    }

    /**
     * Immutable description of one workflow execution.
     */
    public record Execution(UUID id, UUID ownerId, String status, String startedAt, String finishedAt, String error) {
    }

    /**
     * Проверяет, соответствует ли граф требованиям структурной и сетевой безопасности
     * перед выполнением.
     *
     * @param graph граф рабочего процесса, представленный в формате JSON
     * @return результат проверки; {@code valid} имеет значение true, только если граф
     * не содержит ошибок
     */
    public Validation validate(JsonNode graph) {
        List<String> errors = new ArrayList<>();
        JsonNode nodes = graph.path("nodes");
        if (!nodes.isArray() || nodes.isEmpty()) errors.add("Workflow has no nodes");
        long starts = nodes.isArray() ? nodes.spliterator().getExactSizeIfKnown() : 0;
        if (nodes.isArray()) {
            starts = 0;
            for (JsonNode node : nodes) {
                if ("start".equals(node.path("kind").asText())) starts++;
                if ("http".equals(node.path("kind").asText()) && !isPublicHttpUrl(node.path("config").path("url").asText())) {
                    errors.add("HTTP nodes require a public http or https URL");
                }
            }
	if (starts != 1) errors.add("Workflow must have exactly one Start node");
        boolean hasResult = false;
        if (nodes.isArray())
            for (JsonNode node : nodes) if ("result".equals(node.path("kind").asText())) hasResult = true;
        if (!hasResult) errors.add("Workflow must contain a Result node");
        return new Validation(errors.isEmpty(), errors);
    }

    /**
     * Executes a validated graph and adds its outcome to the graph's run history.
     *
     * @param ownerId identifier of the user that owns the workflow
     * @param graph   mutable workflow graph
     * @return the recorded execution outcome, including a safe error message on failure
     */
    public Execution run(UUID ownerId, ObjectNode graph) {
        UUID id = UUID.randomUUID();
        String startedAt = Instant.now().toString();
        Validation validation = validate(graph);
        Execution result;
        if (!validation.valid()) {
            result = new Execution(id, ownerId, "FAILED", startedAt, Instant.now().toString(), String.join("; ", validation.errors()));
        } else {
            try {
                runNodes(graph);
                result = new Execution(id, ownerId, "SUCCESS", startedAt, Instant.now().toString(), null);
            } catch (Exception exception) {
                result = new Execution(id, ownerId, "FAILED", startedAt, Instant.now().toString(), safeMessage(exception));
            }
        }
        executions.put(id, result);
        appendRun(graph, result);
        return result;
    }

    /**
     * Finds an execution belonging to a particular user.
     *
     * @param id      execution identifier
     * @param ownerId current user's identifier
     * @return the requested execution
     * @throws IllegalArgumentException when the execution does not exist or belongs to another user
     */
    public Execution find(UUID id, UUID ownerId) {
        Execution execution = executions.get(id);
        if (execution == null || !execution.ownerId().equals(ownerId))
            throw new IllegalArgumentException("Execution not found");
        return execution;
    }

    private void runNodes(ObjectNode graph) throws Exception {
        Map<String, JsonNode> nodes = new HashMap<>();
        Map<String, List<JsonNode>> edges = new HashMap<>();
        String current = null;
        for (JsonNode node : graph.withArray("nodes")) {
            nodes.put(node.path("id").asText(), node);
            if ("start".equals(node.path("kind").asText())) current = node.path("id").asText();
        }
        for (JsonNode edge : graph.withArray("edges"))
            edges.computeIfAbsent(edge.path("source").asText(), ignored -> new ArrayList<>()).add(edge);
        String lastStatus = "";
        for (int step = 0; current != null && step < 100; step++) {
            JsonNode node = nodes.get(current);
            if (node == null) throw new IllegalArgumentException("An edge points to an unknown node");
            String kind = node.path("kind").asText();
            if ("http".equals(kind)) lastStatus = invokeHttp(node);
            if ("result".equals(kind)) return;
            List<JsonNode> next = edges.getOrDefault(current, List.of());
            if (next.isEmpty()) throw new IllegalArgumentException("A non-result node has no outgoing connection");
            JsonNode edge = chooseEdge(kind, node, next, lastStatus);
            current = edge.path("target").asText();
        }
        throw new IllegalArgumentException("Workflow exceeded the maximum of 100 steps");
    }

    private JsonNode chooseEdge(String kind, JsonNode node, List<JsonNode> edges, String status) {
        if (!"condition".equals(kind)) return edges.getFirst();
        String right = node.path("config").path("right").asText();
        boolean matches = status.equals(right);
        String handle = matches ? "true" : "false";
        return edges.stream().filter(edge -> handle.equals(edge.path("handle").asText())).findFirst().orElse(edges.getFirst());
    }

    private String invokeHttp(JsonNode node) throws Exception {
        String url = node.path("config").path("url").asText();
        if (!isPublicHttpUrl(url)) throw new IllegalArgumentException("Blocked unsafe HTTP URL");
        URI uri = URI.create(url);
        for (InetAddress address : InetAddress.getAllByName(uri.getHost())) {
            if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress() || address.isSiteLocalAddress()) {
                throw new IllegalArgumentException("Blocked private HTTP address");
            }
        }
        int timeout = Math.clamp(parseTimeout(node.path("config").path("timeout").asText()), 1, 30);
        String method = node.path("config").path("method").asText("GET").toUpperCase();
        HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(timeout)).method(method, HttpRequest.BodyPublishers.noBody()).build();
        HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
        if (response.statusCode() >= 400)
            throw new IllegalStateException("HTTP request returned " + response.statusCode());
        return Integer.toString(response.statusCode());
    }

    private boolean isPublicHttpUrl(String raw) {
        try {
            URI uri = URI.create(raw);
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) && uri.getHost() != null && uri.getUserInfo() == null;
        } catch (Exception exception) {
            return false;
        }
    }

    private int parseTimeout(String raw) {
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException exception) {
            return 10;
        }
    }

    private String safeMessage(Exception exception) {
        return exception.getMessage() == null ? "Execution failed" : exception.getMessage().substring(0, Math.min(300, exception.getMessage().length()));
    }

    private void appendRun(ObjectNode graph, Execution execution) {
        ArrayNode runs = graph.withArray("runs");
        ObjectNode run = runs.insertObject(0);
        run.put("id", execution.id().toString());
        run.put("at", execution.startedAt());
        run.put("status", execution.status());
        run.put("duration", "Completed");
        if (execution.error() != null) run.put("error", execution.error());
    }
}
