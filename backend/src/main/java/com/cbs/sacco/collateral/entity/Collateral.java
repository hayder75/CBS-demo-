package com.cbs.sacco.collateral.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "collateral")
public class Collateral {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "asset_type", nullable = false)
    private String type;

    @Column(name = "owner_name", nullable = false)
    private String owner;

    private String description;

    private BigDecimal valuation = BigDecimal.ZERO;

    @Column(name = "forced_sale_value")
    private BigDecimal forcedSaleValue = BigDecimal.ZERO;

    @Column(name = "discount_pct")
    private BigDecimal discountPct = BigDecimal.ZERO;

    @Column(name = "loan_id")
    private Long loanId;

    @Column(name = "loan_ref")
    private String loanRef;

    @Column(name = "insurance_expiry")
    private LocalDate insuranceExpiry;

    @Column(name = "coll_status", nullable = false)
    private String status = "Pledged";
}