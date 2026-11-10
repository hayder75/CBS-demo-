package com.cbs.sacco.memberlifecycle.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(name = "dormancy_policy")
public class DormancyPolicy {
    @Id
    private Long id;

    @Column(nullable = false)
    private Integer months = 12;

    @Column(name = "auto_flag_members", nullable = false)
    private Boolean autoFlagMembers = true;

    @Column(name = "auto_flag_accounts", nullable = false)
    private Boolean autoFlagAccounts = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
