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
@Table(name = "referral_code")
public class ReferralCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_name")
    private String memberName;

    @Column(nullable = false, length = 20)
    private String status = "Active";

    @Column(name = "uses", nullable = false)
    private Integer uses = 0;

    @Column(name = "reward_amount", nullable = false)
    private BigDecimal rewardAmount = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
