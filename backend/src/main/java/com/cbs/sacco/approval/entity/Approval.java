package com.cbs.sacco.approval.entity;

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
@Table(name = "approval")
public class Approval {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "approval_type", nullable = false)
    private String type;

    @Column(name = "ref_no", nullable = false)
    private String ref;

    private String summary;

    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "initiated_by", nullable = false)
    private String initiatedBy;

    @Column(name = "requested_at")
    private Instant requestedAt;

    @Column(name = "approval_status", nullable = false)
    private String status = "Pending";

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "decided_at")
    private Instant decidedAt;
}