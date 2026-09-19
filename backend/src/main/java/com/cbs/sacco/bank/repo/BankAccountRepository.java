package com.cbs.sacco.bank.repo;

import com.cbs.sacco.bank.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findAllByOrderByIdAsc();

    Optional<BankAccount> findByAccountNo(String accountNo);

    boolean existsByAccountNo(String accountNo);
}
