package com.cbs.sacco.accounting.repo;

import com.cbs.sacco.accounting.entity.GlAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GlAccountRepository extends JpaRepository<GlAccount, Long> {}
