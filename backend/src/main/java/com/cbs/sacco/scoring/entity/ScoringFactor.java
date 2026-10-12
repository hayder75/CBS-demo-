package com.cbs.sacco.scoring.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "scoring_factor")
public class ScoringFactor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "policy_id", nullable = false)
    private Long policyId;
    @Column(nullable = false)
    private String code;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private BigDecimal weight = BigDecimal.ONE;
    @Column(nullable = false)
    private String direction = "POSITIVE";
    private String description;
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
