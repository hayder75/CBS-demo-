package com.cbs.sacco.loanlifecycle.web;

import com.cbs.sacco.account.entity.SavingsAccount;
import com.cbs.sacco.account.repo.SavingsAccountRepository;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.loan.entity.Loan;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.loanlifecycle.entity.LoanAutoDebit;
import com.cbs.sacco.loanlifecycle.entity.LoanRecovery;
import com.cbs.sacco.loanlifecycle.entity.LoanRestructure;
import com.cbs.sacco.loanlifecycle.entity.LoanWriteOff;
import com.cbs.sacco.loanlifecycle.entity.ProvisionPolicy;
import com.cbs.sacco.loanlifecycle.entity.ProvisionRun;
import com.cbs.sacco.loanlifecycle.repo.LoanAutoDebitRepository;
import com.cbs.sacco.loanlifecycle.repo.LoanRecoveryRepository;
import com.cbs.sacco.loanlifecycle.repo.LoanRestructureRepository;
import com.cbs.sacco.loanlifecycle.repo.LoanWriteOffRepository;
import com.cbs.sacco.loanlifecycle.repo.ProvisionPolicyRepository;
import com.cbs.sacco.loanlifecycle.repo.ProvisionRunRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class LoanLifecycleController {

    private static final String DEFAULT_REQUESTER = "Kaleab Desta";
    private static final String DEFAULT_CHECKER = "Sisay Worku";
    private static final Set<String> ELIGIBLE_STATUS =
            Set.of("Disbursed", "Partially Paid", "Restructured");
    private static final Set<String> CLASSIFICATIONS =
            Set.of("Pass", "Special Mention", "Substandard", "Doubtful", "Loss");

    private final LoanRestructureRepository restructureRepository;
    private final LoanWriteOffRepository writeOffRepository;
    private final LoanRecoveryRepository recoveryRepository;
    private final ProvisionPolicyRepository policyRepository;
    private final ProvisionRunRepository runRepository;
    private final LoanAutoDebitRepository autoDebitRepository;
    private final LoanRepository loanRepository;
    private final SavingsAccountRepository accountRepository;
    private final MemberRepository memberRepository;

    public LoanLifecycleController(
            LoanRestructureRepository restructureRepository,
            LoanWriteOffRepository writeOffRepository,
            LoanRecoveryRepository recoveryRepository,
            ProvisionPolicyRepository policyRepository,
            ProvisionRunRepository runRepository,
            LoanAutoDebitRepository autoDebitRepository,
            LoanRepository loanRepository,
            SavingsAccountRepository accountRepository,
            MemberRepository memberRepository) {
        this.restructureRepository = restructureRepository;
        this.writeOffRepository = writeOffRepository;
        this.recoveryRepository = recoveryRepository;
        this.policyRepository = policyRepository;
        this.runRepository = runRepository;
        this.autoDebitRepository = autoDebitRepository;
        this.loanRepository = loanRepository;
        this.accountRepository = accountRepository;
        this.memberRepository = memberRepository;
    }


    @GetMapping("/loan-restructures")
    public List<LoanRestructure> listRestructures() {
        return restructureRepository.findAll();
    }

    @PostMapping("/loan-restructures")
    public LoanRestructure createRestructure(@RequestBody Map<String, Object> body) {
        Loan loan = findLoan(body.get("loanId"));
        if (!ELIGIBLE_STATUS.contains(loan.getStatus())) {
            throw new IllegalArgumentException(
                    "Loan " + loan.getLoanNo() + " is not eligible for restructuring (status: " + loan.getStatus() + ")");
        }
        if (!restructureRepository.findByLoanIdAndStatus(loan.getId(), "Pending").isEmpty()) {
            throw new IllegalArgumentException("A pending restructure already exists for this loan");
        }
        Integer newTermMonths = asInt(body, "newTermMonths");
        if (newTermMonths == null || newTermMonths <= 0) {
            throw new IllegalArgumentException("newTermMonths must be greater than zero");
        }
        BigDecimal newRatePct = asDecimal(body, "newRatePct");
        if (newRatePct == null || newRatePct.signum() < 0 || newRatePct.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("newRatePct must be between 0 and 100");
        }
        String reason = asString(body, "reason");
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Reason is required");
        }
        BigDecimal fee = asDecimal(body, "fee");
        if (fee == null) fee = BigDecimal.ZERO;
        if (fee.signum() < 0) {
            throw new IllegalArgumentException("fee must be non-negative");
        }

        LoanRestructure row = new LoanRestructure();
        row.setLoanId(loan.getId());
        row.setLoanNo(loan.getLoanNo());
        row.setMemberName(memberName(loan.getMemberId()));
        row.setOldTermMonths(loan.getTermMonths());
        row.setNewTermMonths(newTermMonths);
        row.setOldRatePct(loan.getRatePct() == null ? BigDecimal.ZERO : loan.getRatePct());
        row.setNewRatePct(newRatePct);
        row.setOutstanding(loan.getBalance() == null ? BigDecimal.ZERO : loan.getBalance());
        row.setReason(reason.trim());
        row.setFee(fee);
        row.setStatus("Pending");
        String requestedBy = asString(body, "requestedBy");
        row.setRequestedBy(requestedBy == null || requestedBy.isBlank() ? DEFAULT_REQUESTER : requestedBy);
        row.setRequestedAt(LocalDateTime.now());
        return restructureRepository.save(row);
    }

    @PostMapping("/loan-restructures/{id}/approve")
    public LoanRestructure approveRestructure(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        LoanRestructure row = findRestructure(id);
        if (!"Pending".equals(row.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending restructures can be approved (current: " + row.getStatus() + ")");
        }
        String approvedBy = body == null ? null : asString(body, "approvedBy");
        if (approvedBy == null || approvedBy.isBlank()) approvedBy = DEFAULT_CHECKER;
        if (approvedBy.equals(row.getRequestedBy())) {
            throw new IllegalArgumentException("Maker and checker must be different users");
        }
        row.setStatus("Approved");
        row.setApprovedBy(approvedBy);
        return restructureRepository.save(row);
    }

    @PostMapping("/loan-restructures/{id}/reject")
    public LoanRestructure rejectRestructure(@PathVariable Long id) {
        LoanRestructure row = findRestructure(id);
        if (!"Pending".equals(row.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending restructures can be rejected (current: " + row.getStatus() + ")");
        }
        row.setStatus("Rejected");
        return restructureRepository.save(row);
    }

    @PostMapping("/loan-restructures/{id}/execute")
    public LoanRestructure executeRestructure(@PathVariable Long id) {
        LoanRestructure row = findRestructure(id);
        if (!"Approved".equals(row.getStatus())) {
            throw new IllegalArgumentException(
                    "Only approved restructures can be executed (current: " + row.getStatus() + ")");
        }
        Loan loan = loanRepository.findById(row.getLoanId())
                .orElseThrow(() -> new NotFoundException("Linked loan not found: " + row.getLoanId()));
        loan.setTermMonths(row.getNewTermMonths());
        loan.setRatePct(row.getNewRatePct());
        loan.setStatus("Restructured");
        loanRepository.save(loan);
        row.setStatus("Executed");
        return restructureRepository.save(row);
    }


    @GetMapping("/loan-writeoffs")
    public List<LoanWriteOff> listWriteOffs() {
        return writeOffRepository.findAll();
    }

    @PostMapping("/loan-writeoffs")
    public LoanWriteOff createWriteOff(@RequestBody Map<String, Object> body) {
        Loan loan = findLoan(body.get("loanId"));
        BigDecimal loanBalance = loan.getBalance() == null ? BigDecimal.ZERO : loan.getBalance();
        if (loanBalance.signum() <= 0) {
            throw new IllegalArgumentException("Loan has no outstanding balance to write off");
        }
        String type = "Partial".equalsIgnoreCase(asString(body, "type")) ? "Partial" : "Full";
        BigDecimal balance;
        if ("Full".equals(type)) {
            balance = loanBalance;
        } else {
            BigDecimal amount = asDecimal(body, "amount");
            if (amount == null || amount.signum() <= 0) {
                throw new IllegalArgumentException("Write-off amount must be greater than zero");
            }
            if (amount.compareTo(loanBalance) > 0) {
                throw new IllegalArgumentException("Partial write-off cannot exceed the loan balance");
            }
            balance = amount;
        }
        String reason = asString(body, "reason");
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Reason is required");
        }

        LoanWriteOff row = new LoanWriteOff();
        row.setLoanId(loan.getId());
        row.setLoanNo(loan.getLoanNo());
        row.setMemberName(memberName(loan.getMemberId()));
        row.setBalance(balance.setScale(2, RoundingMode.HALF_UP));
        row.setType(type);
        row.setReason(reason.trim());
        row.setStatus("Pending");
        String requestedBy = asString(body, "requestedBy");
        row.setRequestedBy(requestedBy == null || requestedBy.isBlank() ? DEFAULT_REQUESTER : requestedBy);
        row.setRequestedAt(LocalDateTime.now());
        return writeOffRepository.save(row);
    }

    @PostMapping("/loan-writeoffs/{id}/approve")
    public LoanWriteOff approveWriteOff(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        LoanWriteOff row = findWriteOff(id);
        if (row.getBalance() == null || row.getBalance().signum() <= 0) {
            throw new IllegalArgumentException("Cannot approve a write-off with a non-positive balance");
        }
        if (!"Pending".equals(row.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending write-offs can be approved (current: " + row.getStatus() + ")");
        }
        String approvedBy = body == null ? null : asString(body, "approvedBy");
        if (approvedBy == null || approvedBy.isBlank()) approvedBy = DEFAULT_CHECKER;
        if (approvedBy.equals(row.getRequestedBy())) {
            throw new IllegalArgumentException("Maker and checker must be different users");
        }
        row.setStatus("Approved");
        row.setApprovedBy(approvedBy);
        loanRepository.findById(row.getLoanId()).ifPresent(loan -> {
            BigDecimal current = loan.getBalance() == null ? BigDecimal.ZERO : loan.getBalance();
            BigDecimal remaining = current.subtract(row.getBalance()).max(BigDecimal.ZERO);
            loan.setBalance(remaining.setScale(2, RoundingMode.HALF_UP));
            if (remaining.signum() == 0) {
                loan.setStatus("Write-Off");
            }
            loanRepository.save(loan);
        });
        return writeOffRepository.save(row);
    }

    @PostMapping("/loan-writeoffs/{id}/reject")
    public LoanWriteOff rejectWriteOff(@PathVariable Long id) {
        LoanWriteOff row = findWriteOff(id);
        if (row.getBalance() == null || row.getBalance().signum() <= 0) {
            throw new IllegalArgumentException("Cannot reject a write-off with a non-positive balance");
        }
        if (!"Pending".equals(row.getStatus())) {
            throw new IllegalArgumentException(
                    "Only pending write-offs can be rejected (current: " + row.getStatus() + ")");
        }
        row.setStatus("Rejected");
        return writeOffRepository.save(row);
    }


    @GetMapping("/loan-recoveries")
    public List<LoanRecovery> listRecoveries() {
        return recoveryRepository.findAll();
    }

    @PostMapping("/loan-recoveries")
    public LoanRecovery createRecovery(@RequestBody Map<String, Object> body) {
        Loan loan = findLoan(body.get("loanId"));
        BigDecimal amount = asDecimal(body, "amount");
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        String source = "Savings".equalsIgnoreCase(asString(body, "source")) ? "Savings" : "Cash";
        LocalDate date = asDate(body, "date");
        if (date == null) date = LocalDate.now();

        LoanRecovery row = new LoanRecovery();
        row.setLoanId(loan.getId());
        row.setLoanNo(loan.getLoanNo());
        row.setMemberName(memberName(loan.getMemberId()));
        row.setDate(date);
        row.setAmount(amount.setScale(2, RoundingMode.HALF_UP));
        row.setSource(source);
        String recordedBy = asString(body, "recordedBy");
        row.setRecordedBy(recordedBy == null || recordedBy.isBlank() ? DEFAULT_REQUESTER : recordedBy);
        LoanRecovery saved = recoveryRepository.save(row);

        BigDecimal current = loan.getBalance() == null ? BigDecimal.ZERO : loan.getBalance();
        if (current.signum() > 0) {
            BigDecimal remaining = current.subtract(amount).max(BigDecimal.ZERO);
            loan.setBalance(remaining.setScale(2, RoundingMode.HALF_UP));
            if (remaining.signum() == 0) {
                loan.setStatus("Fully Paid");
            }
            loanRepository.save(loan);
        }
        return saved;
    }


    @GetMapping("/provision-policy")
    public List<ProvisionPolicy> listPolicy() {
        return policyRepository.findAll();
    }

    @PostMapping("/provision-policy")
    @SuppressWarnings("unchecked")
    public List<ProvisionPolicy> savePolicy(@RequestBody Map<String, Object> body) {
        Object rows = body.get("rows");
        List<Map<String, Object>> incoming;
        if (rows instanceof List<?> list) {
            incoming = (List<Map<String, Object>>) list;
        } else {
            incoming = List.of(body);
        }
        for (Map<String, Object> entry : incoming) {
            String classification = asString(entry, "classification");
            if (classification == null || !CLASSIFICATIONS.contains(classification)) {
                throw new IllegalArgumentException("Unknown classification: " + classification);
            }
            BigDecimal pct = asDecimal(entry, "provisionPct");
            if (pct == null || pct.signum() < 0 || pct.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new IllegalArgumentException("provisionPct must be between 0 and 100");
            }
            ProvisionPolicy policy = policyRepository.findByClassification(classification).orElseGet(() -> {
                ProvisionPolicy created = new ProvisionPolicy();
                created.setClassification(classification);
                return created;
            });
            policy.setProvisionPct(pct);
            policyRepository.save(policy);
        }
        return policyRepository.findAll();
    }

    @GetMapping("/provisioning/runs")
    public List<ProvisionRun> listRuns() {
        return runRepository.findAll();
    }

    @PostMapping("/provisioning/run")
    public ProvisionRun runProvisioning() {
        List<ProvisionPolicy> policies = policyRepository.findAll();
        BigDecimal total = BigDecimal.ZERO;
        int processed = 0;
        for (Loan loan : loanRepository.findAll()) {
            BigDecimal balance = loan.getBalance() == null ? BigDecimal.ZERO : loan.getBalance();
            if (balance.signum() <= 0) continue;
            processed++;
            BigDecimal pct = policies.stream()
                    .filter(p -> p.getClassification().equals(loan.getClassification()))
                    .map(ProvisionPolicy::getProvisionPct)
                    .findFirst()
                    .orElse(BigDecimal.ZERO);
            total = total.add(balance.multiply(pct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        ProvisionRun run = new ProvisionRun();
        run.setBusinessDate(LocalDate.now());
        run.setLoansProcessed(processed);
        run.setTotalProvision(total.setScale(2, RoundingMode.HALF_UP));
        run.setRunAt(LocalDateTime.now());
        run.setRunBy(DEFAULT_CHECKER);
        return runRepository.save(run);
    }


    @GetMapping("/loan-auto-debit")
    public List<LoanAutoDebit> listAutoDebit() {
        return autoDebitRepository.findAll();
    }

    @PostMapping("/loan-auto-debit/run")
    public List<LoanAutoDebit> runAutoDebit() {
        autoDebitRepository.deleteAll();
        List<LoanAutoDebit> fresh = new java.util.ArrayList<>();
        for (Loan loan : loanRepository.findAll()) {
            if (loan.getNextDueDate() == null) continue;
            BigDecimal balance = loan.getBalance() == null ? BigDecimal.ZERO : loan.getBalance();
            if (balance.signum() <= 0) continue;
            if (!"Disbursed".equals(loan.getStatus()) && !"Partially Paid".equals(loan.getStatus())) continue;
            int term = loan.getTermMonths() == null || loan.getTermMonths() <= 0 ? 1 : loan.getTermMonths();
            BigDecimal installment = balance
                    .divide(BigDecimal.valueOf(term), 0, RoundingMode.HALF_UP);
            BigDecimal savings = accountRepository.findByMemberId(loan.getMemberId()).stream()
                    .map(SavingsAccount::getBalance)
                    .filter(b -> b != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LoanAutoDebit row = new LoanAutoDebit();
            row.setLoanId(loan.getId());
            row.setLoanNo(loan.getLoanNo());
            row.setMemberName(memberName(loan.getMemberId()));
            row.setInstallment(installment);
            row.setSavingsBalance(savings);
            row.setStatus(savings.compareTo(installment) >= 0 ? "Debited" : "Insufficient");
            fresh.add(row);
        }
        return autoDebitRepository.saveAll(fresh);
    }


    private Loan findLoan(Object rawId) {
        Long id = longValue(rawId);
        if (id == null) throw new IllegalArgumentException("loanId is required");
        return loanRepository.findById(id).orElseThrow(() -> new NotFoundException("Loan not found: " + id));
    }

    private LoanRestructure findRestructure(Long id) {
        return restructureRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Restructure not found: " + id));
    }

    private LoanWriteOff findWriteOff(Long id) {
        return writeOffRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Write-off not found: " + id));
    }

    private String memberName(Long memberId) {
        if (memberId == null) return null;
        return memberRepository.findById(memberId).map(Member::getFullName).orElse(null);
    }

    private static Long longValue(Object v) {
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.longValue() : Long.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("id must be a number");
        }
    }

    private static String asString(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static BigDecimal asDecimal(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? new BigDecimal(n.toString()) : new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static Integer asInt(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.intValue() : Integer.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static LocalDate asDate(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return LocalDate.parse(v.toString());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(key + " must be a valid date (YYYY-MM-DD)");
        }
    }
}
