package com.cbs.sacco.accounting.repo;

import com.cbs.sacco.accounting.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {}
