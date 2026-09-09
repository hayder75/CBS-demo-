package com.cbs.sacco.transactionlimit.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "transaction_limit", uniqueConstraints =
    @UniqueConstraint(columnNames = {"role_code", "txn_type"}))
public class TransactionLimit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_code", nullable = false)
    private String roleCode;

    @Column(name = "txn_type", nullable = false)
    private String txnType;

    @Column(name = "max_amount", nullable = false)
    private BigDecimal maxAmount = BigDecimal.ZERO;
}
