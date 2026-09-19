package com.cbs.sacco.glrule.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "gl_posting_rule")
public class GlPostingRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String event;

    private String description;

    @Column(name = "product_type", nullable = false)
    private String productType;

    @Column(name = "debit_account_code", nullable = false)
    private String debitAccountCode;

    @Column(name = "credit_account_code", nullable = false)
    private String creditAccountCode;

    @Column(name = "rule_status", nullable = false)
    private String status = "Active";
}
