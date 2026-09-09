package com.cbs.sacco.loangroup.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "loan_group_member")
public class LoanGroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    private BigDecimal amount = BigDecimal.ZERO;

    private Integer installments = 0;

    @Column(name = "grace_months")
    private Integer graceMonths = 0;
}
