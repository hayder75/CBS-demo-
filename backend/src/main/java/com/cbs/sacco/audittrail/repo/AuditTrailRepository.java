package com.cbs.sacco.audittrail.repo;

import com.cbs.sacco.audittrail.entity.AuditTrailEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AuditTrailRepository extends JpaRepository<AuditTrailEntry, Long> {

    Optional<AuditTrailEntry> findTopByOrderByIdDesc();

    List<AuditTrailEntry> findAllByOrderByIdAsc();

    @Query("select distinct a.actor from AuditTrailEntry a where a.actor is not null order by a.actor")
    List<String> findDistinctActors();
}
