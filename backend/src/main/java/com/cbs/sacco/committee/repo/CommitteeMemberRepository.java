package com.cbs.sacco.committee.repo;

import com.cbs.sacco.committee.entity.CommitteeMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommitteeMemberRepository extends JpaRepository<CommitteeMember, Long> {
    List<CommitteeMember> findByCommitteeId(Long committeeId);
}
