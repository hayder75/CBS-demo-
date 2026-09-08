package com.cbs.sacco.cashops.entity;

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
@Table(name = "petty_cash")
public class PettyCash {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entry_date", nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String description;

    private String category;

    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "receipt_no")
    private String receiptNo;

    @Column(name = "pc_status")
    private String status = "Open";
}