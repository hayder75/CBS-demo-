package com.cbs.sacco.document.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.document.entity.DocumentType;
import com.cbs.sacco.document.repo.DocumentTypeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentTypeController {

    private final DocumentTypeRepository repo;

    public DocumentTypeController(DocumentTypeRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<DocumentType> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public DocumentType get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Document type not found: " + id));
    }

    @PostMapping
    public DocumentType create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        if (repo.existsByCode(code)) throw new IllegalArgumentException("document code exists: " + code);
        DocumentType d = new DocumentType();
        d.setCode(code);
        d.setName(name);
        d.setCategory(str(body, "category") == null ? "Customer" : str(body, "category"));
        d.setMandatory(Boolean.parseBoolean(String.valueOf(body.getOrDefault("mandatory", false))));
        Object ry = body.get("retentionYears");
        if (ry != null) {
            try { d.setRetentionYears(ry instanceof Number n ? n.intValue() : Integer.parseInt(ry.toString())); }
            catch (NumberFormatException ignored) { }
        }
        d.setDescription(str(body, "description"));
        d.setStatus("Pending");
        return repo.save(d);
    }

    @PostMapping("/{id}/verify")
    public DocumentType verify(@PathVariable Long id) {
        DocumentType d = get(id);
        d.setStatus("Verified");
        return repo.save(d);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
