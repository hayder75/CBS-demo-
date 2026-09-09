package com.cbs.sacco.charge.web;

import com.cbs.sacco.charge.entity.Charge;
import com.cbs.sacco.charge.repo.ChargeRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/charges")
public class ChargeController {
    private final ChargeRepository repo;
    public ChargeController(ChargeRepository repo) { this.repo = repo; }

    @GetMapping
    public List<Charge> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public Charge get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Charge not found: " + id)); }

    @PostMapping
    public Charge create(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        String name = str(body, "name");
        if (code == null || name == null) throw new IllegalArgumentException("code and name are required");
        Charge c = new Charge();
        c.setCode(code);
        c.setName(name);
        c.setServiceType(str(body, "serviceType"));
        if (body.get("glAccountId") != null) c.setGlAccountId(Long.valueOf(body.get("glAccountId").toString()));
        c.setCalcType(str(body, "calcType") != null ? str(body, "calcType") : "Flat");
        if (body.get("amount") != null) c.setAmount(new BigDecimal(body.get("amount").toString()));
        c.setApplyPenalty(Boolean.TRUE.equals(body.get("applyPenalty")));
        c.setStatus("Pending");
        return repo.save(c);
    }

    @PutMapping("/{id}")
    public Charge update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Charge c = get(id);
        if (body.containsKey("name")) c.setName(str(body, "name"));
        if (body.get("amount") != null) c.setAmount(new BigDecimal(body.get("amount").toString()));
        if (body.containsKey("status")) c.setStatus(str(body, "status"));
        return repo.save(c);
    }

    @PostMapping("/{id}/verify")
    public Charge verify(@PathVariable Long id) { Charge c = get(id); c.setStatus("Verified"); return repo.save(c); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
}
