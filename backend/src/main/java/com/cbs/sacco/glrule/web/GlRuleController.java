package com.cbs.sacco.glrule.web;

import com.cbs.sacco.accounting.entity.GlAccount;
import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.glrule.entity.GlPostingRule;
import com.cbs.sacco.glrule.repo.GlPostingRuleRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gl-rules")
public class GlRuleController {

    private static final List<String> PRODUCT_TYPES =
            List.of("Savings", "Loan", "Share", "Fee", "Treasury", "Expense");

    private final GlPostingRuleRepository repository;
    private final GlAccountRepository accountRepository;

    public GlRuleController(GlPostingRuleRepository repository, GlAccountRepository accountRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
    }

    @GetMapping
    public List<GlPostingRule> list() {
        return repository.findAll();
    }

    @PostMapping
    public GlPostingRule create(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        String event = str(payload, "event");
        String productType = str(payload, "productType");
        String debit = str(payload, "debitAccountCode");
        String credit = str(payload, "creditAccountCode");

        if (event == null || event.isBlank()) {
            throw new IllegalArgumentException("Event is required");
        }
        if (productType == null || !PRODUCT_TYPES.contains(productType)) {
            throw new IllegalArgumentException("Invalid product type");
        }
        validateMapping(debit, credit);

        GlPostingRule rule = new GlPostingRule();
        rule.setEvent(event.trim());
        rule.setDescription(str(payload, "description"));
        rule.setProductType(productType);
        rule.setDebitAccountCode(debit.trim());
        rule.setCreditAccountCode(credit.trim());
        rule.setStatus("Active");
        return repository.save(rule);
    }

    @PostMapping("/{id}/toggle")
    public GlPostingRule toggle(@PathVariable Long id) {
        GlPostingRule rule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found: " + id));
        rule.setStatus("Active".equals(rule.getStatus()) ? "Inactive" : "Active");
        return repository.save(rule);
    }

    @PostMapping("/{id}")
    public GlPostingRule update(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        GlPostingRule rule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found: " + id));
        Map<String, Object> payload = body == null ? Map.of() : body;

        String debit = str(payload, "debitAccountCode");
        String credit = str(payload, "creditAccountCode");
        if (debit == null || debit.isBlank()) debit = rule.getDebitAccountCode();
        if (credit == null || credit.isBlank()) credit = rule.getCreditAccountCode();
        validateMapping(debit, credit);

        rule.setDebitAccountCode(debit.trim());
        rule.setCreditAccountCode(credit.trim());
        if (payload.get("description") != null) {
            rule.setDescription(str(payload, "description"));
        }
        return repository.save(rule);
    }

    private void validateMapping(String debit, String credit) {
        if (debit == null || debit.isBlank() || credit == null || credit.isBlank()) {
            throw new IllegalArgumentException("Debit and credit accounts are required");
        }
        if (debit.trim().equals(credit.trim())) {
            throw new IllegalArgumentException("Debit and credit accounts must be different");
        }
        List<GlAccount> accounts = accountRepository.findAll();
        if (accounts.stream().noneMatch(a -> debit.trim().equals(a.getCode()))) {
            throw new IllegalArgumentException("Unknown debit account: " + debit.trim());
        }
        if (accounts.stream().noneMatch(a -> credit.trim().equals(a.getCode()))) {
            throw new IllegalArgumentException("Unknown credit account: " + credit.trim());
        }
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
}
