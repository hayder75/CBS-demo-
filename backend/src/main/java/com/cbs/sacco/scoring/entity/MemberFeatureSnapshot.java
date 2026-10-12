package com.cbs.sacco.scoring.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "member_feature_snapshot")
public class MemberFeatureSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "member_id", nullable = false, unique = true)
    private Long memberId;
    @Column(name = "savings_avg_balance", nullable = false)
    private BigDecimal savingsAvgBalance = BigDecimal.ZERO;
    @Column(name = "deposit_freq_monthly", nullable = false)
    private BigDecimal depositFreqMonthly = BigDecimal.ZERO;
    @Column(name = "savings_growth_pct", nullable = false)
    private BigDecimal savingsGrowthPct = BigDecimal.ZERO;
    @Column(name = "share_balance", nullable = false)
    private BigDecimal shareBalance = BigDecimal.ZERO;
    @Column(name = "on_time_pct", nullable = false)
    private BigDecimal onTimePct = new BigDecimal("100");
    @Column(name = "arrears_days", nullable = false)
    private Integer arrearsDays = 0;
    @Column(name = "par_ratio", nullable = false)
    private BigDecimal parRatio = BigDecimal.ZERO;
    @Column(name = "dti_pct", nullable = false)
    private BigDecimal dtiPct = BigDecimal.ZERO;
    @Column(name = "loan_to_savings", nullable = false)
    private BigDecimal loanToSavings = BigDecimal.ZERO;
    @Column(name = "tenure_months", nullable = false)
    private Integer tenureMonths = 0;
    @Column(name = "collateral_coverage_pct", nullable = false)
    private BigDecimal collateralCoveragePct = BigDecimal.ZERO;
    @Column(name = "guarantor_score", nullable = false)
    private BigDecimal guarantorScore = new BigDecimal("60");
    @Column(name = "kyc_complete", nullable = false)
    private Boolean kycComplete = true;
    @Column(name = "computed_at", nullable = false)
    private Instant computedAt = Instant.now();
}
