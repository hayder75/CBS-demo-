package com.cbs.sacco.loanlifecycle.repo;

import com.cbs.sacco.loanlifecycle.entity.LoanRestructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRestructureRepository extends JpaRepository<LoanRestructure, Long> {
    List<LoanRestructure> findByStatus(String status);

    List<LoanRestructure> findByLoanIdAndStatus(Long loanId, String status);
}
