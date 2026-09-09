package com.cbs.sacco.batchjob.repo;

import com.cbs.sacco.batchjob.entity.BatchJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BatchJobRepository extends JpaRepository<BatchJob, Long> {
    List<BatchJob> findByStatus(String status);
}
