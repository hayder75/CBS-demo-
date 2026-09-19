package com.cbs.sacco.bank.web;

import com.cbs.sacco.bank.entity.BankAccount;
import com.cbs.sacco.bank.entity.BankReconSession;
import com.cbs.sacco.bank.entity.BankTransaction;
import com.cbs.sacco.bank.repo.BankAccountRepository;
import com.cbs.sacco.bank.repo.BankReconSessionRepository;
import com.cbs.sacco.bank.repo.BankTransactionRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bank")
public class BankReconController {

    private final BankAccountRepository accountRepository;
    private final BankTransactionRepository transactionRepository;
    private final BankReconSessionRepository sessionRepository;

    public BankReconController(BankAccountRepository accountRepository,
                               BankTransactionRepository transactionRepository,
                               BankReconSessionRepository sessionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.sessionRepository = sessionRepository;
    }

    @GetMapping("/accounts")
    public List<BankAccount> listAccounts() {
        return accountRepository.findAllByOrderByIdAsc();
    }

    @PostMapping("/accounts")
    public BankAccount createAccount(@RequestBody Map<String, Object> body) {
        String accountNo = str(body, "accountNo");
        if (accountNo == null || accountNo.isBlank()) {
            throw new IllegalArgumentException("accountNo is required");
        }
        if (accountRepository.existsByAccountNo(accountNo)) {
            throw new IllegalArgumentException("Bank account " + accountNo + " already exists");
        }
        BigDecimal bookBalance = decimal(body, "bookBalance");
        if (bookBalance == null) {
            bookBalance = BigDecimal.ZERO;
        }
        if (bookBalance.signum() < 0) {
            throw new IllegalArgumentException("bookBalance cannot be negative");
        }
        BankAccount account = new BankAccount();
        account.setCode(str(body, "code"));
        account.setBankName(str(body, "bankName"));
        account.setAccountNo(accountNo);
        account.setBranch(str(body, "branch"));
        account.setCurrencyCode(body.get("currencyCode") == null ? "ETB" : str(body, "currencyCode"));
        account.setBookBalance(bookBalance);
        account.setStatus("Active");
        account.setCreatedAt(Instant.now());
        return accountRepository.save(account);
    }

    @GetMapping("/transactions")
    public List<BankTransaction> listTransactions(@RequestParam(required = false) Long accountId) {
        return accountId == null
                ? transactionRepository.findAllByOrderByIdDesc()
                : transactionRepository.findByBankAccountIdOrderByIdDesc(accountId);
    }

