package com.cbs.sacco.loan.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "loan")
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "loan_no", nullable = false, unique = true)
    private String loanNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id")
    private LoanProduct product;

    @Column(name = "loan_status", nullable = false)
    private String status = "Pending";

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "disbursed_at")
    private LocalDate disbursedAt;

    @Column(name = "term_months")
    private Integer termMonths;

    @Column(name = "rate_pct")
    private BigDecimal ratePct;

    @Column(name = "schedule_type")
    private String scheduleType;

    @Column(name = "principal_paid")
    private BigDecimal principalPaid = BigDecimal.ZERO;

    @Column(name = "interest_paid")
    private BigDecimal interestPaid = BigDecimal.ZERO;

    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "overdue_days")
    private Integer overdueDays = 0;

    @Column(nullable = false)
    private String classification = "Pass";

    @Column(name = "ai_score")
    private Integer aiScore;

    @Column(name = "ai_pd_pct")
    private BigDecimal aiPdPct;

    @Column(name = "ai_guidance")
    private String aiGuidance;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    @OneToMany(mappedBy = "loan", fetch = FetchType.EAGER)
    private List<Guarantor> guarantors = new ArrayList<>();
}