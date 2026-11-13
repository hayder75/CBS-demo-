package com.cbs.sacco.sms.entity;

import com.cbs.sacco.common.crypto.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(name = "sms_log")
public class SmsLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(nullable = false, length = 255)
    private String phone;

    @Column(length = 40)
    private String purpose;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 240)
    private String detail;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
