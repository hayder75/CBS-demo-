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
@Table(name = "notification_template")
public class NotificationTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String channel = "Email";

    private String event;

    private String subject;

    @Column(name = "message_body", nullable = false)
    private String body;

    @Column(nullable = false)
    private Boolean enabled = Boolean.TRUE;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();
}
