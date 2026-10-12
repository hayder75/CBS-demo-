package com.cbs.sacco.audit.web;

import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.savings.entity.SavingsTransaction;
import com.cbs.sacco.savings.repo.SavingsTransactionRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final SavingsTransactionRepository txnRepository;
    private final JdbcTemplate jdbcTemplate;

    public AuditController(SavingsTransactionRepository txnRepository, JdbcTemplate jdbcTemplate) {
        this.txnRepository = txnRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /** All financial transactions categorized by audit status. */
    @GetMapping("/transactions")
    public List<SavingsTransaction> transactions(@RequestParam(name = "status", defaultValue = "Unaudited") String status) {
        return txnRepository.findAll().stream()
                .filter(t -> status.equalsIgnoreCase("all") || t.getAuditedStatus().equalsIgnoreCase(status))
                .toList();
    }

    @PostMapping("/transactions/{id}/exact")
    public SavingsTransaction markExact(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        return setAudit(id, "Audited", principal == null ? "System" : principal.name(), null);
    }

    @PostMapping("/transactions/{id}/discrepant")
    public SavingsTransaction markDiscrepant(@PathVariable Long id,
                                             @RequestBody(required = false) Map<String, Object> body,
                                             @AuthenticationPrincipal AppUserPrincipal principal) {
        String note = body != null && body.get("note") != null ? body.get("note").toString() : "Discrepant transaction";
        return setAudit(id, "Discrepant", principal == null ? "System" : principal.name(), note);
    }

    @PostMapping("/transactions/{id}/unaudit")
    public SavingsTransaction unAudit(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        return setAudit(id, "Unaudited", principal == null ? "System" : principal.name(), null);
    }

    @PostMapping("/transactions/{id}/note")
    public SavingsTransaction addNote(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        SavingsTransaction t = txnRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Transaction not found: " + id));
        t.setAuditNote(body.get("note") != null ? body.get("note").toString() : t.getAuditNote());
        return txnRepository.save(t);
    }

    /** Audit log entries (Admin > Audit Logs). */
    @GetMapping("/logs")
    public List<Map<String, Object>> logs(@RequestParam(name = "limit", defaultValue = "200") int limit) {
        return jdbcTemplate.queryForList(
                "SELECT id, username, action, entity, entity_id, detail, occurred_at " +
                "FROM audit_log ORDER BY occurred_at DESC LIMIT ?", limit);
    }

    /** Head-Office consolidated audit overview. */
    @GetMapping("/ho-overview")
    public Map<String, Object> hoOverview() {
        List<SavingsTransaction> all = txnRepository.findAll();
        long total = all.size();
        long exact = all.stream().filter(t -> "Audited".equalsIgnoreCase(t.getAuditedStatus())).count();
        long discrepant = all.stream().filter(t -> "Discrepant".equalsIgnoreCase(t.getAuditedStatus())).count();
        long unaudited = all.stream().filter(t -> "Unaudited".equalsIgnoreCase(t.getAuditedStatus())).count();

        Map<String, long[]> byTeller = new java.util.LinkedHashMap<>();
        for (SavingsTransaction t : all) {
            String teller = t.getTeller() == null ? "Unassigned" : t.getTeller();
            long[] c = byTeller.computeIfAbsent(teller, k -> new long[3]);
            if ("Audited".equalsIgnoreCase(t.getAuditedStatus())) c[0]++;
            else if ("Discrepant".equalsIgnoreCase(t.getAuditedStatus())) c[1]++;
            else c[2]++;
        }
        List<Map<String, Object>> tellers = new java.util.ArrayList<>();
        byTeller.forEach((teller, c) -> tellers.add(Map.of(
                "teller", teller, "exact", c[0], "discrepant", c[1], "unaudited", c[2],
                "total", c[0] + c[1] + c[2])));

        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("total", total);
        out.put("auditedExact", exact);
        out.put("auditedDiscrepant", discrepant);
        out.put("unaudited", unaudited);
        out.put("byTeller", tellers);
        return out;
    }

    /** Head-Office transaction audit list (all branches). */
    @GetMapping("/ho/transactions")
    public List<SavingsTransaction> hoTransactions(@RequestParam(name = "status", defaultValue = "all") String status) {
        return txnRepository.findAll().stream()
                .filter(t -> "all".equalsIgnoreCase(status) || t.getAuditedStatus().equalsIgnoreCase(status))
                .toList();
    }

    private SavingsTransaction setAudit(Long id, String status, String by, String note) {
        SavingsTransaction t = txnRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Transaction not found: " + id));
        t.setAuditedStatus(status);
        t.setAuditedBy(by);
        t.setAuditedAt(Instant.now());
        if (note != null) t.setAuditNote(note);
        return txnRepository.save(t);
    }
}
