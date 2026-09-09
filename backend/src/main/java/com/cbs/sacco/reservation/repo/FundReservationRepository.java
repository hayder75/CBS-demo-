package com.cbs.sacco.reservation.repo;

import com.cbs.sacco.reservation.entity.FundReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FundReservationRepository extends JpaRepository<FundReservation, Long> {
    List<FundReservation> findByStatus(String status);
    List<FundReservation> findByAccountId(Long accountId);
}
