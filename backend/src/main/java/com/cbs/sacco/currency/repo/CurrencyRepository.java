package com.cbs.sacco.currency.repo;

import com.cbs.sacco.currency.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CurrencyRepository extends JpaRepository<Currency, Long> {
    List<Currency> findByStatus(String status);
}
