package com.cbs.sacco.share.entity;

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
@Table(name = "dividend_run")
public class DividendRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fin_year", nullable = false, unique = true)
    private String year;

    @Column(name = "total_surplus")
    private BigDecimal totalSurplus = BigDecimal.ZERO;

    @Column(name = "statutory_reserve")
    private BigDecimal statutoryReserve = BigDecimal.ZERO;

    private BigDecimal distributable = BigDecimal.ZERO;

    @Column(name = "eligible_members")
    private Integer eligibleMembers = 0;

    @Column(name = "dividend_per_share")
    private BigDecimal dividendPerShare = BigDecimal.ZERO;

    @Column(name = "total_distribution")
    private BigDecimal totalDistribution = BigDecimal.ZERO;

    @Column(name = "dividend_status")
    private String status = "Proposed";
}