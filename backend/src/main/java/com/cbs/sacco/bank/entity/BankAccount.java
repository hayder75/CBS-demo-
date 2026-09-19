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

@Data
@Entity
@Table(name = "bank_account")
public class BankAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @Column(name = "account_no", nullable = false, unique = true)
    private String accountNo;

    private String branch;

    @Column(name = "currency_code")
    private String currencyCode = "ETB";

    @Column(name = "book_balance", nullable = false)
    private BigDecimal bookBalance = BigDecimal.ZERO;

    @Column(nullable = false)
    private String status = "Active";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
