package com.cbs.sacco.coa.web;

import com.cbs.sacco.accounting.entity.GlAccount;
import com.cbs.sacco.accounting.entity.GlClass;
import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.accounting.repo.GlClassRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Chart-of-accounts operations beyond class CRUD: leaves, hierarchical view and GL balance import.
 */
@RestController
@RequestMapping("/api/coa")
public class CoaController {

    private final GlAccountRepository glAccounts;
    private final GlClassRepository glClasses;

    public CoaController(GlAccountRepository glAccounts, GlClassRepository glClasses) {
        this.glAccounts = glAccounts;
        this.glClasses = glClasses;
    }

    @GetMapping("/leaves")
    public List<GlAccount> leaves() {
        return glAccounts.findAll();
    }

    @GetMapping("/hierarchical")
    public List<Map<String, Object>> hierarchical() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (GlClass c : glClasses.findAll()) {
            List<Map<String, Object>> leaves = glAccounts.findAll().stream()
                    .filter(a -> c.getId().equals(a.getClassId()))
                    .map(a -> Map.<String, Object>of(
                            "code", a.getCode(), "name", a.getName(),
                            "balance", nz(a.getBalance()), "category", a.getCategory()))
                    .toList();
            out.add(Map.of("id", c.getId(), "name", c.getName(), "status", c.getStatus(), "leaves", leaves));
        }
        return out;
    }

    @PostMapping("/import-gl-balance")
    @Transactional
    public Map<String, Object> importGlBalance(@RequestBody Map<String, Object> body) {
        Object rowsObj = body.get("rows");
        if (!(rowsObj instanceof List<?> rows)) throw new IllegalArgumentException("rows must be an array");
        int updated = 0;
        for (Object raw : rows) {
            if (!(raw instanceof Map<?, ?> row)) continue;
            Object code = row.get("code");
            Object balance = row.get("balance");
            if (code == null || balance == null) continue;
            GlAccount a = glAccounts.findAll().stream()
                    .filter(x -> code.toString().equals(x.getCode())).findFirst()
                    .orElseThrow(() -> new NotFoundException("GL account not found: " + code));
            a.setBalance(new BigDecimal(balance.toString()));
            glAccounts.save(a);
            updated++;
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("updated", updated);
        res.put("total", rows.size());
        return res;
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
