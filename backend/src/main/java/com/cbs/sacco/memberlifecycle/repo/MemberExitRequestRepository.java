package com.cbs.sacco.memberlifecycle.repo;

import com.cbs.sacco.memberlifecycle.entity.MemberExitRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MemberExitRequestRepository extends JpaRepository<MemberExitRequest, Long> {
    List<MemberExitRequest> findAllByOrderByRequestedAtDesc();

    List<MemberExitRequest> findByMemberIdOrderByRequestedAtDesc(Long memberId);

    boolean existsByMemberIdAndStatusIn(Long memberId, Collection<String> statuses);
}
