package com.cbs.sacco.notificationtemplate.web;

import com.cbs.sacco.notificationtemplate.entity.GatewaySettings;
import com.cbs.sacco.notificationtemplate.repo.GatewaySettingsRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/notification-settings")
public class NotificationSettingsController {

    private final GatewaySettingsRepository repository;

    public NotificationSettingsController(GatewaySettingsRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public GatewaySettings get() {
        return current();
    }

    @PostMapping
    public GatewaySettings save(@RequestBody GatewaySettings body) {
        String smtpHost = body.getSmtpHost() == null ? "" : body.getSmtpHost().trim();
        if (smtpHost.isEmpty()) {
            throw new IllegalArgumentException("SMTP host is required for the Email gateway");
        }
        Integer port = body.getSmtpPort();
        if (port == null || port < 1 || port > 65535) {
            throw new IllegalArgumentException("SMTP port must be between 1 and 65535");
        }

        GatewaySettings settings = current();
        settings.setSmtpHost(smtpHost);
        settings.setSmtpPort(port);
        if (body.getSmtpUser() != null && !body.getSmtpUser().trim().isEmpty()) {
            settings.setSmtpUser(body.getSmtpUser().trim());
        }
        settings.setSmtpSecure(Boolean.TRUE.equals(body.getSmtpSecure()));
        settings.setSmsProvider(body.getSmsProvider() == null ? "" : body.getSmsProvider().trim());
        settings.setSmsSenderId(body.getSmsSenderId() == null ? "" : body.getSmsSenderId().trim());
        settings.setUpdatedAt(Instant.now());
        return repository.save(settings);
    }

    private GatewaySettings current() {
        return repository.findAll().stream().findFirst().orElseGet(() -> {
            GatewaySettings settings = new GatewaySettings();
            settings.setSmtpHost("smtp.sacco.local");
            settings.setSmtpPort(587);
            settings.setSmtpSecure(Boolean.TRUE);
            settings.setUpdatedAt(Instant.now());
            return repository.save(settings);
        });
    }
}
