package com.cbs.sacco.termdeposit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "term_deposit")
public class TermDeposit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_no", nullable = false, unique = true)
    private String accountNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_name")
    private String memberName;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name")
    private String productName;

    @Column(nullable = false)
    private BigDecimal principal = BigDecimal.ZERO;

    @Column(name = "rate_pct")
    private BigDecimal ratePct = BigDecimal.ZERO;

    @Column(name = "term_months", nullable = false)
    private Integer termMonths = 0;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "maturity_date", nullable = false)
    private LocalDate maturityDate;

    @Column(name = "interest_accrued")
    private BigDecimal interestAccrued = BigDecimal.ZERO;

    @Column(name = "maturity_value")
    private BigDecimal maturityValue = BigDecimal.ZERO;

    @Column(name = "penalty_pct")
    private BigDecimal penaltyPct = BigDecimal.ZERO;

    @Column(name = "deposit_status")
    private String status = "Active";

    @Column(name = "linked_account_id")
    private Long linkedAccountId;

    @Column(name = "broken_at")
    private Instant brokenAt;

    @Column(name = "broken_by")
    private String brokenBy;
}
