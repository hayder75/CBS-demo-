package com.cbs.sacco.bank.repo;

import com.cbs.sacco.bank.entity.BankReconSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BankReconSessionRepository extends JpaRepository<BankReconSession, Long> {
    List<BankReconSession> findAllByOrderByStartedAtDesc();

    Optional<BankReconSession> findFirstByBankAccountIdAndStatus(Long bankAccountId, String status);
}
