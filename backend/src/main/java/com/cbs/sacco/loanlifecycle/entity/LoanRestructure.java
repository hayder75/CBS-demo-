package com.cbs.sacco.loanlifecycle.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "loan_restructure")
public class LoanRestructure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_id", nullable = false)
    private Long loanId;

    @Column(name = "loan_no")
    private String loanNo;

    @Column(name = "member_name")
    private String memberName;

    @Column(name = "old_term_months")
    private Integer oldTermMonths;

    @Column(name = "new_term_months", nullable = false)
    private Integer newTermMonths;

    @Column(name = "old_rate_pct")
    private BigDecimal oldRatePct = BigDecimal.ZERO;

    @Column(name = "new_rate_pct")
    private BigDecimal newRatePct = BigDecimal.ZERO;

    private BigDecimal outstanding = BigDecimal.ZERO;

    @Column(length = 500)
    private String reason;

    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "restructure_status")
    private String status = "Pending";

    @Column(name = "requested_by")
    private String requestedBy;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;
}
