package com.cbs.sacco.daycontrol.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "branch_cob")
public class BranchCob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "branch_name", nullable = false)
    private String branch;

    @Column(name = "business_date", nullable = false)
    private LocalDate businessDate;

    @Column(name = "cob_status", nullable = false)
    private String status = "Open";

    @Column(name = "closed_by")
    private String closedBy;

    @Column(name = "closed_at")
    private Instant closedAt;
}
