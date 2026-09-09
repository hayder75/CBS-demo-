package com.cbs.sacco.asset.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "fixed_asset")
public class FixedAsset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private BigDecimal value = BigDecimal.ZERO;

    @Column(name = "der_rate")
    private BigDecimal depreciationRate = BigDecimal.ZERO;

    @Column(name = "dpr_link")
    private String dprLink;

    @Column(name = "gl_link")
    private String glLink;

    private String branch;

    @Column(name = "asset_status")
    private String status = "Active";
}