    @PostMapping("/transactions")
    public BankTransaction createTransaction(@RequestBody Map<String, Object> body) {
        Long bankAccountId = asLong(body.get("bankAccountId"));
        BankAccount account = bankAccountId == null ? null : accountRepository.findById(bankAccountId).orElse(null);
        if (account == null) {
            throw new IllegalArgumentException("Bank account not found");
        }
        BigDecimal amount = decimal(body, "amount");
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount must be greater than zero");
        }
        String type = "Withdrawal".equals(str(body, "type")) ? "Withdrawal" : "Deposit";
        LocalDate date = date(body, "date");
        BankTransaction txn = new BankTransaction();
        txn.setBankAccountId(account.getId());
        txn.setDate(date == null ? LocalDate.now() : date);
        txn.setRef(str(body, "ref"));
        txn.setDescription(str(body, "description"));
        txn.setType(type);
        txn.setAmount(amount);
        txn.setReconStatus("Unmatched");
        txn.setCreatedAt(Instant.now());
        return transactionRepository.save(txn);
    }

    @GetMapping("/recon")
    public List<BankReconSession> listSessions() {
        return sessionRepository.findAllByOrderByStartedAtDesc();
    }

    @GetMapping("/recon/unmatched")
    public List<BankTransaction> listUnmatched(@RequestParam(required = false) Long accountId) {
        return accountId == null
                ? transactionRepository.findByReconStatusOrderByIdDesc("Unmatched")
                : transactionRepository.findByBankAccountIdAndReconStatusOrderByIdDesc(accountId, "Unmatched");
    }

    @PostMapping("/recon/start")
    public BankReconSession start(@RequestBody Map<String, Object> body) {
        Long bankAccountId = asLong(body.get("bankAccountId"));
        BankAccount account = bankAccountId == null ? null : accountRepository.findById(bankAccountId).orElse(null);
        if (account == null) {
            throw new NotFoundException("Bank account not found: " + bankAccountId);
        }
        sessionRepository.findFirstByBankAccountIdAndStatus(account.getId(), "Open").ifPresent(existing -> {
            throw new IllegalArgumentException("An open reconciliation session already exists for this account");
        });
        BigDecimal statementBalance = decimal(body, "statementBalance");
        if (statementBalance == null) {
            throw new IllegalArgumentException("statementBalance is required");
        }
        BankReconSession session = new BankReconSession();
        session.setBankAccountId(account.getId());
        session.setBankAccountLabel(account.getBankName() + " • " + last4(account.getAccountNo()));
        LocalDate statementDate = date(body, "statementDate");
        session.setStatementDate(statementDate == null ? LocalDate.now() : statementDate);
        session.setStatementBalance(statementBalance);
        session.setBookBalance(account.getBookBalance());
        session.setDifference(statementBalance.subtract(account.getBookBalance()).setScale(2, RoundingMode.HALF_UP));
        session.setStatus("Open");
        session.setMatchedCount((int) transactionRepository
                .countByBankAccountIdAndReconStatus(account.getId(), "Matched"));
        session.setUnmatchedCount((int) transactionRepository
                .countByBankAccountIdAndReconStatus(account.getId(), "Unmatched"));
        session.setStartedBy(body.get("startedBy") == null ? "System" : str(body, "startedBy"));
        session.setStartedAt(Instant.now());
        return sessionRepository.save(session);
    }

    @PostMapping("/recon/{txnId}/match")
    public BankTransaction match(@PathVariable Long txnId) {
        BankTransaction txn = transactionRepository.findById(txnId)
                .orElseThrow(() -> new NotFoundException("Bank transaction not found: " + txnId));
        if (!"Unmatched".equals(txn.getReconStatus())) {
            throw new IllegalArgumentException("Only unmatched transactions can be matched");
        }
        txn.setReconStatus("Matched");
        BankTransaction saved = transactionRepository.save(txn);
        refreshOpenSession(txn.getBankAccountId());
        return saved;
    }

    @PostMapping("/recon/{txnId}/exclude")
    public BankTransaction exclude(@PathVariable Long txnId) {
        BankTransaction txn = transactionRepository.findById(txnId)
                .orElseThrow(() -> new NotFoundException("Bank transaction not found: " + txnId));
        if ("Matched".equals(txn.getReconStatus())) {
            throw new IllegalArgumentException("Matched transactions cannot be excluded");
        }
        txn.setReconStatus("Excluded");
        BankTransaction saved = transactionRepository.save(txn);
        refreshOpenSession(txn.getBankAccountId());
        return saved;
    }

    @PostMapping("/recon/{sessionId}/complete")
    public BankReconSession complete(@PathVariable Long sessionId) {
        BankReconSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Reconciliation session not found: " + sessionId));
        if (!"Open".equals(session.getStatus())) {
            throw new IllegalArgumentException("Only open reconciliation sessions can be completed");
        }
        int matched = (int) transactionRepository
                .countByBankAccountIdAndReconStatus(session.getBankAccountId(), "Matched");
        int unmatched = (int) transactionRepository
                .countByBankAccountIdAndReconStatus(session.getBankAccountId(), "Unmatched");
        if (unmatched > 0) {
            throw new IllegalArgumentException(unmatched + " unmatched transaction(s) must be resolved first");
        }
        session.setMatchedCount(matched);
        session.setUnmatchedCount(unmatched);
        session.setStatus("Completed");
        session.setCompletedAt(Instant.now());
        return sessionRepository.save(session);
    }

    private void refreshOpenSession(Long bankAccountId) {
        sessionRepository.findFirstByBankAccountIdAndStatus(bankAccountId, "Open").ifPresent(session -> {
            session.setMatchedCount((int) transactionRepository
                    .countByBankAccountIdAndReconStatus(bankAccountId, "Matched"));
            session.setUnmatchedCount((int) transactionRepository
                    .countByBankAccountIdAndReconStatus(bankAccountId, "Unmatched"));
            sessionRepository.save(session);
        });
    }

    private static String last4(String value) {
        if (value == null) {
            return "";
        }
        return value.length() <= 4 ? value : value.substring(value.length() - 4);
    }

    private static Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("value must be a number");
        }
    }

    private static BigDecimal decimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) {
            return null;
        }
        try {
            return value instanceof Number n ? new BigDecimal(n.toString()) : new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static String str(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : value.toString();
    }

    private static LocalDate date(Map<String, Object> body, String key) {
        String value = str(body, key);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (Exception e) {
            throw new IllegalArgumentException(key + " must be a valid date");
        }
    }
}
