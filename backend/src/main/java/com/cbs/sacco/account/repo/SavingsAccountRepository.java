package com.cbs.sacco.account.repo;

import com.cbs.sacco.account.entity.SavingsAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavingsAccountRepository extends JpaRepository<SavingsAccount, Long> {
    List<SavingsAccount> findByMemberId(Long memberId);
    List<SavingsAccount> findByStatus(String status);
    Optional<SavingsAccount> findByAccountNo(String accountNo);
}
