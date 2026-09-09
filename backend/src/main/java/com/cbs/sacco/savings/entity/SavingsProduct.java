package com.cbs.sacco.savings.entity;

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
@Table(name = "savings_product")
public class SavingsProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "product_type", nullable = false)
    private String type;

    @Column(name = "interest_rate_pct")
    private BigDecimal interestRatePct = BigDecimal.ZERO;

    @Column(name = "min_balance")
    private BigDecimal minBalance = BigDecimal.ZERO;

    @Column(name = "notice_period_days")
    private Integer noticePeriodDays;

    @Column(name = "product_status")
    private String status = "Verified";
}