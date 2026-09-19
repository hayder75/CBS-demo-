package com.cbs.sacco.daycontrol.repo;

import com.cbs.sacco.daycontrol.entity.BranchCob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BranchCobRepository extends JpaRepository<BranchCob, Long> {
    List<BranchCob> findByBusinessDateOrderByIdAsc(LocalDate businessDate);
    Optional<BranchCob> findByBusinessDateAndBranchId(LocalDate businessDate, Long branchId);
}
