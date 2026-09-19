package com.cbs.sacco.daycontrol.repo;

import com.cbs.sacco.daycontrol.entity.SystemBusinessDate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SystemBusinessDateRepository extends JpaRepository<SystemBusinessDate, Long> {
    Optional<SystemBusinessDate> findFirstByOrderByIdAsc();
}
