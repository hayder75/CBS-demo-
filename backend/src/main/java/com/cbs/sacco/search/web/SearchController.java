package com.cbs.sacco.search.web;

import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.account.repo.SavingsAccountRepository;
import com.cbs.sacco.document.repo.DocumentTypeRepository;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.savings.repo.SavingsTransactionRepository;
import com.cbs.sacco.sharecategory.repo.ShareAccountRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Global search across customers, accounts, shares, GL, documents and transactions.
 * Mirrors FRANC's Search page (Customer / Account / Share / General Ledger / Document / Transaction).
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final MemberRepository members;
    private final SavingsAccountRepository accounts;
    private final ShareAccountRepository shareAccounts;
    private final GlAccountRepository glAccounts;
    private final DocumentTypeRepository documents;
    private final SavingsTransactionRepository transactions;
    private final LoanRepository loans;

    public SearchController(MemberRepository members, SavingsAccountRepository accounts,
                            ShareAccountRepository shareAccounts, GlAccountRepository glAccounts,
                            DocumentTypeRepository documents, SavingsTransactionRepository transactions,
                            LoanRepository loans) {
        this.members = members;
        this.accounts = accounts;
        this.shareAccounts = shareAccounts;
        this.glAccounts = glAccounts;
        this.documents = documents;
        this.transactions = transactions;
        this.loans = loans;
    }

    @GetMapping
    public Map<String, Object> search(@RequestParam(name = "type", defaultValue = "Customer") String type,
                                      @RequestParam(name = "q", required = false) String q) {
        String needle = q == null ? "" : q.trim().toLowerCase();
        List<Map<String, Object>> results = switch (type.toLowerCase()) {
            case "account" -> searchAccounts(needle);
            case "share" -> searchShares(needle);
            case "general ledger", "gl", "ledger" -> searchGl(needle);
            case "document" -> searchDocuments(needle);
            case "transaction" -> searchTransactions(needle);
            case "loan" -> searchLoans(needle);
            default -> searchCustomers(needle);
        };
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type", type);
        out.put("query", needle);
        out.put("count", results.size());
        out.put("results", results);
        return out;
    }

    private static boolean matches(String needle, String... fields) {
        if (needle.isEmpty()) return true;
        for (String f : fields) {
            if (f != null && f.toLowerCase().contains(needle)) return true;
        }
        return false;
    }

    private List<Map<String, Object>> searchCustomers(String q) {
        List<Map<String, Object>> out = new ArrayList<>();
        members.findAll().forEach(m -> {
            if (matches(q, m.getFullName(), m.getMemberNo(), m.getPhone(), m.getFaydaId())) {
                out.add(row("title", m.getFullName(), "subtitle", m.getMemberNo(),
                        "detail", "Phone " + orDash(m.getPhone()) + " · " + m.getStatus(),
                        "ref", m.getMemberNo()));
            }
        });
        return out;
    }

    private List<Map<String, Object>> searchAccounts(String q) {
        List<Map<String, Object>> out = new ArrayList<>();
        accounts.findAll().forEach(a -> {
            if (matches(q, a.getAccountNo(), a.getAccountType())) {
                out.add(row("title", a.getAccountNo(), "subtitle", a.getAccountType() + " · " + a.getStatus(),
                        "detail", "Balance " + a.getBalance(), "ref", a.getAccountNo()));
            }
        });
        return out;
    }

    private List<Map<String, Object>> searchShares(String q) {
        List<Map<String, Object>> out = new ArrayList<>();
        shareAccounts.findAll().forEach(s -> {
            if (matches(q, String.valueOf(s.getShareCount()), s.getStatus())) {
                out.add(row("title", "Share account #" + s.getId(), "subtitle", s.getStatus(),
                        "detail", (s.getShareCount() == null ? 0 : s.getShareCount()) + " shares",
                        "ref", String.valueOf(s.getId())));
            }
        });
        return out;
    }

    private List<Map<String, Object>> searchGl(String q) {
        List<Map<String, Object>> out = new ArrayList<>();
        glAccounts.findAll().forEach(g -> {
            if (matches(q, g.getCode(), g.getName(), g.getCategory())) {
                out.add(row("title", g.getCode() + " — " + g.getName(), "subtitle", g.getCategory(),
                        "detail", "Balance " + g.getBalance(), "ref", g.getCode()));
            }
        });
        return out;
    }

    private List<Map<String, Object>> searchDocuments(String q) {
        List<Map<String, Object>> out = new ArrayList<>();
        documents.findAll().forEach(d -> {
            if (matches(q, d.getCode(), d.getName(), d.getCategory())) {
                out.add(row("title", d.getName(), "subtitle", d.getCode() + " · " + d.getCategory(),
                        "detail", Boolean.TRUE.equals(d.getMandatory()) ? "Mandatory" : "Optional",
                        "ref", d.getCode()));
            }
        });
        return out;
    }

    private List<Map<String, Object>> searchTransactions(String q) {
        List<Map<String, Object>> out = new ArrayList<>();
        transactions.findAll().forEach(t -> {
            if (matches(q, String.valueOf(t.getId()), t.getTeller(), t.getType(), t.getChannel())) {
                out.add(row("title", "#" + t.getId() + " " + t.getType(), "subtitle", String.valueOf(t.getDate()),
                        "detail", t.getAmount() + " by " + orDash(t.getTeller()), "ref", String.valueOf(t.getId())));
            }
        });
        return out;
    }

    private List<Map<String, Object>> searchLoans(String q) {
        List<Map<String, Object>> out = new ArrayList<>();
        loans.findAll().forEach(l -> {
            if (matches(q, l.getLoanNo(), l.getStatus(), l.getClassification(), l.getPurpose())) {
                out.add(row("title", l.getLoanNo(), "subtitle", l.getStatus() + " · " + l.getClassification(),
                        "detail", "Balance " + l.getBalance(), "ref", l.getLoanNo()));
            }
        });
        return out;
    }

    private static String orDash(String v) {
        return v == null || v.isBlank() ? "—" : v;
    }

    private static Map<String, Object> row(String... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
        return m;
    }
}
