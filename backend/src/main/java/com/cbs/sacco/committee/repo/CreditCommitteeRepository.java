package com.cbs.sacco.committee.repo;

import com.cbs.sacco.committee.entity.CreditCommittee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditCommitteeRepository extends JpaRepository<CreditCommittee, Long> {
    List<CreditCommittee> findByStatus(String status);
}
