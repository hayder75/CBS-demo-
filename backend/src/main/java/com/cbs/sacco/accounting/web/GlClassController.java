package com.cbs.sacco.accounting.web;

import com.cbs.sacco.accounting.entity.GlClass;
import com.cbs.sacco.accounting.repo.GlClassRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coa/classes")
public class GlClassController {
    private final GlClassRepository repo;
    public GlClassController(GlClassRepository repo) { this.repo = repo; }

    @GetMapping
    public List<GlClass> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public GlClass get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Class not found: " + id)); }

    @PostMapping
    public GlClass create(@RequestBody Map<String, Object> body) {
        String name = str(body, "name");
        if (name == null) throw new IllegalArgumentException("name is required");
        GlClass c = new GlClass();
        c.setName(name);
        c.setStatus("Pending");
        return repo.save(c);
    }

    @PostMapping("/{id}/verify")
    public GlClass verify(@PathVariable Long id) { GlClass c = get(id); c.setStatus("Verified"); return repo.save(c); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
}
