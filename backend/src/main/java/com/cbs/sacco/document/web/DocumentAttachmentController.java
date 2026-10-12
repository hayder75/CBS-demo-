package com.cbs.sacco.document.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.document.entity.DocumentAttachment;
import com.cbs.sacco.document.repo.DocumentAttachmentRepository;
import com.cbs.sacco.document.repo.DocumentTypeRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Attaches document types to customers / accounts / loans / collateral. */
@RestController
@RequestMapping("/api/documents/attachments")
public class DocumentAttachmentController {

    private final DocumentAttachmentRepository repo;
    private final DocumentTypeRepository documentTypes;

    public DocumentAttachmentController(DocumentAttachmentRepository repo, DocumentTypeRepository documentTypes) {
        this.repo = repo;
        this.documentTypes = documentTypes;
    }

    @GetMapping
    public List<DocumentAttachment> list(@RequestParam(required = false) String entityType,
                                         @RequestParam(required = false) String entityId) {
        if (entityType != null && entityId != null) {
            return repo.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId);
        }
        return repo.findAll();
    }

    @PostMapping
    public DocumentAttachment create(@RequestBody Map<String, Object> body) {
        Long typeId = lng(body.get("documentTypeId"));
        String entityType = str(body, "entityType");
        String entityId = str(body, "entityId");
        String fileName = str(body, "fileName");
        if (typeId == null || entityType == null || entityId == null || fileName == null) {
            throw new IllegalArgumentException("documentTypeId, entityType, entityId and fileName are required");
        }
        documentTypes.findById(typeId)
                .orElseThrow(() -> new NotFoundException("Document type not found: " + typeId));
        DocumentAttachment a = new DocumentAttachment();
        a.setDocumentTypeId(typeId);
        a.setEntityType(entityType);
        a.setEntityId(entityId);
        a.setFileName(fileName);
        a.setMimeType(str(body, "mimeType") == null ? "application/pdf" : str(body, "mimeType"));
        a.setSizeKb(body.get("sizeKb") instanceof Number n ? n.intValue() : 0);
        a.setUploadedBy(str(body, "uploadedBy"));
        a.setUploadedAt(Instant.now());
        a.setStatus("Active");
        return repo.save(a);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static Long lng(Object v) {
        if (v == null) return null;
        try { return Long.valueOf(v.toString()); } catch (NumberFormatException e) { return null; }
    }
}
