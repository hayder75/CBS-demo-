package com.cbs.sacco.sms.entity;

import com.cbs.sacco.common.crypto.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(name = "sms_otp_challenge")
public class SmsOtpChallenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(nullable = false, length = 255)
    private String phone;

    @Column(length = 40)
    private String purpose;

    @Column(length = 160)
    private String vc;

    @Column(nullable = false, length = 20)
    private String status = "Pending";

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;
}
