package com.cbs.sacco.ga.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ga_resolution")
public class GaResolution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ref;

    @Column(name = "fin_year", nullable = false)
    private Integer year;

    @Column(name = "total_surplus")
    private BigDecimal totalSurplus = BigDecimal.ZERO;

    @Column(name = "dividend_pct")
    private BigDecimal dividendPct = BigDecimal.ZERO;

    @Column(name = "reserve_pct")
    private BigDecimal reservePct = BigDecimal.ZERO;

    private BigDecimal distributable = BigDecimal.ZERO;

    @Column(name = "dividend_per_share")
    private BigDecimal dividendPerShare = BigDecimal.ZERO;

    @Column(name = "eligible_members")
    private Integer eligibleMembers = 0;

    @Column(name = "total_dividend")
    private BigDecimal totalDividend = BigDecimal.ZERO;

    @Column(name = "total_reserve")
    private BigDecimal totalReserve = BigDecimal.ZERO;

    @Column(name = "resolution_status")
    private String status = "Draft";

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @Column(length = 500)
    private String note;
}
