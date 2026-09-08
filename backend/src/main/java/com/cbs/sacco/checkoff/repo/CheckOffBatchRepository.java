package com.cbs.sacco.checkoff.repo;

import com.cbs.sacco.checkoff.entity.CheckOffBatch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckOffBatchRepository extends JpaRepository<CheckOffBatch, Long> {}