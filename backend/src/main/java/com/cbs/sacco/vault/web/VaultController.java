package com.cbs.sacco.vault.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.vault.entity.Vault;
import com.cbs.sacco.vault.repo.VaultRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vaults")
public class VaultController {
    private final VaultRepository repo;
    public VaultController(VaultRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Vault> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public Vault get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Vault not found: " + id)); }

    @PostMapping
    public Vault create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        Vault v = new Vault();
        v.setCode(code);
        v.setName(name);
        v.setLocation(str(body, "location"));
        v.setType(str(body, "type") != null ? str(body, "type") : "BRANCH");
        v.setStatus("Pending");
        return repo.save(v);
    }

    @PutMapping("/{id}")
    public Vault update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Vault v = get(id);
        if (body.containsKey("name")) v.setName(str(body, "name"));
        if (body.containsKey("type")) v.setType(str(body, "type"));
        if (body.containsKey("status")) v.setStatus(str(body, "status"));
        return repo.save(v);
    }

    @PostMapping("/{id}/verify")
    public Vault verify(@PathVariable Long id) { Vault v = get(id); v.setStatus("Verified"); return repo.save(v); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
