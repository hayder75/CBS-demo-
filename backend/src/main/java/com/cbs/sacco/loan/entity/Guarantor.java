package com.cbs.sacco.loan.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "guarantor")
public class Guarantor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id")
    private Loan loan;

    @Column(name = "member_id")
    private Long memberId;

    @Column(nullable = false)
    private String name;

    private BigDecimal exposure = BigDecimal.ZERO;

    @Column(name = "pledged_deposit")
    private BigDecimal pledgedDeposit = BigDecimal.ZERO;

    @Column(name = "guarantor_status")
    private String status = "Active";
}