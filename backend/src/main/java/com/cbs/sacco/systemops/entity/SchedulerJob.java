package com.cbs.sacco.systemops.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;

@Data
@Entity
@Table(name = "scheduler_job")
public class SchedulerJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "cron_expression", nullable = false)
    private String cron;

    @Column(name = "last_run")
    private Instant lastRun;

    @Column(name = "next_run")
    private Instant nextRun;

    @Column(name = "job_status", nullable = false)
    private String status = "Idle";
}
