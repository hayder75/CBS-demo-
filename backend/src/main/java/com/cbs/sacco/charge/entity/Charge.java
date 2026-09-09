package com.cbs.sacco.charge.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "charge")
public class Charge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "service_type")
    private String serviceType;

    @Column(name = "gl_account_id")
    private Long glAccountId;

    @Column(name = "calc_type")
    private String calcType = "Flat";

    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "apply_penalty")
    private Boolean applyPenalty = false;

    @Column(name = "charge_status")
    private String status = "Pending";
}
