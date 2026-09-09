package com.cbs.sacco.account.repo;

import com.cbs.sacco.account.entity.Signatory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SignatoryRepository extends JpaRepository<Signatory, Long> {
    List<Signatory> findByAccountId(Long accountId);
}
