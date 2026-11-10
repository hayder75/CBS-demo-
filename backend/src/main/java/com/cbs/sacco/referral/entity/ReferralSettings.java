package com.cbs.sacco.referral.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "referral_settings")
public class ReferralSettings {
    @Id
    private Long id;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "reward_per_referral", nullable = false)
    private BigDecimal rewardPerReferral = new BigDecimal("100");

    @Column(name = "min_qualifying_deposit", nullable = false)
    private BigDecimal minQualifyingDeposit = new BigDecimal("500");

    @Column(name = "reward_mode", nullable = false, length = 20)
    private String rewardMode = "Savings";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
