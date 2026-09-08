package com.cbs.sacco.checkoff.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "checkoff_batch")
public class CheckOffBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String employer;

    @Column(name = "batch_month", nullable = false)
    private String month;

    @Column(name = "uploaded_at")
    private Instant uploadedAt;

    @Column(name = "row_count")
    private Integer rows;

    private Integer matched;

    private Integer unmatched;

    private BigDecimal expected = BigDecimal.ZERO;

    private BigDecimal received = BigDecimal.ZERO;

    private BigDecimal variance = BigDecimal.ZERO;

    @Column(name = "batch_status")
    private String status = "Pending";
}