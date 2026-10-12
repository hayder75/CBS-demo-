package com.cbs.sacco.usergroup.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "user_group")
public class UserGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "max_login_attempts", nullable = false)
    private Integer maxLoginAttempts = 5;

    @Column(name = "multiple_machine_logins", nullable = false)
    private Boolean multipleMachineLogins = false;

    @Column(name = "branch_specific", nullable = false)
    private Boolean branchSpecific = false;

    @Column(name = "multiple_users", nullable = false)
    private Boolean multipleUsers = true;

    private String description;

    @Column(nullable = false)
    private String permissions = "";

    @Column(name = "group_status", nullable = false)
    private String status = "Verified";
}
