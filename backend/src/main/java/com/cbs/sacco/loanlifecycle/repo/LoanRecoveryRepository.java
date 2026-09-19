package com.cbs.sacco.loanlifecycle.repo;

import com.cbs.sacco.loanlifecycle.entity.LoanRecovery;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRecoveryRepository extends JpaRepository<LoanRecovery, Long> {
}
