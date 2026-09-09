package com.cbs.sacco.currency.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "currency")
public class Currency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "notes_label")
    private String notesLabel;

    @Column(name = "cents_label")
    private String centsLabel;

    @Column(name = "exchange_rate")
    private java.math.BigDecimal exchangeRate = java.math.BigDecimal.ONE;

    @Column(name = "currency_status")
    private String status = "Pending";
}
