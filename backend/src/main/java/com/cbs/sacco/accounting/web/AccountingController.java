package com.cbs.sacco.accounting.web;

import com.cbs.sacco.accounting.entity.GlAccount;
import com.cbs.sacco.accounting.entity.JournalEntry;
import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.accounting.repo.JournalEntryRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounting")
public class AccountingController {

    private final GlAccountRepository glAccountRepository;
    private final JournalEntryRepository journalEntryRepository;

    public AccountingController(GlAccountRepository glAccountRepository, JournalEntryRepository journalEntryRepository) {
        this.glAccountRepository = glAccountRepository;
        this.journalEntryRepository = journalEntryRepository;
    }

    @GetMapping("/accounts")
    public List<GlAccount> accounts() {
        return glAccountRepository.findAll();
    }

    @GetMapping("/journal")
    public List<JournalEntry> journal() {
        return journalEntryRepository.findAll();
    }

    @PostMapping("/journal")
    @Transactional
    public List<JournalEntry> post(@RequestBody Map<String, Object> body) {
        String debitCode = str(body, "debitAccountCode");
        String creditCode = str(body, "creditAccountCode");
        BigDecimal debit = dec(body, "debit");
        BigDecimal credit = dec(body, "credit");

        if (debitCode == null || creditCode == null) {
            throw new IllegalArgumentException("debitAccountCode and creditAccountCode are required");
        }
        if (debit == null || credit == null || debit.signum() <= 0 || credit.signum() <= 0) {
            throw new IllegalArgumentException("debit and credit must be positive amounts");
        }
        if (debit.compareTo(credit) != 0) {
            throw new IllegalArgumentException("Journal entry is unbalanced: debit " + debit + " != credit " + credit);
        }

        GlAccount debitAccount = glAccountRepository.findAll().stream()
                .filter(a -> debitCode.equals(a.getCode())).findFirst()
                .orElseThrow(() -> new NotFoundException("Debit account not found: " + debitCode));
        GlAccount creditAccount = glAccountRepository.findAll().stream()
                .filter(a -> creditCode.equals(a.getCode())).findFirst()
                .orElseThrow(() -> new NotFoundException("Credit account not found: " + creditCode));

        String date = str(body, "date");
        String ref = str(body, "ref");
        if (ref == null || ref.isBlank()) {
            ref = "JRN-" + LocalDate.now().getYear() + "-" + String.format("%03d", journalEntryRepository.count() + 1);
        }
        String description = str(body, "description");

        LocalDate jrnDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        debitAccount.setBalance(debitAccount.getBalance().add(debit));
        creditAccount.setBalance(creditAccount.getBalance().subtract(credit));
        glAccountRepository.saveAll(List.of(debitAccount, creditAccount));

        JournalEntry debitRow = row(jrnDate, ref, description, debitCode, debitAccount.getName(), debit, BigDecimal.ZERO);
        JournalEntry creditRow = row(jrnDate, ref, description, creditCode, creditAccount.getName(), BigDecimal.ZERO, credit);
        return List.of(journalEntryRepository.save(debitRow), journalEntryRepository.save(creditRow));
    }

    private static JournalEntry row(LocalDate date, String ref, String desc, String code,
                                    String name, BigDecimal debit, BigDecimal credit) {
        JournalEntry e = new JournalEntry();
        e.setDate(date);
        e.setRef(ref);
        e.setDescription(desc);
        e.setAccountCode(code);
        e.setAccountName(name);
        e.setDebit(debit);
        e.setCredit(credit);
        e.setPostedBy("System");
        return e;
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