package com.cbs.sacco.sms.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.afro-sms")
public class AfroSmsProperties {
    private boolean enabled = false;
    private String apiKey;
    private String from;
    private String sender;
    private String baseUrl = "https://api.afromessage.com/api";
    private int otpLength = 6;
    private int otpTtlSeconds = 300;
    private int maxAttempts = 5;
    private int resendSeconds = 60;
    private int maxPerHour = 5;

    public boolean configured() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }
}
