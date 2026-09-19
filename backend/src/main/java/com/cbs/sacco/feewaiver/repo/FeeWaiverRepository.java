package com.cbs.sacco.feewaiver.repo;

import com.cbs.sacco.feewaiver.entity.FeeWaiver;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeWaiverRepository extends JpaRepository<FeeWaiver, Long> {
    List<FeeWaiver> findByStatus(String status);
}
