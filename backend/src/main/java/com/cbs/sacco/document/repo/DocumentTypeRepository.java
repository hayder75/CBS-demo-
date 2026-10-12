package com.cbs.sacco.document.repo;

import com.cbs.sacco.document.entity.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentTypeRepository extends JpaRepository<DocumentType, Long> {
    boolean existsByCode(String code);
}
