package com.cbs.sacco.bank.repo;

import com.cbs.sacco.bank.entity.BankTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BankTransactionRepository extends JpaRepository<BankTransaction, Long> {
    List<BankTransaction> findAllByOrderByIdDesc();

    List<BankTransaction> findByBankAccountIdOrderByIdDesc(Long bankAccountId);

    List<BankTransaction> findByReconStatusOrderByIdDesc(String reconStatus);

    List<BankTransaction> findByBankAccountIdAndReconStatusOrderByIdDesc(Long bankAccountId, String reconStatus);

    long countByBankAccountIdAndReconStatus(Long bankAccountId, String reconStatus);
}
