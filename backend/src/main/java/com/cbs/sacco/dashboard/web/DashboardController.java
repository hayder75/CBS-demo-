package com.cbs.sacco.dashboard.web;

import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.approval.repo.ApprovalRepository;
import com.cbs.sacco.dashboard.dto.KpiDto;
import com.cbs.sacco.loan.entity.Loan;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.share.repo.DividendRunRepository;
import com.cbs.sacco.savings.repo.SavingsTransactionRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class DashboardController {

    private final MemberRepository memberRepository;
    private final SavingsTransactionRepository savingsTransactionRepository;
    private final LoanRepository loanRepository;
    private final GlAccountRepository glAccountRepository;
    private final ApprovalRepository approvalRepository;
    private final DividendRunRepository dividendRepository;

    public DashboardController(MemberRepository memberRepository,
                               SavingsTransactionRepository savingsTransactionRepository,
                               LoanRepository loanRepository,
                               GlAccountRepository glAccountRepository,
                               ApprovalRepository approvalRepository,
                               DividendRunRepository dividendRepository) {
        this.memberRepository = memberRepository;
        this.savingsTransactionRepository = savingsTransactionRepository;
        this.loanRepository = loanRepository;
        this.glAccountRepository = glAccountRepository;
        this.approvalRepository = approvalRepository;
        this.dividendRepository = dividendRepository;
    }

    @GetMapping("/api/kpi")
    public KpiDto kpi() {
        YearMonth current = YearMonth.now();
        LocalDate start = current.atDay(1);
        LocalDate end = current.atEndOfMonth();

        long totalMembers = memberRepository.count();
        long activeMembers = memberRepository.countByStatus("Active");
        long newMembers = memberRepository.countByJoinDateBetween(start, end);

        BigDecimal totalSavings = memberRepository.findAll().stream()
                .map(m -> m.getSavingsBalance()).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal depositsThisMonth = savingsTransactionRepository.findAll().stream()
                .filter(t -> "Deposit".equals(t.getType())
                        && !t.getDate().isBefore(start) && !t.getDate().isAfter(end))
                .map(t -> t.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Loan> loans = loanRepository.findAll();
        BigDecimal portfolio = loans.stream().map(Loan::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal disbursedThisMonth = loans.stream()
                .filter(l -> l.getDisbursedAt() != null
                        && !l.getDisbursedAt().isBefore(start) && !l.getDisbursedAt().isAfter(end))
                .map(Loan::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long overdueLoans = loans.stream().filter(l -> l.getOverdueDays() > 0).count();
        BigDecimal parBalance = loans.stream()
                .filter(l -> l.getOverdueDays() > 30)
                .map(Loan::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal parPct = portfolio.signum() > 0
                ? parBalance.multiply(BigDecimal.valueOf(100)).divide(portfolio, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, BigDecimal> glBalances = new LinkedHashMap<>();
        glAccountRepository.findAll().forEach(a -> glBalances.put(a.getCode(), a.getBalance()));
        BigDecimal cashOnHand = glBalances.getOrDefault("1000", BigDecimal.ZERO);
        BigDecimal cashAtBank = glBalances.getOrDefault("1100", BigDecimal.ZERO);

        BigDecimal income = glAccountRepository.findAll().stream()
                .filter(a -> "Income".equals(a.getCategory()))
                .map(a -> a.getBalance().abs()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expense = glAccountRepository.findAll().stream()
                .filter(a -> "Expense".equals(a.getCategory()))
                .map(a -> a.getBalance().abs()).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dividendPerShare = dividendRepository.findAll().stream()
                .filter(d -> "Credited".equals(d.getStatus()))
                .findFirst().map(d -> d.getDividendPerShare()).orElse(BigDecimal.ZERO);

        return new KpiDto(
                totalMembers, activeMembers, newMembers,
                totalSavings, depositsThisMonth, portfolio, disbursedThisMonth,
                overdueLoans, parPct, cashOnHand, cashAtBank,
                income, expense, income.subtract(expense),
                new BigDecimal("8.4"), new BigDecimal("12.1"),
                dividendPerShare, approvalRepository.countByStatus("Pending"));
    }

    @GetMapping("/api/portfolio-at-risk")
    public List<Map<String, Object>> portfolioAtRisk() {
        Map<String, String> colors = Map.of(
                "Pass", "#52c41a", "Special Mention", "#faad14",
                "Substandard", "#fa8c16", "Doubtful", "#eb2f96", "Loss", "#f5222d");
        List<Loan> loans = loanRepository.findAll();
        BigDecimal total = loans.stream().map(Loan::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.signum() == 0) return List.of();
        return List.of("Pass", "Special Mention", "Substandard", "Doubtful", "Loss").stream()
                .map(cls -> {
                    BigDecimal sum = loans.stream()
                            .filter(l -> cls.equals(l.getClassification()))
                            .map(Loan::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("label", cls);
                    row.put("value", sum.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP));
                    row.put("color", colors.get(cls));
                    return row;
                })
                .toList();
    }

    @GetMapping("/api/savings-trend")
    public List<Map<String, Object>> savingsTrend() {
        int[] deposits = {720, 750, 698, 764, 812, 684};
        int[] withdrawals = {410, 385, 428, 402, 465, 388};
        String[] months = {"Apr", "May", "Jun", "Jul", "Aug", "Sep"};
        java.util.ArrayList<Map<String, Object>> rows = new java.util.ArrayList<>();
        for (int i = 0; i < months.length; i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month", months[i]);
            row.put("deposits", deposits[i]);
            row.put("withdrawals", withdrawals[i]);
            rows.add(row);
        }
        return rows;
    }

    @GetMapping("/api/loan-product-mix")
    public List<Map<String, Object>> loanProductMix() {
        List<Loan> loans = loanRepository.findAll();
        Map<String, Long> byProduct = new LinkedHashMap<>();
        loans.forEach(l -> byProduct.merge(l.getProduct().getName(), 1L, Long::sum));
        long total = loans.size();
        if (total == 0) return List.of();
        return byProduct.entrySet().stream()
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", e.getKey());
                    row.put("value", Math.round(e.getValue() * 100.0 / total));
                    return row;
                })
                .toList();
    }
}