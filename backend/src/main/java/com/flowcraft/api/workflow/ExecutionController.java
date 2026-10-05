package com.flowcraft.api.workflow;

import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/executions")
/** REST endpoint for reading an execution that belongs to the authenticated user. */
public class ExecutionController {
  private final WorkflowExecutionService executions;
  public ExecutionController(WorkflowExecutionService executions) { this.executions = executions; }
  /**
   * Returns one execution result.
   *
   * @param user authenticated user's identifier
   * @param id execution identifier
   * @return execution record belonging to the authenticated user
   */
  @GetMapping("/{id}")
  WorkflowExecutionService.Execution get(@AuthenticationPrincipal String user, @PathVariable UUID id) {
    return executions.find(id, UUID.fromString(user));
  }
}
