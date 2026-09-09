package com.cbs.sacco.branch.web;

import com.cbs.sacco.branch.entity.Branch;
import com.cbs.sacco.branch.repo.BranchRepository;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.common.VerificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    private final BranchRepository repo;
    private final VerificationService verificationService;

    public BranchController(BranchRepository repo, VerificationService verificationService) {
        this.repo = repo;
        this.verificationService = verificationService;
    }

    @GetMapping
    public List<Branch> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public Branch get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Branch not found: " + id));
    }

    @PostMapping
    public Branch create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        Branch b = new Branch();
        b.setCode(code);
        b.setName(name);
        b.setAddress(str(body, "address"));
        b.setPhone(str(body, "phone"));
        b.setStatus("Pending");
        Branch saved = repo.save(b);
        verificationService.requestVerification("BRANCH", saved.getCode(), "New branch " + saved.getName(), null, str(body, "initiatedBy"));
        return saved;
    }

    @PutMapping("/{id}")
    public Branch update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Branch b = get(id);
        if (body.containsKey("name")) b.setName(str(body, "name"));
        if (body.containsKey("address")) b.setAddress(str(body, "address"));
        if (body.containsKey("phone")) b.setPhone(str(body, "phone"));
        if (body.containsKey("status")) b.setStatus(str(body, "status"));
        return repo.save(b);
    }

    @PostMapping("/{id}/verify")
    public Branch verify(@PathVariable Long id) {
        Branch b = get(id);
        b.setStatus("Verified");
        return repo.save(b);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
