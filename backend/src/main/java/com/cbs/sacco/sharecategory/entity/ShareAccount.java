package com.cbs.sacco.sharecategory.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "share_account")
public class ShareAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "saving_account_id")
    private Long savingAccountId;

    @Column(name = "share_count")
    private Integer shareCount = 0;

    private String description;

    @Column(name = "sacc_status")
    private String status = "Pending";
}
