package com.cbs.sacco.savings.repo;

import com.cbs.sacco.savings.entity.SavingsProduct;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavingsProductRepository extends JpaRepository<SavingsProduct, Long> {}
