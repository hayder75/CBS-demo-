package com.cbs.sacco.bank.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "bank_recon_session")
public class BankReconSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bank_account_id", nullable = false)
    private Long bankAccountId;

    @Column(name = "bank_account_label")
    private String bankAccountLabel;

    @Column(name = "statement_date", nullable = false)
    private LocalDate statementDate;

    @Column(name = "statement_balance", nullable = false)
    private BigDecimal statementBalance = BigDecimal.ZERO;

    @Column(name = "book_balance", nullable = false)
    private BigDecimal bookBalance = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal difference = BigDecimal.ZERO;

    @Column(nullable = false)
    private String status = "Open";

    @Column(name = "matched_count", nullable = false)
    private Integer matchedCount = 0;

    @Column(name = "unmatched_count", nullable = false)
    private Integer unmatchedCount = 0;

    @Column(name = "started_by")
    private String startedBy;

    @Column(name = "started_at")
    private Instant startedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;
}
