package com.cbs.sacco.savings.entity;

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
@Table(name = "savings_product")
public class SavingsProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "product_type", nullable = false)
    private String type;

    @Column(name = "interest_rate_pct")
    private BigDecimal interestRatePct = BigDecimal.ZERO;

    @Column(name = "min_balance")
    private BigDecimal minBalance = BigDecimal.ZERO;

    @Column(name = "notice_period_days")
    private Integer noticePeriodDays;

    @Column(name = "product_status")
    private String status = "Verified";

    @Column(name = "interest_method")
    private String interestMethod = "Daily Outstanding";

    @Column(name = "maintenance_fee")
    private BigDecimal maintenanceFee = BigDecimal.ZERO;

    @Column(name = "maintenance_fee_frequency")
    private String maintenanceFeeFrequency = "None";

    @Column(name = "passbook_fee")
    private BigDecimal passbookFee = BigDecimal.ZERO;

    @Column(name = "overdraft_allowed")
    private boolean overdraftAllowed = false;

    @Column(name = "overdraft_limit")
    private BigDecimal overdraftLimit = BigDecimal.ZERO;

    @Column(name = "auto_create")
    private boolean autoCreate = false;

    @Column(name = "compulsory")
    private boolean compulsory = false;

    @Column(name = "lock_in_months")
    private int lockInMonths = 0;

    @Column(name = "gl_liability_code")
    private String glLiabilityCode;

    @Column(name = "gl_interest_expense_code")
    private String glInterestExpenseCode;

    @Column(name = "gl_fee_income_code")
    private String glFeeIncomeCode;
}