package com.cbs.sacco.loan.repo;

import com.cbs.sacco.loan.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<Loan, Long> {}
