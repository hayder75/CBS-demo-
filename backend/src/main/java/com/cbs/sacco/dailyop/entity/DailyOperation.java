package com.cbs.sacco.dailyop.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.Instant;

@Data
@Entity
@Table(name = "daily_operation")
public class DailyOperation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "op_date", nullable = false)
    private LocalDate opDate = LocalDate.now();

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "vault_id")
    private Long vaultId;

    @Column(name = "op_status")
    private String status = "Open";

    @Column(name = "opened_by")
    private String openedBy;

    @Column(name = "opened_at")
    private Instant openedAt = Instant.now();

    @Column(name = "closed_by")
    private String closedBy;

    @Column(name = "closed_at")
    private Instant closedAt;
}
