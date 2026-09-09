package com.cbs.sacco.transactionlimit.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.transactionlimit.entity.TransactionLimit;
import com.cbs.sacco.transactionlimit.repo.TransactionLimitRepository;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transaction-limits")
public class TransactionLimitController {
    private final TransactionLimitRepository repo;
    public TransactionLimitController(TransactionLimitRepository repo) { this.repo = repo; }

    @GetMapping
    public List<TransactionLimit> list() { return repo.findAll(); }

    @PostMapping
    public TransactionLimit create(@RequestBody Map<String, Object> body) {
        String role = str(body, "roleCode");
        String type = str(body, "txnType");
        BigDecimal amount = body.get("maxAmount") != null ? new BigDecimal(body.get("maxAmount").toString()) : null;
        if (role == null || type == null || amount == null) throw new IllegalArgumentException("roleCode, txnType, maxAmount are required");
        TransactionLimit t = new TransactionLimit();
        t.setRoleCode(role);
        t.setTxnType(type);
        t.setMaxAmount(amount);
        return repo.save(t);
    }

    @PutMapping("/{id}")
    public TransactionLimit update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        TransactionLimit t = repo.findById(id).orElseThrow(() -> new NotFoundException("Limit not found: " + id));
        if (body.get("maxAmount") != null) t.setMaxAmount(new BigDecimal(body.get("maxAmount").toString()));
        return repo.save(t);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { repo.deleteById(id); }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
}
