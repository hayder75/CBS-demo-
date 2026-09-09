package com.cbs.sacco.sharecategory.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "share_category")
public class ShareCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "total_shares")
    private Integer totalShares = 0;

    @Column(name = "nominal_price")
    private BigDecimal nominalPrice = BigDecimal.ZERO;

    @Column(name = "shares_for_sale")
    private Integer sharesForSale = 0;

    @Column(name = "min_per_customer")
    private Integer minPerCustomer = 1;

    @Column(name = "max_per_customer")
    private Integer maxPerCustomer = 0;

    @Column(name = "payment_agreement_months")
    private Integer paymentAgreementMonths = 0;

    @Column(name = "cat_status")
    private String status = "Pending";
}
