package com.cbs.sacco.reservation.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(name = "fund_reservation")
public class FundReservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    private String reason;

    @Column(name = "reserved_at")
    private Instant reservedAt = Instant.now();

    @Column(name = "reserved_by")
    private String reservedBy;

    @Column(name = "reservation_status")
    private String status = "Active";
}
