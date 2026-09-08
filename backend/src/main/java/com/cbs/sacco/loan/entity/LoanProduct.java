package com.cbs.sacco.loan.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "loan_product")
public class LoanProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "rate_pct")
    private BigDecimal ratePct;

    @Column(name = "max_term_months")
    private Integer maxTermMonths;

    @Column(name = "max_amount")
    private BigDecimal maxAmount;

    @Column(nullable = false)
    private String schedule;

    @Column(name = "processing_fee_pct")
    private BigDecimal processingFeePct = BigDecimal.ZERO;
}