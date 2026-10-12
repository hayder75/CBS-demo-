package com.cbs.sacco.scoring.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "score_run")
public class ScoreRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    @Column(name = "loan_id")
    private Long loanId;
    @Column(name = "policy_id", nullable = false)
    private Long policyId;
    @Column(nullable = false)
    private BigDecimal score;
    @Column(nullable = false)
    private String grade;
    @Column(name = "pd_pct", nullable = false)
    private BigDecimal pdPct;
    @Column(nullable = false)
    private String decision;
    @Column(name = "recommended_amount", nullable = false)
    private BigDecimal recommendedAmount = BigDecimal.ZERO;
    @Column(name = "recommended_term", nullable = false)
    private Integer recommendedTerm = 0;
    @Column(name = "interest_pct", nullable = false)
    private BigDecimal interestPct = BigDecimal.ZERO;
    private String narration;
    @Column(name = "factors_json")
    private String factorsJson;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    @Column(name = "created_by")
    private String createdBy;
    @Column(name = "override_decision")
    private String overrideDecision;
    @Column(name = "override_reason")
    private String overrideReason;
    @Column(name = "override_by")
    private String overrideBy;
    @Column(name = "override_at")
    private Instant overrideAt;
}
