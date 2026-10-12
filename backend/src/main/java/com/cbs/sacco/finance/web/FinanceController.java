package com.cbs.sacco.finance.web;

import com.cbs.sacco.accounting.entity.GlAccount;
import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Finance views that complement the accounting journal: cash position, daily trial balance,
 * income statement and opening balances.
 */
@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final GlAccountRepository glAccounts;

    public FinanceController(GlAccountRepository glAccounts) {
        this.glAccounts = glAccounts;
    }

    @GetMapping("/cash-position")
    public Map<String, Object> cashPosition() {
        List<Map<String, Object>> rows = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (GlAccount a : glAccounts.findAll()) {
            boolean cashLike = (a.getCode() != null && (a.getCode().startsWith("10") || a.getCode().startsWith("11")))
                    || (a.getName() != null && (a.getName().toLowerCase().contains("cash") || a.getName().toLowerCase().contains("bank")));
            if (cashLike) {
                rows.add(Map.of("code", a.getCode(), "account", a.getName(),
                        "balance", nz(a.getBalance()), "currency", a.getCurrencyCode() == null ? "ETB" : a.getCurrencyCode()));
                total = total.add(nz(a.getBalance()));
            }
        }
        return Map.of("total", total, "accounts", rows, "asOf", OffsetDateTime.now().toString());
    }

    @GetMapping("/daily-trial-balance")
    public Map<String, Object> dailyTrialBalance() {
        List<Map<String, Object>> rows = new ArrayList<>();
        BigDecimal debit = BigDecimal.ZERO;
        BigDecimal credit = BigDecimal.ZERO;
        for (GlAccount a : glAccounts.findAll()) {
            BigDecimal bal = nz(a.getBalance());
            BigDecimal d = bal.signum() >= 0 ? bal : BigDecimal.ZERO;
            BigDecimal c = bal.signum() < 0 ? bal.abs() : BigDecimal.ZERO;
            debit = debit.add(d);
            credit = credit.add(c);
            rows.add(Map.of("code", a.getCode(), "name", a.getName(), "debit", d, "credit", c));
        }
        return Map.of("rows", rows, "totalDebit", debit, "totalCredit", credit);
    }

    @GetMapping("/income-statement")
    public Map<String, Object> incomeStatement() {
        List<Map<String, Object>> income = new ArrayList<>();
        List<Map<String, Object>> expense = new ArrayList<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        for (GlAccount a : glAccounts.findAll()) {
            if ("Income".equalsIgnoreCase(a.getCategory())) {
                BigDecimal v = nz(a.getBalance());
                income.add(Map.of("code", a.getCode(), "name", a.getName(), "amount", v));
                totalIncome = totalIncome.add(v);
            } else if ("Expense".equalsIgnoreCase(a.getCategory())) {
                BigDecimal v = nz(a.getBalance());
                expense.add(Map.of("code", a.getCode(), "name", a.getName(), "amount", v));
                totalExpense = totalExpense.add(v);
            }
        }
        return Map.of(
                "income", income, "expense", expense,
                "totalIncome", totalIncome, "totalExpense", totalExpense,
                "netSurplus", totalIncome.subtract(totalExpense));
    }

    @GetMapping("/opening-balance")
    public List<Map<String, Object>> openingBalances() {
        return glAccounts.findAll().stream()
                .map(a -> Map.<String, Object>of("code", a.getCode(), "name", a.getName(),
                        "balance", nz(a.getBalance()), "category", a.getCategory()))
                .toList();
    }

    @PostMapping("/opening-balance")
    @Transactional
    public Map<String, Object> setOpeningBalance(@RequestBody Map<String, Object> body) {
        String code = str(body, "code");
        BigDecimal amount = dec(body, "amount");
        if (code == null || amount == null) throw new IllegalArgumentException("code and amount are required");
        GlAccount a = glAccounts.findAll().stream().filter(x -> code.equals(x.getCode())).findFirst()
                .orElseThrow(() -> new NotFoundException("GL account not found: " + code));
        a.setBalance(amount);
        glAccounts.save(a);
        return Map.of("code", a.getCode(), "name", a.getName(), "balance", a.getBalance());
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static BigDecimal dec(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? new BigDecimal(n.toString()) : new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }
}
