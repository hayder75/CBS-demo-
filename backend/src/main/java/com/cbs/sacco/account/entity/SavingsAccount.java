package com.cbs.sacco.account.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

@Data
@Entity
@Table(name = "savings_account")
public class SavingsAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_no", nullable = false, unique = true)
    private String accountNo;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "account_type")
    private String accountType = "Saving";

    @Column(name = "opened_date")
    private LocalDate openedDate = LocalDate.now();

    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "acc_status")
    private String status = "Pending";

    @Column(name = "currency_id")
    private Long currencyId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
