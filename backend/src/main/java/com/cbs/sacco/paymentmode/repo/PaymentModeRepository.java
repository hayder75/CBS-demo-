package com.cbs.sacco.paymentmode.repo;

import com.cbs.sacco.paymentmode.entity.PaymentMode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentModeRepository extends JpaRepository<PaymentMode, Long> {
    List<PaymentMode> findByStatus(String status);
}
