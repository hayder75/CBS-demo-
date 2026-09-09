package com.cbs.sacco.account.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "signatory")
public class Signatory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "is_primary")
    private Boolean primary = false;
}
