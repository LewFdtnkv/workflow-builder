package com.flowcraft.api.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService auth;
  private final boolean secureCookie;
  private final long refreshDays;

  public AuthController(
      AuthService auth,
      @Value("${app.auth.secure-cookie}") boolean secureCookie,
      @Value("${app.jwt.refresh-expiration-days}") long refreshDays) {
    this.auth = auth;
    this.secureCookie = secureCookie;
    this.refreshDays = refreshDays;
  }

  public record Credentials(@Email @NotBlank String email, @Size(min = 8, max = 72) String password) {}

  @PostMapping("/register")
  public ResponseEntity<AuthService.Token> register(@RequestBody @Valid Credentials credentials) {
    return respond(auth.register(credentials.email(), credentials.password()), HttpStatus.CREATED);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthService.Token> login(@RequestBody @Valid Credentials credentials) {
    return respond(auth.login(credentials.email(), credentials.password()), HttpStatus.OK);
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthService.Token> refresh(
      @CookieValue(name = "refresh_token", required = false) String refreshToken) {
    if (refreshToken == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return respond(auth.refresh(refreshToken), HttpStatus.OK);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout() {
    return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, refreshCookie("", 0).toString()).build();
  }

  private ResponseEntity<AuthService.Token> respond(AuthService.IssuedTokens issued, HttpStatus status) {
    return ResponseEntity.status(status)
        .header(HttpHeaders.SET_COOKIE, refreshCookie(issued.refreshToken(), refreshDays * 24 * 60 * 60).toString())
        .body(issued.session());
  }

  private ResponseCookie refreshCookie(String value, long seconds) {
    return ResponseCookie.from("refresh_token", value)
        .httpOnly(true)
        .secure(secureCookie)
        .sameSite("Lax")
        .path("/api/auth")
        .maxAge(seconds)
        .build();
  }
}
