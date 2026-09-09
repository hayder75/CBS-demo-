package com.cbs.sacco.committee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "credit_committee")
public class CreditCommittee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "min_amount")
    private BigDecimal minAmount = BigDecimal.ZERO;

    @Column(name = "max_amount")
    private BigDecimal maxAmount = BigDecimal.ZERO;

    @Column(name = "committee_status")
    private String status = "Pending";
}
