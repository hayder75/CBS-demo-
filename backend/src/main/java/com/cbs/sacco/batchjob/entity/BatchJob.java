package com.cbs.sacco.batchjob.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "batch_job")
public class BatchJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_type", nullable = false)
    private String jobType;

    @Column(nullable = false)
    private String name;

    @Column(name = "job_status")
    private String status = "Idle";

    @Column(name = "last_run_at")
    private Instant lastRunAt;
}
