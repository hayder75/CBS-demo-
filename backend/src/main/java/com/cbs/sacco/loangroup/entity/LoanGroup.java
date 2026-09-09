package com.cbs.sacco.loangroup.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "loan_group")
public class LoanGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "max_members")
    private Integer maxMembers = 0;

    @Column(name = "group_status")
    private String status = "Pending";
}
