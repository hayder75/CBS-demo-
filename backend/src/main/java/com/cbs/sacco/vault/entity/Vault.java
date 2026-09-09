package com.cbs.sacco.vault.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "vault")
public class Vault {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String location;

    @Column(name = "vault_type")
    private String type = "BRANCH";

    @Column(name = "vault_status")
    private String status = "Pending";
}
