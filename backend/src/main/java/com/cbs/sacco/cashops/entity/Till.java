package com.cbs.sacco.cashops.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "till")
public class Till {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teller_name", nullable = false)
    private String teller;

    private BigDecimal opening = BigDecimal.ZERO;

    private BigDecimal deposits = BigDecimal.ZERO;

    private BigDecimal withdrawals = BigDecimal.ZERO;

    private BigDecimal closing = BigDecimal.ZERO;

    private BigDecimal expected = BigDecimal.ZERO;

    private BigDecimal variance = BigDecimal.ZERO;

    @Column(name = "till_status")
    private String status = "Open";
}