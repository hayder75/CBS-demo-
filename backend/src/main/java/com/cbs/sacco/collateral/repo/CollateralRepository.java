package com.cbs.sacco.collateral.repo;

import com.cbs.sacco.collateral.entity.Collateral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollateralRepository extends JpaRepository<Collateral, Long> {
    List<Collateral> findByLoanId(Long loanId);
}