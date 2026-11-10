package com.cbs.sacco.memberlifecycle.repo;

import com.cbs.sacco.memberlifecycle.entity.MemberExitChecklist;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberExitChecklistRepository extends JpaRepository<MemberExitChecklist, Long> {
}
