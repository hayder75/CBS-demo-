package com.cbs.sacco.scoring.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "scoring_band")
public class ScoringBand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "policy_id", nullable = false)
    private Long policyId;
    @Column(nullable = false)
    private String grade;
    @Column(name = "min_score", nullable = false)
    private BigDecimal minScore;
    @Column(name = "max_score", nullable = false)
    private BigDecimal maxScore;
    @Column(name = "pd_pct", nullable = false)
    private BigDecimal pdPct;
    @Column(name = "interest_pct", nullable = false)
    private BigDecimal interestPct;
}
