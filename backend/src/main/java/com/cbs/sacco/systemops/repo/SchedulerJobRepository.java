package com.cbs.sacco.systemops.repo;

import com.cbs.sacco.systemops.entity.SchedulerJob;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchedulerJobRepository extends JpaRepository<SchedulerJob, Long> {}
