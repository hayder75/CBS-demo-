package com.cbs.sacco.loangroup.repo;

import com.cbs.sacco.loangroup.entity.LoanGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanGroupRepository extends JpaRepository<LoanGroup, Long> {
    List<LoanGroup> findByStatus(String status);
}
