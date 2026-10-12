package com.cbs.sacco.scoring.repo;

import com.cbs.sacco.scoring.entity.ScoringFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScoringFactorRepository extends JpaRepository<ScoringFactor, Long> {
    List<ScoringFactor> findByPolicyIdOrderBySortOrderAsc(Long policyId);
}
