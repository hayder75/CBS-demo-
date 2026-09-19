package com.cbs.sacco.loanlifecycle.repo;

import com.cbs.sacco.loanlifecycle.entity.LoanWriteOff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanWriteOffRepository extends JpaRepository<LoanWriteOff, Long> {
    List<LoanWriteOff> findByStatus(String status);
}
