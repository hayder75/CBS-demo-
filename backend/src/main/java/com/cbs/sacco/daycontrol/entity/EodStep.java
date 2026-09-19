package com.cbs.sacco.daycontrol.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "eod_step")
public class EodStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "eod_run_id", nullable = false)
    private Long eodRunId;

    @Column(name = "step_key", nullable = false)
    private String key;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "step_status", nullable = false)
    private String status = "Pending";

    @Column(name = "processed", nullable = false)
    private Integer processed = 0;

    @Column(name = "message")
    private String message;
}
