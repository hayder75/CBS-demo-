package com.cbs.sacco.loanlifecycle.repo;

import com.cbs.sacco.loanlifecycle.entity.LoanAutoDebit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanAutoDebitRepository extends JpaRepository<LoanAutoDebit, Long> {
}
