package com.flowcraft.api.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final SecretKey key;
  private final Duration accessTtl;
  private final Duration refreshTtl;

  public AuthService(
      UserRepository users,
      PasswordEncoder encoder,
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-minutes}") long accessMinutes,
      @Value("${app.jwt.refresh-expiration-days}") long refreshDays) {
    this.users = users;
    this.encoder = encoder;
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.accessTtl = Duration.ofMinutes(accessMinutes);
    this.refreshTtl = Duration.ofDays(refreshDays);
  }

  public IssuedTokens register(String email, String password) {
    if (users.findByEmailIgnoreCase(email).isPresent()) {
      throw new IllegalArgumentException("Email already registered");
    }
    return issue(users.save(new User(email.toLowerCase(), encoder.encode(password))));
  }

  public IssuedTokens login(String email, String password) {
    User user = users.findByEmailIgnoreCase(email)
        .filter(candidate -> encoder.matches(password, candidate.getPasswordHash()))
        .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
    return issue(user);
  }

  public IssuedTokens refresh(String refreshToken) {
    Claims claims = parse(refreshToken);
    if (!"refresh".equals(claims.get("type", String.class))) {
      throw new IllegalArgumentException("Invalid refresh token");
    }
    User user = users.findById(UUID.fromString(claims.getSubject()))
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return issue(user);
  }

  private IssuedTokens issue(User user) {
    Instant now = Instant.now();
    Token session = new Token(sign(user, now, accessTtl, "access"), user.getEmail());
    return new IssuedTokens(session, sign(user, now, refreshTtl, "refresh"));
  }

  private String sign(User user, Instant now, Duration ttl, String type) {
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("email", user.getEmail())
        .claim("type", type)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(ttl)))
        .signWith(key)
        .compact();
  }

  private Claims parse(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
  }

  public record Token(String accessToken, String email) {}
  public record IssuedTokens(Token session, String refreshToken) {}
}
