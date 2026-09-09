package com.cbs.sacco.loangroup.repo;

import com.cbs.sacco.loangroup.entity.LoanGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanGroupMemberRepository extends JpaRepository<LoanGroupMember, Long> {
    List<LoanGroupMember> findByGroupId(Long groupId);
}
