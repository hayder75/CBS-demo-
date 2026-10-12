package com.cbs.sacco.scoring.repo;

import com.cbs.sacco.scoring.entity.ScoringBand;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScoringBandRepository extends JpaRepository<ScoringBand, Long> {
    List<ScoringBand> findByPolicyIdOrderByMinScoreDesc(Long policyId);
}
