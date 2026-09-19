package com.cbs.sacco.expense.repo;

import com.cbs.sacco.expense.entity.ExpenseEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseEntryRepository extends JpaRepository<ExpenseEntry, Long> {
}
