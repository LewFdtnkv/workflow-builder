package com.flowcraft.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
  private static final int MAX_ATTEMPTS = 10;
  private static final long WINDOW_SECONDS = 60;
  private final ConcurrentHashMap<String, Window> attempts = new ConcurrentHashMap<>();

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !request.getRequestURI().startsWith("/api/auth/") || "OPTIONS".equals(request.getMethod());
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String address = request.getRemoteAddr();
    long now = Instant.now().getEpochSecond();
    Window window = attempts.compute(address, (ignored, current) -> {
      if (current == null || now - current.startedAt > WINDOW_SECONDS) return new Window(now, 1);
      return new Window(current.startedAt, current.count + 1);
    });
    if (window.count > MAX_ATTEMPTS) {
      response.setStatus(429);
      response.setHeader("Retry-After", Long.toString(Math.max(1, WINDOW_SECONDS - (now - window.startedAt))));
      return;
    }
    chain.doFilter(request, response);
  }

  private record Window(long startedAt, int count) {}
}
