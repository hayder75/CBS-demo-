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
@Table(name = "cash_movement")
public class CashMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "movement_date", nullable = false)
    private LocalDate date;

    @Column(name = "from_location", nullable = false)
    private String from;

    @Column(name = "to_location", nullable = false)
    private String to;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "initiated_by", nullable = false)
    private String initiatedBy;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "movement_status")
    private String status = "Pending";

    @Column(name = "movement_type", nullable = false)
    private String type;
}