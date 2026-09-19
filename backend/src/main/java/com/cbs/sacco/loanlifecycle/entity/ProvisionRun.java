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
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "provision_run")
public class ProvisionRun {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_date")
    private LocalDate businessDate;

    @Column(name = "loans_processed")
    private Integer loansProcessed = 0;

    @Column(name = "total_provision")
    private BigDecimal totalProvision = BigDecimal.ZERO;

    @Column(name = "run_at")
    private LocalDateTime runAt;

    @Column(name = "run_by")
    private String runBy;
}
