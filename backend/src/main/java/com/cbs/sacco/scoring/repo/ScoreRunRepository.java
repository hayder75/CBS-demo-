package com.cbs.sacco.scoring.repo;

import com.cbs.sacco.scoring.entity.ScoreRun;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScoreRunRepository extends JpaRepository<ScoreRun, Long> {
    List<ScoreRun> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<ScoreRun> findTop50ByOrderByCreatedAtDesc();
}
