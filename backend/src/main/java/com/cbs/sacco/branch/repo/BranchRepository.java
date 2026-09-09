package com.cbs.sacco.branch.repo;

import com.cbs.sacco.branch.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByStatus(String status);
}
