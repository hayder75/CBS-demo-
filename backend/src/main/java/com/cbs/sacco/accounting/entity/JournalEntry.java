package com.cbs.sacco.accounting.entity;

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
@Table(name = "journal_entry")
public class JournalEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "jrn_date", nullable = false)
    private LocalDate date;

    @Column(name = "ref_no", nullable = false)
    private String ref;

    private String description;

    @Column(name = "account_code", nullable = false)
    private String accountCode;

    @Column(name = "account_name")
    private String accountName;

    private BigDecimal debit = BigDecimal.ZERO;

    private BigDecimal credit = BigDecimal.ZERO;

    @Column(name = "posted_by")
    private String postedBy;
}