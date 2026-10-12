package com.cbs.sacco.report.service;

import com.cbs.sacco.account.entity.SavingsAccount;
import com.cbs.sacco.account.repo.SavingsAccountRepository;
import com.cbs.sacco.accounting.entity.GlAccount;
import com.cbs.sacco.accounting.entity.JournalEntry;
import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.accounting.repo.JournalEntryRepository;
import com.cbs.sacco.asset.entity.FixedAsset;
import com.cbs.sacco.asset.repo.FixedAssetRepository;
import com.cbs.sacco.loan.entity.Loan;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.report.model.ReportDefinition;
import com.cbs.sacco.report.model.ReportResult;
import com.cbs.sacco.savings.entity.SavingsTransaction;
import com.cbs.sacco.savings.repo.SavingsTransactionRepository;
import com.cbs.sacco.sharecategory.entity.ShareAccount;
import com.cbs.sacco.sharecategory.repo.ShareAccountRepository;
import com.cbs.sacco.share.entity.ShareTransfer;
import com.cbs.sacco.share.repo.ShareTransferRepository;
import com.cbs.sacco.termdeposit.entity.TermDeposit;
import com.cbs.sacco.termdeposit.repo.TermDepositRepository;
import com.cbs.sacco.expense.entity.ExpenseEntry;
import com.cbs.sacco.expense.repo.ExpenseEntryRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final MemberRepository members;
    private final LoanRepository loans;
    private final SavingsTransactionRepository transactions;
    private final SavingsAccountRepository accounts;
    private final GlAccountRepository glAccounts;
    private final JournalEntryRepository journal;
    private final ShareAccountRepository shareAccounts;
    private final FixedAssetRepository assets;
    private final TermDepositRepository termDeposits;
    private final ExpenseEntryRepository expenses;
    private final ShareTransferRepository shareTransfers;

    public ReportService(MemberRepository members, LoanRepository loans,
                         SavingsTransactionRepository transactions, SavingsAccountRepository accounts,
                         GlAccountRepository glAccounts, JournalEntryRepository journal,
                         ShareAccountRepository shareAccounts, FixedAssetRepository assets,
                         TermDepositRepository termDeposits, ExpenseEntryRepository expenses,
                         ShareTransferRepository shareTransfers) {
        this.members = members;
        this.loans = loans;
        this.transactions = transactions;
        this.accounts = accounts;
        this.glAccounts = glAccounts;
        this.journal = journal;
        this.shareAccounts = shareAccounts;
        this.assets = assets;
        this.termDeposits = termDeposits;
        this.expenses = expenses;
        this.shareTransfers = shareTransfers;
    }

    public ReportResult run(String key, Map<String, String> params) {
        ReportDefinition def = ReportCatalog.find(key);
        if (def == null) {
            throw new IllegalArgumentException("Unknown report: " + key);
        }
        List<Map<String, Object>> rows = dispatch(key, params);
        Map<String, Object> summary = summarize(rows);
        return new ReportResult(def.key(), def.name(), def.columns(), rows, rows.size(),
                OffsetDateTime.now().toString(),
                params == null ? Map.<String, Object>of() : new LinkedHashMap<String, Object>(params), summary);
    }

    private List<Map<String, Object>> dispatch(String key, Map<String, String> p) {
        return switch (key) {
            case "financial-reports/trial-balance",
                 "head-office-finance/daily-trial-balance",
                 "nbe-reports/trial-balance" -> trialBalance();
            case "financial-reports/balance-sheet",
                 "head-office-finance/balance-sheet",
                 "nbe-reports/balance-sheet" -> balanceSheet();
            case "general-report",
                 "head-office-reports/gl-reports" -> glListing();

            case "general-loan-reports/loan" -> loanList(p);
            case "general-loan-reports/delinquency-report" -> delinquencyReport();
            case "general-loan-reports/loan-status-report" -> loanStatusReport();
            case "general-loan-reports/aging-report",
                 "head-office-reports/aging-report" -> agingReport();
            case "general-loan-reports/loan-loss-reserve-report" -> loanLossReserve();
            case "general-loan-reports/loan-disbursement-report",
                 "head-office-reports/loan-disbursement-report" -> loanDisbursement();
            case "general-loan-reports/par/dashboard",
                 "general-loan-reports/par/generate" -> parDashboard();
            case "general-loan-reports/loan-book-analysis" -> loanBookAnalysis();
            case "nbe-reports/loan-distribution-by-gender" -> disbursementByGender();
            case "nbe-reports/loan-disbursement-by-sector" -> disbursementBySector();
            case "nbe-reports/top-borrowing-groups",
                 "head-office-reports/loan" -> topBorrowers();

            case "transaction-report/deposit" -> transactionsByType("Deposit", p);
            case "transaction-report/withdrawal" -> transactionsByType("Withdrawal", p);
            case "transaction-report/transfer" -> transactionsByType("Transfer", p);
            case "head-office-reports/posting-journal" -> postingJournal();

            case "customer-report",
                 "head-office-reports/customers-report" -> customerReport();

            case "account-report",
                 "head-office-reports/accounts-report" -> accountList();

            case "share-report/share-collection-sheet" -> shareCollection();
            case "share-report/movement" -> shareMovement();
            case "head-office-reports/fixed-asset-management" -> fixedAssets();

            case "general-loan-reports/loan-collection-plan" -> loanCollectionPlan();
            case "general-loan-reports/loan-collection-sheet" -> loanCollectionSheet();
            case "general-loan-reports/par/historical" -> parHistorical();
            case "general-loan-reports/par/trends" -> parTrends();
            case "transaction-report/deposit-collection-sheet-customer" -> depositCollectionSheet();
            case "head-office-reports/difference-tracker-report" -> differenceTracker();
            case "head-office-finance/expense-reports" -> expenseReports();
            case "head-office-finance/cashflow" -> cashflow();
            case "head-office-finance/cash-position" -> cashPosition();
            case "aml-reports/dashboard" -> amlDashboard();
            case "aml-reports/case-details" -> amlCases();
            case "mobile-banking-reports" -> mobileBanking();
            case "account-report/overdraft" -> overdrafts();
            case "account-report/overdraft-usage" -> overdraftUsage();
            case "account-report/time-deposit-contracts" -> timeDepositContracts();
            case "account-report/time-deposit-terminations" -> timeDepositTerminations();
            case "account-report/time-deposit-interest" -> timeDepositInterest();

            default -> List.of();
        };
    }

    // ---------------- GL / financial ----------------

    private List<Map<String, Object>> trialBalance() {
        List<Map<String, Object>> rows = new ArrayList<>();
        BigDecimal td = BigDecimal.ZERO;
        BigDecimal tc = BigDecimal.ZERO;
        for (GlAccount a : glAccounts.findAll()) {
            BigDecimal bal = nz(a.getBalance());
            boolean debitSide = a.getSide() == null || "DEBIT".equalsIgnoreCase(a.getSide());
            BigDecimal debit = debitSide ? bal : BigDecimal.ZERO;
            BigDecimal credit = debitSide ? BigDecimal.ZERO : bal;
            td = td.add(debit);
            tc = tc.add(credit);
            rows.add(row("code", a.getCode(), "name", a.getName(),
                    "debit", debit, "credit", credit, "balance", bal,
                    "side", debitSide ? "Debit" : "Credit"));
        }
        return rows;
    }

    private List<Map<String, Object>> balanceSheet() {
        return glAccounts.findAll().stream()
                .map(a -> row("category", a.getCategory(), "code", a.getCode(),
                        "name", a.getName(), "amount", nz(a.getBalance())))
                .toList();
    }

    private List<Map<String, Object>> glListing() {
        return glAccounts.findAll().stream()
                .map(a -> row("code", a.getCode(), "name", a.getName(), "balance", nz(a.getBalance())))
                .toList();
    }

    private List<Map<String, Object>> postingJournal() {
        return journal.findAll().stream()
                .map(j -> row("date", j.getDate(), "ref", j.getRef(),
                        "account", j.getAccountCode() + " " + orBlank(j.getAccountName()),
                        "debit", nz(j.getDebit()), "credit", nz(j.getCredit())))
                .toList();
    }

    // ---------------- Loans ----------------

    private List<Map<String, Object>> loanList(Map<String, String> p) {
        String status = p.get("status");
        return loans.findAll().stream()
                .filter(l -> status == null || status.isBlank() || status.equalsIgnoreCase(l.getStatus()))
                .map(l -> row("loanNo", l.getLoanNo(), "member", memberName(l.getMemberId()),
                        "amount", nz(l.getAmount()), "balance", nz(l.getBalance()),
                        "overdueDays", l.getOverdueDays() == null ? 0 : l.getOverdueDays(),
                        "classification", l.getClassification(), "status", l.getStatus()))
                .toList();
    }

    private List<Map<String, Object>> delinquencyReport() {
        return loans.findAll().stream()
                .filter(l -> l.getOverdueDays() != null && l.getOverdueDays() > 0)
                .sorted((a, b) -> Integer.compare(b.getOverdueDays(), a.getOverdueDays()))
                .map(l -> row("loanNo", l.getLoanNo(), "member", memberName(l.getMemberId()),
                        "overdueDays", l.getOverdueDays(), "balance", nz(l.getBalance()),
                        "classification", l.getClassification()))
                .toList();
    }

    private List<Map<String, Object>> loanStatusReport() {
        Map<String, List<Loan>> byStatus = loans.findAll().stream()
                .collect(Collectors.groupingBy(l -> orElse(l.getStatus(), "Unknown"), LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> rows = new ArrayList<>();
        byStatus.forEach((status, list) -> rows.add(row("status", status, "count", (long) list.size(),
                "balance", list.stream().map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add))));
        return rows;
    }

    private static final String[][] BUCKETS = {
            {"Current", "0", "0"},
            {"1-30", "1", "30"},
            {"31-60", "31", "60"},
            {"61-90", "61", "90"},
            {"91-120", "91", "120"},
            {"121-180", "121", "180"},
            {"180+", "181", "999999"},
    };

    private List<Map<String, Object>> agingReport() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (String[] b : BUCKETS) {
            int lo = Integer.parseInt(b[1]);
            int hi = Integer.parseInt(b[2]);
            List<Loan> inBucket = loans.findAll().stream()
                    .filter(l -> {
                        int d = l.getOverdueDays() == null ? 0 : l.getOverdueDays();
                        return d >= lo && d <= hi;
                    }).toList();
            rows.add(row("bucket", b[0], "count", (long) inBucket.size(),
                    "balance", inBucket.stream().map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add)));
        }
        return rows;
    }

    private static final Map<String, BigDecimal> PROVISION = Map.of(
            "Pass", new BigDecimal("0.01"),
            "Watch", new BigDecimal("0.03"),
            "Substandard", new BigDecimal("0.20"),
            "Doubtful", new BigDecimal("0.50"),
            "Loss", new BigDecimal("1.00"));

    private List<Map<String, Object>> loanLossReserve() {
        Map<String, List<Loan>> byClass = loans.findAll().stream()
                .collect(Collectors.groupingBy(l -> orElse(l.getClassification(), "Pass"),
                        LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> rows = new ArrayList<>();
        byClass.forEach((cls, list) -> {
            BigDecimal outstanding = list.stream().map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal rate = PROVISION.getOrDefault(cls, new BigDecimal("0.01"));
            rows.add(row("classification", cls, "count", (long) list.size(),
                    "outstanding", outstanding, "ratePct", rate.multiply(BigDecimal.valueOf(100)),
                    "provision", outstanding.multiply(rate).setScale(2, RoundingMode.HALF_UP)));
        });
        return rows;
    }

    private List<Map<String, Object>> loanDisbursement() {
        return loans.findAll().stream()
                .filter(l -> l.getDisbursedAt() != null)
                .sorted((a, b) -> b.getDisbursedAt().compareTo(a.getDisbursedAt()))
                .map(l -> row("loanNo", l.getLoanNo(), "member", memberName(l.getMemberId()),
                        "amount", nz(l.getAmount()), "disbursedAt", l.getDisbursedAt()))
                .toList();
    }

    private List<Map<String, Object>> parDashboard() {
        List<Loan> all = loans.findAll();
        BigDecimal outstanding = all.stream().map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (String[] b : BUCKETS) {
            int lo = Integer.parseInt(b[1]);
            int hi = Integer.parseInt(b[2]);
            BigDecimal bal = all.stream()
                    .filter(l -> {
                        int d = l.getOverdueDays() == null ? 0 : l.getOverdueDays();
                        return d >= lo && d <= hi;
                    })
                    .map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (bal.signum() == 0 && !"Current".equals(b[0])) continue;
            BigDecimal parPct = outstanding.signum() == 0 ? BigDecimal.ZERO
                    : bal.multiply(BigDecimal.valueOf(100)).divide(outstanding, 2, RoundingMode.HALF_UP);
            rows.add(row("bucket", b[0], "balance", bal, "parPct", parPct));
        }
        return rows;
    }

    private List<Map<String, Object>> loanBookAnalysis() {
        Map<String, List<Loan>> byProduct = loans.findAll().stream()
                .collect(Collectors.groupingBy(l -> l.getProduct() != null && l.getProduct().getCode() != null
                        ? l.getProduct().getCode() : "other", LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> rows = new ArrayList<>();
        byProduct.forEach((product, list) -> rows.add(row("dimension", "Product", "value", product,
                "count", (long) list.size(),
                "amount", list.stream().map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add))));
        return rows;
    }

    private List<Map<String, Object>> disbursementByGender() {
        Map<String, List<Loan>> byGender = loans.findAll().stream()
                .filter(l -> l.getDisbursedAt() != null)
                .collect(Collectors.groupingBy(l -> {
                    Member m = members.findById(l.getMemberId()).orElse(null);
                    return m == null ? "Unknown" : orElse(m.getGender(), "Unknown");
                }, LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> rows = new ArrayList<>();
        byGender.forEach((g, list) -> rows.add(row("gender", g, "count", (long) list.size(),
                "amount", list.stream().map(l -> nz(l.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add))));
        return rows;
    }

    private List<Map<String, Object>> disbursementBySector() {
        Map<String, List<Loan>> byPurpose = loans.findAll().stream()
                .filter(l -> l.getDisbursedAt() != null)
                .collect(Collectors.groupingBy(l -> orElse(l.getPurpose(), "Other"),
                        LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> rows = new ArrayList<>();
        byPurpose.forEach((s, list) -> rows.add(row("sector", s, "count", (long) list.size(),
                "amount", list.stream().map(l -> nz(l.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add))));
        return rows;
    }

    private List<Map<String, Object>> topBorrowers() {
        return loans.findAll().stream()
                .filter(l -> nz(l.getBalance()).signum() > 0)
                .sorted((a, b) -> b.getBalance().compareTo(a.getBalance()))
                .limit(10)
                .map(l -> row("group", memberName(l.getMemberId()), "accounts", 1L, "balance", nz(l.getBalance())))
                .toList();
    }

    // ---------------- Transactions ----------------

    private List<Map<String, Object>> transactionsByType(String type, Map<String, String> p) {
        LocalDate from = parseDate(p.get("from"));
        LocalDate to = parseDate(p.get("to"));
        return transactions.findAll().stream()
                .filter(t -> type.equalsIgnoreCase(t.getType()))
                .filter(t -> from == null || (t.getDate() != null && !t.getDate().isBefore(from)))
                .filter(t -> to == null || (t.getDate() != null && !t.getDate().isAfter(to)))
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .map(t -> row("date", t.getDate(), "member", memberName(t.getMemberId()),
                        "amount", nz(t.getAmount()), "channel", orElse(t.getChannel(), "—"),
                        "teller", orElse(t.getTeller(), "—")))
                .toList();
    }

    // ---------------- Customers / accounts / shares / assets ----------------

    private List<Map<String, Object>> customerReport() {
        return members.findAll().stream()
                .map(m -> row("memberNo", m.getMemberNo(), "name", m.getFullName(), "gender", m.getGender(),
                        "phone", orElse(m.getPhone(), "—"), "status", m.getStatus(),
                        "savingsBalance", nz(m.getSavingsBalance()), "shareBalance", nz(m.getShareBalance())))
                .toList();
    }

    private List<Map<String, Object>> accountList() {
        return accounts.findAll().stream()
                .map(a -> row("office", a.getBranchId() == null ? "—" : String.valueOf(a.getBranchId()),
                        "count", 1L, "balance", nz(a.getBalance())))
                .toList();
    }

    private List<Map<String, Object>> shareCollection() {
        return shareAccounts.findAll().stream()
                .map(s -> row("member", memberName(s.getMemberId()),
                        "shares", s.getShareCount() == null ? 0 : s.getShareCount(),
                        "amount", BigDecimal.ZERO))
                .toList();
    }

    private List<Map<String, Object>> fixedAssets() {
        return assets.findAll().stream()
                .map(a -> row("code", a.getCode(), "name", a.getName(), "cost", nz(a.getValue()),
                        "accumDep", BigDecimal.ZERO, "netBook", nz(a.getValue())))
                .toList();
    }

    // ---------------- Term deposits / expenses / share movement ----------------

    private List<Map<String, Object>> timeDepositContracts() {
        return termDeposits.findAll().stream()
                .filter(t -> "Active".equalsIgnoreCase(t.getStatus()))
                .map(t -> row("accountNo", t.getAccountNo(), "member", orElse(t.getMemberName(), memberName(t.getMemberId())),
                        "principal", nz(t.getPrincipal()), "rate", nz(t.getRatePct()), "maturity", t.getMaturityDate()))
                .toList();
    }

    private List<Map<String, Object>> timeDepositTerminations() {
        return termDeposits.findAll().stream()
                .filter(t -> !"Active".equalsIgnoreCase(t.getStatus()))
                .map(t -> row("accountNo", t.getAccountNo(),
                        "terminated", t.getBrokenAt() == null ? t.getMaturityDate() : t.getBrokenAt().toString(),
                        "amount", nz(t.getPrincipal())))
                .toList();
    }

    private List<Map<String, Object>> timeDepositInterest() {
        return termDeposits.findAll().stream()
                .map(t -> row("accountNo", t.getAccountNo(),
                        "member", orElse(t.getMemberName(), memberName(t.getMemberId())),
                        "interest", nz(t.getInterestAccrued())))
                .toList();
    }

    private List<Map<String, Object>> expenseReports() {
        Map<String, List<ExpenseEntry>> byCat = expenses.findAll().stream()
                .collect(Collectors.groupingBy(e -> orElse(e.getCategoryName(), "Uncategorised"),
                        LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> rows = new ArrayList<>();
        byCat.forEach((cat, list) -> rows.add(row("category", cat,
                "amount", list.stream().map(e -> nz(e.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add))));
        return rows;
    }

    private List<Map<String, Object>> shareMovement() {
        return shareTransfers.findAll().stream()
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .map(t -> row("date", t.getDate(), "member", t.getFromMember() + " → " + t.getToMember(),
                        "shares", t.getShares() == null ? 0 : t.getShares(), "amount", nz(t.getValue())))
                .toList();
    }

    private List<Map<String, Object>> loanCollectionPlan() {
        Map<String, List<Loan>> byMonth = loans.findAll().stream()
                .filter(l -> l.getNextDueDate() != null)
                .collect(Collectors.groupingBy(l -> {
                    LocalDate d = l.getNextDueDate();
                    return String.format("%04d-%02d", d.getYear(), d.getMonthValue());
                }, LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> rows = new ArrayList<>();
        byMonth.forEach((period, list) -> rows.add(row("period", period, "accounts", (long) list.size(),
                "expected", list.stream().map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add))));
        return rows;
    }

    private List<Map<String, Object>> depositCollectionSheet() {
        Map<Long, List<SavingsTransaction>> byMember = transactions.findAll().stream()
                .filter(t -> "Deposit".equalsIgnoreCase(t.getType()))
                .collect(Collectors.groupingBy(SavingsTransaction::getMemberId, LinkedHashMap::new, Collectors.toList()));
        List<Map<String, Object>> rows = new ArrayList<>();
        byMember.forEach((memberId, list) -> rows.add(row("member", memberName(memberId), "count", (long) list.size(),
                "amount", list.stream().map(t -> nz(t.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add))));
        return rows;
    }

    // ---------------- helpers ----------------

    private static final BigDecimal AML_HIGH = new BigDecimal("100000");
    private static final BigDecimal AML_STRUCT_LOW = new BigDecimal("90000");

    private List<Map<String, Object>> loanCollectionSheet() {
        return loans.findAll().stream()
                .map(l -> {
                    BigDecimal p = nz(l.getPrincipalPaid());
                    BigDecimal i = nz(l.getInterestPaid());
                    return row("date", l.getDisbursedAt() == null ? "" : l.getDisbursedAt().toString(),
                            "loanNo", l.getLoanNo(), "principal", p, "interest", i, "total", p.add(i));
                }).toList();
    }

    private List<Map<String, Object>> parHistorical() {
        List<Loan> all = loans.findAll();
        BigDecimal outstanding = all.stream().map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal overdue = all.stream()
                .filter(l -> l.getOverdueDays() != null && l.getOverdueDays() > 0)
                .map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pct = outstanding.signum() == 0 ? BigDecimal.ZERO
                : overdue.multiply(BigDecimal.valueOf(100)).divide(outstanding, 2, RoundingMode.HALF_UP);
        List<Map<String, Object>> rows = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 2; i >= 0; i--) {
            rows.add(row("date", today.minusMonths(i).toString(), "balance", overdue, "parPct", pct));
        }
        return rows;
    }

    private List<Map<String, Object>> parTrends() {
        return parHistorical().stream().limit(1)
                .map(r -> row("period", String.valueOf(r.get("date")), "balance", r.get("balance"), "parPct", r.get("parPct")))
                .toList();
    }

    private List<Map<String, Object>> differenceTracker() {
        Map<String, BigDecimal> journalNet = new HashMap<>();
        for (JournalEntry j : journal.findAll()) {
            journalNet.merge(j.getAccountCode(), nz(j.getDebit()).subtract(nz(j.getCredit())), BigDecimal::add);
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        for (GlAccount a : glAccounts.findAll()) {
            BigDecimal actual = journalNet.getOrDefault(a.getCode(), BigDecimal.ZERO);
            BigDecimal expected = nz(a.getBalance());
            BigDecimal diff = expected.subtract(actual);
            if (diff.signum() != 0) {
                rows.add(row("reference", a.getCode() + " " + orBlank(a.getName()),
                        "expected", expected, "actual", actual, "difference", diff));
            }
        }
        return rows;
    }

    private List<Map<String, Object>> cashflow() {
        BigDecimal income = BigDecimal.ZERO, expense = BigDecimal.ZERO, assets = BigDecimal.ZERO,
                liab = BigDecimal.ZERO, equity = BigDecimal.ZERO;
        for (GlAccount a : glAccounts.findAll()) {
            BigDecimal v = nz(a.getBalance());
            switch (orElse(a.getCategory(), "")) {
                case "Income" -> income = income.add(v);
                case "Expense" -> expense = expense.add(v);
                case "Asset" -> assets = assets.add(v);
                case "Liability" -> liab = liab.add(v);
                case "Equity" -> equity = equity.add(v);
                default -> { }
            }
        }
        return List.of(
                row("section", "Operating", "line", "Net income (income - expenses)", "amount", income.subtract(expense)),
                row("section", "Investing", "line", "Net asset movement", "amount", assets),
                row("section", "Financing", "line", "Liabilities & equity", "amount", liab.add(equity)));
    }

    private List<Map<String, Object>> cashPosition() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (GlAccount a : glAccounts.findAll()) {
            if (a.getCode() != null && (a.getCode().startsWith("10") || a.getCode().startsWith("11"))) {
                rows.add(row("account", a.getCode() + " " + orBlank(a.getName()), "balance", nz(a.getBalance())));
            }
        }
        return rows;
    }

    private List<Map<String, Object>> amlDashboard() {
        List<SavingsTransaction> all = transactions.findAll();
        long high = all.stream().filter(t -> nz(t.getAmount()).compareTo(AML_HIGH) >= 0).count();
        long struct = all.stream().filter(t -> nz(t.getAmount()).compareTo(AML_STRUCT_LOW) >= 0
                && nz(t.getAmount()).compareTo(AML_HIGH) < 0).count();
        Map<String, Long> perTellerDay = new HashMap<>();
        for (SavingsTransaction t : all) {
            perTellerDay.merge((t.getTeller() == null ? "?" : t.getTeller()) + "|" + t.getDate(), 1L, Long::sum);
        }
        long rapid = perTellerDay.values().stream().filter(c -> c >= 5).count();
        BigDecimal amount = all.stream().filter(t -> nz(t.getAmount()).compareTo(AML_HIGH) >= 0)
                .map(t -> nz(t.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        return List.of(
                row("pattern", "High value transactions", "alerts", high, "cases", high > 0 ? 1L : 0L, "amount", amount),
                row("pattern", "Structuring (just below threshold)", "alerts", struct, "cases", 0L, "amount", BigDecimal.ZERO),
                row("pattern", "Rapid transactions", "alerts", rapid, "cases", 0L, "amount", BigDecimal.ZERO));
    }

    private List<Map<String, Object>> amlCases() {
        return transactions.findAll().stream()
                .filter(t -> nz(t.getAmount()).compareTo(AML_HIGH) >= 0)
                .limit(25)
                .map(t -> row("caseNo", "AML-" + t.getId(), "pattern", "High value",
                        "member", memberName(t.getMemberId()), "amount", nz(t.getAmount()), "status", "Open"))
                .toList();
    }

    private List<Map<String, Object>> mobileBanking() {
        List<SavingsTransaction> all = transactions.findAll();
        java.util.function.Predicate<SavingsTransaction> mobile =
                t -> t.getChannel() != null && (t.getChannel().toLowerCase().contains("mobile")
                        || t.getChannel().toLowerCase().contains("app")
                        || t.getChannel().toLowerCase().contains("ussd"));
        long count = all.stream().filter(mobile).count();
        BigDecimal amount = all.stream().filter(mobile).map(t -> nz(t.getAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        long users = all.stream().filter(mobile).map(SavingsTransaction::getMemberId).distinct().count();
        return List.of(
                row("metric", "Active mobile users", "count", users, "amount", BigDecimal.ZERO),
                row("metric", "Mobile transactions", "count", count, "amount", amount));
    }

    private List<Map<String, Object>> overdrafts() {
        return accounts.findAll().stream()
                .filter(a -> nz(a.getBalance()).signum() < 0)
                .map(a -> row("accountNo", a.getAccountNo(), "limit", BigDecimal.ZERO, "balance", nz(a.getBalance())))
                .toList();
    }

    private List<Map<String, Object>> overdraftUsage() {
        return accounts.findAll().stream()
                .filter(a -> nz(a.getBalance()).signum() < 0)
                .map(a -> row("accountNo", a.getAccountNo(), "balance", nz(a.getBalance()),
                        "limit", nz(a.getBalance()).abs(), "usagePct", BigDecimal.valueOf(100)))
                .toList();
    }

    private String memberName(Long memberId) {
        if (memberId == null) return "";
        return members.findById(memberId).map(Member::getFullName).orElse(String.valueOf(memberId));
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static String orElse(String v, String fallback) {
        return v == null || v.isBlank() ? fallback : v;
    }

    private static String orBlank(String v) {
        return v == null ? "" : v;
    }

    private static LocalDate parseDate(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return LocalDate.parse(v);
        } catch (Exception e) {
            return null;
        }
    }

    private static Map<String, Object> row(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) {
            m.put(String.valueOf(kv[i]), kv[i + 1]);
        }
        return m;
    }

    private static Map<String, Object> summarize(List<Map<String, Object>> rows) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("rows", rows.size());
        for (String moneyKey : List.of("balance", "amount", "debit", "credit", "provision", "outstanding")) {
            BigDecimal sum = rows.stream()
                    .map(r -> r.get(moneyKey))
                    .filter(Objects::nonNull)
                    .filter(BigDecimal.class::isInstance)
                    .map(BigDecimal.class::cast)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (sum.signum() != 0) s.put(moneyKey + "Total", sum);
        }
        return s;
    }
}
