package com.cbs.sacco.payment.repo;

import com.cbs.sacco.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStatus(String status);
    List<Payment> findByKind(String kind);
    List<Payment> findByKindAndStatus(String kind, String status);
}
