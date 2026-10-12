package com.cbs.sacco.scoring.repo;

import com.cbs.sacco.scoring.entity.ScoringPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ScoringPolicyRepository extends JpaRepository<ScoringPolicy, Long> {
    Optional<ScoringPolicy> findFirstByActiveTrueOrderByVersionDesc();
    List<ScoringPolicy> findAllByOrderByVersionDesc();
}
