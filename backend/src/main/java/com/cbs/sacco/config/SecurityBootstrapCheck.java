package com.cbs.sacco.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SecurityBootstrapCheck {
    public SecurityBootstrapCheck(
            @Value("${app.security.production:false}") boolean production,
            @Value("${app.security.seed-password:demo123}") String seedPassword,
            @Value("${app.jwt.secret}") String jwtSecret) {
        if (!production) return;
        if ("demo123".equals(seedPassword)) {
            throw new IllegalStateException("PRODUCTION=true requires a non-default SEED_PASSWORD");
        }
        if (jwtSecret == null || jwtSecret.startsWith("cbs-general-demo-")) {
            throw new IllegalStateException("PRODUCTION=true requires a strong JWT_SECRET from the environment");
        }
    }
}
