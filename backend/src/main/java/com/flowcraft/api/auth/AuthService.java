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
/**
 * Implements account registration, credential verification, and JWT issuance.
 *
 * <p>Refresh tokens are signed with the same configured key as access tokens but carry
 * a distinct {@code type} claim and a longer lifetime.</p>
 */
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

  /**
   * Registers a user and issues an access/refresh token pair.
   *
   * @param email unique account email address
   * @param password plain-text password to hash before storing
   * @return tokens for the newly created account
   * @throws IllegalArgumentException when the address is already registered
   */
  public IssuedTokens register(String email, String password) {
    if (users.findByEmailIgnoreCase(email).isPresent()) {
      throw new IllegalArgumentException("Email already registered");
    }
    return issue(users.save(new User(email.toLowerCase(), encoder.encode(password))));
  }

  /**
   * Verifies credentials and creates a fresh token pair.
   *
   * @param email account email address
   * @param password plain-text account password
   * @return tokens for the authenticated user
   * @throws IllegalArgumentException when the credentials are invalid
   */
  public IssuedTokens login(String email, String password) {
    User user = users.findByEmailIgnoreCase(email)
        .filter(candidate -> encoder.matches(password, candidate.getPasswordHash()))
        .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
    return issue(user);
  }

  /**
   * Exchanges a valid refresh token for a new token pair.
   *
   * @param refreshToken signed refresh token from the HttpOnly cookie
   * @return newly issued access and refresh tokens
   * @throws IllegalArgumentException when the token is invalid, is not a refresh token, or references no user
   */
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

  /** Public token payload returned to the browser after authentication. */
  public record Token(String accessToken, String email) {}

  /** Pair of the browser-visible session and the HttpOnly refresh token. */
  public record IssuedTokens(Token session, String refreshToken) {}
}
