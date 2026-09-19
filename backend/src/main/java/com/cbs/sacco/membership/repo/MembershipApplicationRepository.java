package com.cbs.sacco.membership.repo;

import com.cbs.sacco.membership.entity.MembershipApplication;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembershipApplicationRepository extends JpaRepository<MembershipApplication, Long> {
    long countByStatus(String status);
}
