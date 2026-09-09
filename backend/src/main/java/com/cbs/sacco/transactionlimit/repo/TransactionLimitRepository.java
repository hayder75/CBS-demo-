package com.cbs.sacco.transactionlimit.repo;

import com.cbs.sacco.transactionlimit.entity.TransactionLimit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionLimitRepository extends JpaRepository<TransactionLimit, Long> {
}