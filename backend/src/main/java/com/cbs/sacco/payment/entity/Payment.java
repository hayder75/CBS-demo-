package com.cbs.sacco.payment.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_no", nullable = false, unique = true)
    private String paymentNo;

    @Column(nullable = false)
    private String kind;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "account_id")
    private Long accountId;

    @Column(name = "from_ref")
    private String fromRef;

    @Column(name = "to_ref")
    private String toRef;

    @Column(nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "payment_mode_id")
    private Long paymentModeId;

    private String description;

    @Column(name = "pay_status")
    private String status = "Pending";

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "authorized_by")
    private String authorizedBy;

    @Column(name = "authorized_at")
    private Instant authorizedAt;

    @Column(name = "reversal_of")
    private Long reversalOf;
}
