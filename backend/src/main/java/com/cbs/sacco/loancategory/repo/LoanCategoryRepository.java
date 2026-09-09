package com.cbs.sacco.loancategory.repo;

import com.cbs.sacco.loancategory.entity.LoanCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanCategoryRepository extends JpaRepository<LoanCategory, Long> {
    List<LoanCategory> findByStatus(String status);
}
