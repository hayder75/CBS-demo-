package com.cbs.sacco.systemops.repo;

import com.cbs.sacco.systemops.entity.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface BackupRecordRepository extends JpaRepository<BackupRecord, Long> {
    boolean existsByCreatedAtGreaterThanEqual(Instant instant);
}
