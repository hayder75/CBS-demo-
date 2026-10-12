package com.cbs.sacco.scoring.repo;

import com.cbs.sacco.scoring.entity.MemberFeatureSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MemberFeatureSnapshotRepository extends JpaRepository<MemberFeatureSnapshot, Long> {
    Optional<MemberFeatureSnapshot> findByMemberId(Long memberId);
}
