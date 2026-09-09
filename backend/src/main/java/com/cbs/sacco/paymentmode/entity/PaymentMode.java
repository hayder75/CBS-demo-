package com.cbs.sacco.paymentmode.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "payment_mode")
public class PaymentMode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "payment_type")
    private String paymentType = "CASH";

    private String description;

    @Column(name = "mode_status")
    private String status = "Pending";
}
