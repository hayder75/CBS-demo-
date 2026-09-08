package com.cbs.sacco.savings.repo;

import com.cbs.sacco.savings.entity.SavingsTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavingsTransactionRepository extends JpaRepository<SavingsTransaction, Long> {
    List<SavingsTransaction> findByMemberIdOrderByDateDesc(Long memberId);
}
