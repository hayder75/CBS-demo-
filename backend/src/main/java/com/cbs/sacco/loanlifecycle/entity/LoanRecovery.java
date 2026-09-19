package com.cbs.sacco.loanlifecycle.entity;

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
@Table(name = "loan_recovery")
public class LoanRecovery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_id", nullable = false)
    private Long loanId;

    @Column(name = "loan_no")
    private String loanNo;

    @Column(name = "member_name")
    private String memberName;

    @Column(name = "recovery_date")
    private LocalDate date;

    @Column(nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "recovery_source")
    private String source = "Cash";

    @Column(name = "recorded_by")
    private String recordedBy;
}
