package com.cbs.sacco.sharecategory.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "share_request")
public class ShareRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "share_account_id", nullable = false)
    private Long shareAccountId;

    @Column(name = "request_type", nullable = false)
    private String requestType;

    @Column(name = "share_count")
    private Integer shareCount = 0;

    @Column(name = "request_status")
    private String status = "Pending";
}
