package com.cbs.sacco.loanlifecycle.entity;

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
@Table(name = "loan_auto_debit")
public class LoanAutoDebit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_id")
    private Long loanId;

    @Column(name = "loan_no")
    private String loanNo;

    @Column(name = "member_name")
    private String memberName;

    private BigDecimal installment = BigDecimal.ZERO;

    @Column(name = "savings_balance")
    private BigDecimal savingsBalance = BigDecimal.ZERO;

    @Column(name = "debit_status")
    private String status = "Scheduled";
}
