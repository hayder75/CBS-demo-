package com.cbs.sacco.expense.repo;

import com.cbs.sacco.expense.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, Long> {
    boolean existsByCodeIgnoreCase(String code);
}
