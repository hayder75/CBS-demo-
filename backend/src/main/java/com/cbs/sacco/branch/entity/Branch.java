package com.cbs.sacco.branch.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "branch")
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String address;

    private String phone;

    @Column(name = "branch_status")
    private String status = "Pending";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
