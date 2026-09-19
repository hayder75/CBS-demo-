package com.cbs.sacco.notificationtemplate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(name = "notification_gateway_settings")
public class GatewaySettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "smtp_host", nullable = false)
    private String smtpHost;

    @Column(name = "smtp_port", nullable = false)
    private Integer smtpPort = 587;

    @Column(name = "smtp_user")
    private String smtpUser;

    @Column(name = "smtp_secure", nullable = false)
    private Boolean smtpSecure = Boolean.TRUE;

    @Column(name = "sms_provider")
    private String smsProvider;

    @Column(name = "sms_sender_id")
    private String smsSenderId;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();
}
