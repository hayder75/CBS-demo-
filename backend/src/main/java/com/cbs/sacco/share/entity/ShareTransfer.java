package com.cbs.sacco.share.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "share_transfer")
public class ShareTransfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transfer_date", nullable = false)
    private LocalDate date;

    @Column(name = "from_member", nullable = false)
    private String fromMember;

    @Column(name = "to_member", nullable = false)
    private String toMember;

    @Column(name = "share_count")
    private Integer shares;

    @Column(name = "amount")
    private BigDecimal value = BigDecimal.ZERO;

    @Column(name = "transfer_status")
    private String status = "Pending";
}