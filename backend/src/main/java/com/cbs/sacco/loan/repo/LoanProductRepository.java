package com.cbs.sacco.loan.repo;

import com.cbs.sacco.loan.entity.LoanProduct;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanProductRepository extends JpaRepository<LoanProduct, Long> {}
