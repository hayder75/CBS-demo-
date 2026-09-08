package com.cbs.sacco.cashops.repo;

import com.cbs.sacco.cashops.entity.Till;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TillRepository extends JpaRepository<Till, Long> {}
