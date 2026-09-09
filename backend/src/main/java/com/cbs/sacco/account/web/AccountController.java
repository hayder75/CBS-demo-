package com.cbs.sacco.account.web;

import com.cbs.sacco.account.entity.SavingsAccount;
import com.cbs.sacco.account.entity.Signatory;
import com.cbs.sacco.account.repo.SavingsAccountRepository;
import com.cbs.sacco.account.repo.SignatoryRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final SavingsAccountRepository repo;
    private final SignatoryRepository signatoryRepository;
    public AccountController(SavingsAccountRepository repo, SignatoryRepository signatoryRepository) {
        this.repo = repo;
        this.signatoryRepository = signatoryRepository;
    }

    @GetMapping
    public List<SavingsAccount> list() { return repo.findAll(); }

    @GetMapping("/{id}")
    public SavingsAccount get(@PathVariable Long id) { return repo.findById(id).orElseThrow(() -> new NotFoundException("Account not found: " + id)); }

    @GetMapping("/member/{memberId}")
    public List<SavingsAccount> byMember(@PathVariable Long memberId) { return repo.findByMemberId(memberId); }

    @PostMapping
    public SavingsAccount create(@RequestBody Map<String, Object> body) {
        Long memberId = lng(body.get("memberId"));
        Long productId = lng(body.get("productId"));
        if (memberId == null || productId == null) throw new IllegalArgumentException("memberId and productId are required");
        SavingsAccount a = new SavingsAccount();
        a.setMemberId(memberId);
        a.setProductId(productId);
        a.setAccountType(str(body, "accountType") != null ? str(body, "accountType") : "Saving");
        a.setBalance(new java.math.BigDecimal("0"));
        a.setCurrencyId(lng(body.get("currencyId")));
        a.setBranchId(lng(body.get("branchId")));
        a.setStatus("Pending");
        a.setAccountNo("SA-M" + String.format("%05d", memberId) + "-N" + (repo.count() + 1));
        return repo.save(a);
    }

    @PostMapping("/{id}/verify")
    public SavingsAccount verify(@PathVariable Long id) {
        SavingsAccount a = get(id);
        a.setStatus("Active");
        SavingsAccount saved = repo.save(a);
        Object sig = null;
        return saved;
    }

    @PostMapping("/{id}/freeze")
    public SavingsAccount freeze(@PathVariable Long id) {
        SavingsAccount a = get(id);
        a.setStatus("Dormant");
        return repo.save(a);
    }

    @PostMapping("/{id}/close")
    public SavingsAccount close(@PathVariable Long id) {
        SavingsAccount a = get(id);
        a.setStatus("Closed");
        return repo.save(a);
    }

    @PostMapping("/{id}/reserve")
    public String reserve(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return "ok"; // reservations handled by /api/reservations
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key); return v == null ? null : v.toString();
    }
    private static Long lng(Object v) {
        if (v == null) return null;
        try { return Long.valueOf(v.toString()); } catch (NumberFormatException e) { return null; }
    }
}
