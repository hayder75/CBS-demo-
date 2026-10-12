package com.cbs.sacco.scoring.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "scoring_policy")
public class ScoringPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Integer version;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private Boolean active = false;
    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom = LocalDate.now();
    @Column(name = "min_score_auto_approve", nullable = false)
    private BigDecimal minScoreAutoApprove = new BigDecimal("75");
    @Column(name = "min_score_refer", nullable = false)
    private BigDecimal minScoreRefer = new BigDecimal("55");
    @Column(name = "max_loan_to_savings", nullable = false)
    private BigDecimal maxLoanToSavings = new BigDecimal("3");
    @Column(name = "base_interest_pct", nullable = false)
    private BigDecimal baseInterestPct = new BigDecimal("14");
    @Column(name = "max_amount", nullable = false)
    private BigDecimal maxAmount = new BigDecimal("500000");
    private String notes;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
