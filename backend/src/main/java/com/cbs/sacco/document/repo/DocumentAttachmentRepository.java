package com.cbs.sacco.document.repo;

import com.cbs.sacco.document.entity.DocumentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentAttachmentRepository extends JpaRepository<DocumentAttachment, Long> {
    List<DocumentAttachment> findByEntityTypeAndEntityIdOrderByUploadedAtDesc(String entityType, String entityId);
}
