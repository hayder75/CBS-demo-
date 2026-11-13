package com.cbs.sacco.config;

import com.cbs.sacco.auth.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthFilter jwtAuthFilter,
                                           @Value("${app.security.require-https:false}") boolean requireHttps) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER))
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                .permissionsPolicy(policy -> policy
                    .policy("geolocation=(), microphone=(), camera=()")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login", "/api/auth/login/verify", "/api/auth/me", "/error").permitAll()
                .requestMatchers("/api/auth/users/**").hasRole("ADMIN")
                .requestMatchers("/api/sms/logs", "/api/sms/status", "/api/sms/send").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers("/api/system/**", "/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/audit-trail/**", "/api/audit/**").hasAnyRole("ADMIN", "MANAGER", "AUDITOR")
                .requestMatchers(HttpMethod.POST, "/api/gl-rules/**").hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/compliance/policy").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/notification-templates/**", "/api/notification-settings")
                    .hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/expenses/**", "/api/bank/**", "/api/charges/**", "/api/product-types/**")
                    .hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/savings/products", "/api/savings/interest", "/api/savings/maintenance-fees")
                    .hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/loan-restructures/**", "/api/loan-writeoffs/**", "/api/loan-recoveries/**", "/api/provisioning/**", "/api/loan-auto-debit/**")
                    .hasAnyRole("ADMIN", "MANAGER", "CREDIT_OFFICER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/shares/**", "/api/share-accounts/**", "/api/share-categories/**")
                    .hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/approvals/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/dormancy/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/checkoff/**").hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/**")
                    .hasAnyRole("ADMIN", "MANAGER", "TELLER", "CREDIT_OFFICER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PUT, "/api/auth/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/auth/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/gl-rules/**", "/api/compliance/policy").hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PATCH, "/api/gl-rules/**", "/api/compliance/policy").hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PUT, "/api/notification-templates/**", "/api/notification-settings").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/notification-templates/**", "/api/notification-settings").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/products/**", "/api/charges/**", "/api/product-types/**", "/api/loan-config/**", "/api/loan-categories/**", "/api/loan-groups/**", "/api/committees/**", "/api/branches/**", "/api/currencies/**", "/api/payment-modes/**", "/api/vaults/**", "/api/transaction-limits/**", "/api/savings/products").hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PATCH, "/api/products/**", "/api/charges/**", "/api/product-types/**", "/api/loan-config/**", "/api/loan-categories/**", "/api/loan-groups/**", "/api/committees/**", "/api/branches/**", "/api/currencies/**", "/api/payment-modes/**", "/api/vaults/**", "/api/transaction-limits/**", "/api/savings/products").hasAnyRole("ADMIN", "MANAGER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PUT, "/api/member-custom-fields/**", "/api/dormancy/policy").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/member-custom-fields/**", "/api/dormancy/policy").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/loan-restructures/**", "/api/loan-writeoffs/**").hasAnyRole("ADMIN", "MANAGER", "CREDIT_OFFICER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PATCH, "/api/loan-restructures/**", "/api/loan-writeoffs/**").hasAnyRole("ADMIN", "MANAGER", "CREDIT_OFFICER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PUT, "/api/approvals/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/approvals/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/**")
                    .hasAnyRole("ADMIN", "MANAGER", "TELLER", "CREDIT_OFFICER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PATCH, "/api/**")
                    .hasAnyRole("ADMIN", "MANAGER", "TELLER", "CREDIT_OFFICER", "ACCOUNTANT")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(401);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\"}");
                })
                .accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(403);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"status\":403,\"error\":\"Forbidden\"}");
                }))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        if (requireHttps) {
            http.requiresChannel(channel -> channel.anyRequest().requiresSecure());
        }
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}") String allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        config.setExposedHeaders(List.of("Location"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
