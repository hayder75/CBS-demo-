package com.cbs.sacco.document.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "document_type")
public class DocumentType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category = "Customer";

    @Column(nullable = false)
    private Boolean mandatory = false;

    @Column(name = "retention_years", nullable = false)
    private Integer retentionYears = 5;

    private String description;

    @Column(name = "doc_status", nullable = false)
    private String status = "Pending";
}
