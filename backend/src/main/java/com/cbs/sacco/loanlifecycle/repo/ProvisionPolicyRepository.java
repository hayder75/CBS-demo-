package com.cbs.sacco.loanlifecycle.repo;

import com.cbs.sacco.loanlifecycle.entity.ProvisionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProvisionPolicyRepository extends JpaRepository<ProvisionPolicy, Long> {
    Optional<ProvisionPolicy> findByClassification(String classification);
}
