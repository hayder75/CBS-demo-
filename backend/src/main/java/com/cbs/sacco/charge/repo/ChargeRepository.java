package com.cbs.sacco.charge.repo;

import com.cbs.sacco.charge.entity.Charge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChargeRepository extends JpaRepository<Charge, Long> {
    List<Charge> findByStatus(String status);
}
