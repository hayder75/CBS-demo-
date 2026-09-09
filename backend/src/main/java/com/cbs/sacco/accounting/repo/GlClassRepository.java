package com.cbs.sacco.accounting.repo;

import com.cbs.sacco.accounting.entity.GlClass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GlClassRepository extends JpaRepository<GlClass, Long> {
    List<GlClass> findByStatus(String status);
}
