package com.cbs.sacco.accounting.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "gl_class")
public class GlClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "class_status")
    private String status = "Pending";
}
