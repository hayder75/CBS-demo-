package com.cbs.sacco.loanconfig.repo;

import com.cbs.sacco.loanconfig.entity.LoanConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoanConfigRepository extends JpaRepository<LoanConfig, Long> {
    Optional<LoanConfig> findByConfigKey(String configKey);
}
