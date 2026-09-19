package com.cbs.sacco.compliance.entity;

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
@Table(name = "compliance_policy")
public class CompliancePolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "liquidity_min_pct", nullable = false)
    private BigDecimal liquidityMinPct = new BigDecimal("20");

    @Column(name = "exposure_max_pct", nullable = false)
    private BigDecimal exposureMaxPct = new BigDecimal("25");

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
