package com.cbs.sacco.daycontrol.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "system_business_date")
public class SystemBusinessDate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_date", nullable = false)
    private LocalDate businessDate;

    @Column(name = "next_business_date", nullable = false)
    private LocalDate nextBusinessDate;

    @Column(name = "day_status", nullable = false)
    private String status = "Open";

    @Column(name = "last_eod_date")
    private LocalDate lastEodDate;
}
