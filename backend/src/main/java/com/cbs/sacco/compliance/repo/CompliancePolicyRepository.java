package com.cbs.sacco.compliance.repo;

import com.cbs.sacco.compliance.entity.CompliancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompliancePolicyRepository extends JpaRepository<CompliancePolicy, Long> {
    Optional<CompliancePolicy> findTopByOrderByIdAsc();
}
