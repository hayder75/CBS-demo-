package com.cbs.sacco.dailyop.repo;

import com.cbs.sacco.dailyop.entity.DailyOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyOperationRepository extends JpaRepository<DailyOperation, Long> {
    Optional<DailyOperation> findFirstByStatus(String status);
    Optional<DailyOperation> findByOpDateAndStatus(LocalDate date, String status);
}
