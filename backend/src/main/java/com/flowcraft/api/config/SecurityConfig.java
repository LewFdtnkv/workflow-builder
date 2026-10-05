package com.flowcraft.api.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
/** Configures stateless JWT security, password hashing, and local-development CORS. */
public class SecurityConfig {
  /**
   * Creates the BCrypt password encoder used when accounts are registered.
   *
   * @return password encoder for credential hashes
   */
  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /**
   * Creates the HTTP security chain and places JWT authentication before username/password authentication.
   *
   * @param http Spring Security HTTP configuration builder
   * @param jwt filter that parses bearer access tokens
   * @return configured stateless security filter chain
   * @throws Exception when Spring Security cannot build the chain
   */
  @Bean
  SecurityFilterChain security(HttpSecurity http, JwtAuthenticationFilter jwt) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> {})
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/api/auth/**", "/actuator/health", "/actuator/info")
            .permitAll()
            .anyRequest()
            .authenticated())
        .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  /**
   * Allows the local Vite development server to access the API with credentials.
   *
   * @return configured CORS source
   */
  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("http://localhost:*"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
