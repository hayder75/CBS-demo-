package com.cbs.sacco.daycontrol.repo;

import com.cbs.sacco.daycontrol.entity.EodStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EodStepRepository extends JpaRepository<EodStep, Long> {
    List<EodStep> findByEodRunIdOrderByIdAsc(Long eodRunId);
}
