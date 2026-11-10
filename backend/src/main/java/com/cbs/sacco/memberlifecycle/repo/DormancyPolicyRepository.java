package com.cbs.sacco.memberlifecycle.repo;

import com.cbs.sacco.memberlifecycle.entity.DormancyPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DormancyPolicyRepository extends JpaRepository<DormancyPolicy, Long> {
}
