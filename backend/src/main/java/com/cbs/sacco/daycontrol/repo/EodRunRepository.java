package com.cbs.sacco.daycontrol.repo;

import com.cbs.sacco.daycontrol.entity.EodRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EodRunRepository extends JpaRepository<EodRun, Long> {
    List<EodRun> findAllByOrderByStartedAtDesc();
}
