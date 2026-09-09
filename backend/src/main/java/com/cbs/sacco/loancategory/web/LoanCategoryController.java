package com.cbs.sacco.loancategory.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.loancategory.entity.LoanCategory;
import com.cbs.sacco.loancategory.repo.LoanCategoryRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-categories")
public class LoanCategoryController {
    private final LoanCategoryRepository repo;
    public LoanCategoryController(LoanCategoryRepository repo) { this.repo = repo; }

    @GetMapping
    public List<LoanCategory> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public LoanCategory get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Loan category not found: " + id)); }

    @PostMapping
    public LoanCategory create(@RequestBody Map<String, Object> body) {
        String name = str(body, "name");
        if (name == null) throw new IllegalArgumentException("name is required");
        LoanCategory c = new LoanCategory();
        c.setName(name);
        c.setDescription(str(body, "description"));
        c.setStatus("Pending");
        return repo.save(c);
    }

    @PutMapping("/{id}")
    public LoanCategory update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        LoanCategory c = get(id);
        if (body.containsKey("name")) c.setName(str(body, "name"));
        if (body.containsKey("status")) c.setStatus(str(body, "status"));
        return repo.save(c);
    }

    @PostMapping("/{id}/verify")
    public LoanCategory verify(@PathVariable Long id) { LoanCategory c = get(id); c.setStatus("Verified"); return repo.save(c); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
}
