package com.cbs.sacco.referral.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "referral_record")
public class ReferralRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(name = "referrer_name")
    private String referrerName;

    @Column(name = "referee_name", nullable = false)
    private String refereeName;

    @Column(name = "referee_phone", nullable = false, length = 30)
    private String refereePhone;

    @Column(nullable = false, length = 20)
    private String status = "Pending";

    @Column(name = "reward_amount", nullable = false)
    private BigDecimal rewardAmount = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "qualified_at")
    private Instant qualifiedAt;

    @Column(name = "rewarded_at")
    private Instant rewardedAt;

    @Column(length = 500)
    private String note;
}
