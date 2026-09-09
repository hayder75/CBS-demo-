package com.cbs.sacco.report.web;

import com.cbs.sacco.loan.entity.Loan;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.savings.entity.SavingsTransaction;
import com.cbs.sacco.savings.repo.SavingsTransactionRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final LoanRepository loanRepository;
    private final MemberRepository memberRepository;
    private final SavingsTransactionRepository txnRepository;

    public ReportController(LoanRepository loanRepository,
                            MemberRepository memberRepository,
                            SavingsTransactionRepository txnRepository) {
        this.loanRepository = loanRepository;
        this.memberRepository = memberRepository;
        this.txnRepository = txnRepository;
    }

    // ---- Loan Aging ----
    @GetMapping("/loan-aging")
    public List<Map<String, Object>> loanAging() {
        List<Map<String, Object>> buckets = new ArrayList<>();
        Map<String, long[]> rules = new LinkedHashMap<>();
        rules.put("Current", new long[]{0, 0});
        rules.put("Active Good Standing", new long[]{0, 0});
        rules.put("Active Bad Standing", new long[]{1, 30});
        rules.put("Substandard", new long[]{31, 60});
        rules.put("Special Mention", new long[]{61, 90});
        rules.put("Doubtful", new long[]{91, 120});
        rules.put("Loss", new long[]{121, 150});
        rules.put("NPL", new long[]{151, Long.MAX_VALUE});

        for (Loan loan : loanRepository.findAll()) {
            int days = loan.getOverdueDays() == null ? 0 : loan.getOverdueDays();
            String bucket = rules.entrySet().stream()
                    .filter(e -> days >= e.getValue()[0] && days <= e.getValue()[1])
                    .map(Map.Entry::getKey)
                    .findFirst().orElse("Current");
            Map<String, Object> row = new HashMap<>();
            row.put("bucket", bucket);
            row.put("count", 1L);
            row.put("balance", loan.getBalance() == null ? BigDecimal.ZERO : loan.getBalance());
            buckets.add(row);
        }

        Map<String, Map<String, Object>> agg = new LinkedHashMap<>();
        for (Map<String, Object> r : buckets) {
            String b = (String) r.get("bucket");
            Map<String, Object> a = agg.computeIfAbsent(b, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("bucket", k);
                m.put("count", 0L);
                m.put("balance", BigDecimal.ZERO);
                return m;
            });
            a.put("count", ((Long) a.get("count")) + (Long) r.get("count"));
            ((BigDecimal) a.get("balance")).add((BigDecimal) r.get("balance"));
            a.put("balance", ((BigDecimal) a.get("balance")).add((BigDecimal) r.get("balance")));
        }
        return List.copyOf(agg.values());
    }

    @GetMapping("/delinquency")
    public List<Map<String, Object>> delinquency() {
        return loanRepository.findAll().stream()
                .filter(l -> l.getOverdueDays() != null && l.getOverdueDays() > 0)
                .map(l -> Map.<String, Object>of(
                        "loanNo", l.getLoanNo(), "overdueDays", l.getOverdueDays(),
                        "balance", l.getBalance(), "classification", l.getClassification(),
                        "status", l.getStatus()))
                .sorted(Comparator.comparingInt((Map<String, Object> m) -> (Integer) m.get("overdueDays")).reversed())
                .toList();
    }

    @GetMapping("/loan-disbursement-by-gender")
    public List<Map<String, Object>> disbursementByGender() {
        Map<String, BigDecimal> byGender = new HashMap<>();
        Map<String, Long> byCount = new HashMap<>();
        for (Loan loan : loanRepository.findAll()) {
            if (loan.getDisbursedAt() == null) continue;
            Member m = memberRepository.findById(loan.getMemberId()).orElse(null);
            if (m == null) continue;
            String g = m.getGender();
            byGender.merge(g, loan.getAmount(), BigDecimal::add);
            byCount.merge(g, 1L, Long::sum);
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : byGender.entrySet()) {
            out.add(Map.of("gender", e.getKey(), "amount", e.getValue(),
                    "count", byCount.getOrDefault(e.getKey(), 0L)));
        }
        return out;
    }

    @GetMapping("/loan-disbursement-by-product")
    public List<Map<String, Object>> disbursementByProduct() {
        Map<String, BigDecimal> m = new HashMap<>();
        for (Loan loan : loanRepository.findAll()) {
            if (loan.getDisbursedAt() == null) continue;
            String code = loan.getProduct() != null && loan.getProduct().getCode() != null
                    ? loan.getProduct().getCode() : "other";
            m.merge(code, loan.getAmount(), BigDecimal::add);
        }
        return m.entrySet().stream()
                .map(e -> Map.<String, Object>of("product", e.getKey(), "amount", e.getValue()))
                .toList();
    }

    @GetMapping("/top-borrowers")
    public List<Map<String, Object>> topBorrowers() {
        return loanRepository.findAll().stream()
                .filter(l -> l.getBalance() != null && l.getBalance().signum() > 0)
                .sorted(Comparator.comparing(Loan::getBalance).reversed())
                .limit(10)
                .map(l -> Map.<String, Object>of(
                        "member", memberName(l.getMemberId()),
                        "loanNo", l.getLoanNo(), "balance", l.getBalance()))
                .toList();
    }

    // ---- Transactions reports ----
    @GetMapping("/transactions")
    public Map<String, Object> transactionsSummary() {
        List<SavingsTransaction> all = txnRepository.findAll();
        long deposits = all.stream().filter(t -> "Deposit".equalsIgnoreCase(t.getType())).count();
        long withdrawals = all.stream().filter(t -> "Withdrawal".equalsIgnoreCase(t.getType())).count();
        BigDecimal depositAmt = all.stream().filter(t -> "Deposit".equalsIgnoreCase(t.getType()))
                .map(SavingsTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal withdrawalAmt = all.stream().filter(t -> "Withdrawal".equalsIgnoreCase(t.getType()))
                .map(SavingsTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
                "deposits", deposits, "withdrawals", withdrawals,
                "depositAmount", depositAmt, "withdrawalAmount", withdrawalAmt,
                "total", all.size());
    }

    // ---- Customers report ----
    @GetMapping("/customers")
    public Map<String, Object> customers() {
        List<Member> members = memberRepository.findAll();
        long active = members.stream().filter(m -> "Active".equals(m.getStatus())).count();
        long dormant = members.stream().filter(m -> "Dormant".equals(m.getStatus())).count();
        long suspended = members.stream().filter(m -> "Suspended".equals(m.getStatus())).count();
        return Map.of("total", members.size(), "active", active, "dormant", dormant, "suspended", suspended);
    }

    // ---- Shares report ----
    @GetMapping("/shares")
    public Map<String, Object> shares() {
        List<Member> members = memberRepository.findAll();
        BigDecimal totalShares = members.stream()
                .map(m -> m.getShareBalance() == null ? BigDecimal.ZERO : m.getShareBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("membersWithShares", members.stream().filter(m -> m.getShareBalance() != null && m.getShareBalance().signum() > 0).count(),
                "totalShareValue", totalShares);
    }

    private String memberName(Long memberId) {
        if (memberId == null) return "";
        return memberRepository.findById(memberId).map(Member::getFullName).orElse(String.valueOf(memberId));
    }
}
