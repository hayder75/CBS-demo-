package com.cbs.sacco.loancategory.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "loan_category")
public class LoanCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "cat_status")
    private String status = "Pending";
}
