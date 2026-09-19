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
@Table(name = "bank_transaction")
public class BankTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bank_account_id", nullable = false)
    private Long bankAccountId;

    @Column(name = "txn_date", nullable = false)
    private LocalDate date;

    private String ref;

    private String description;

    @Column(name = "txn_type", nullable = false)
    private String type = "Deposit";

    @Column(nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "recon_status", nullable = false)
    private String reconStatus = "Unmatched";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
