package com.cbs.sacco.savings.service;

import com.cbs.sacco.account.entity.SavingsAccount;
import com.cbs.sacco.account.repo.SavingsAccountRepository;
import com.cbs.sacco.accounting.entity.GlAccount;
import com.cbs.sacco.accounting.entity.JournalEntry;
import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.accounting.repo.JournalEntryRepository;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.savings.entity.SavingsProduct;
import com.cbs.sacco.savings.entity.SavingsTransaction;
import com.cbs.sacco.savings.repo.SavingsProductRepository;
import com.cbs.sacco.savings.repo.SavingsTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SavingsService {

    private static final String CASH_ACCOUNT = "1000";
    private static final String MANDATORY_GL = "1200";
    private static final String VOLUNTARY_GL = "1201";
    private static final String INTEREST_EXPENSE_GL = "3310";
    private static final String FEE_INCOME_GL = "2100";

    private final MemberRepository memberRepository;
    private final SavingsProductRepository productRepository;
    private final SavingsTransactionRepository transactionRepository;
    private final SavingsAccountRepository accountRepository;
    private final GlAccountRepository glAccountRepository;
    private final JournalEntryRepository journalEntryRepository;

    public SavingsService(MemberRepository memberRepository,
                          SavingsProductRepository productRepository,
                          SavingsTransactionRepository transactionRepository,
                          SavingsAccountRepository accountRepository,
                          GlAccountRepository glAccountRepository,
                          JournalEntryRepository journalEntryRepository) {
        this.memberRepository = memberRepository;
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.glAccountRepository = glAccountRepository;
        this.journalEntryRepository = journalEntryRepository;
    }

    @Transactional
    public SavingsTransaction transact(Long memberId, Long productId, String type,
                                       BigDecimal amount, String teller, String channel) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Amount must be a positive number");
        }
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new NotFoundException("Member not found: " + memberId));
        SavingsProduct product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Savings product not found: " + productId));

        boolean deposit = "Deposit".equalsIgnoreCase(type);
        boolean withdrawal = "Withdrawal".equalsIgnoreCase(type);
        if (!deposit && !withdrawal) {
            throw new IllegalArgumentException("type must be 'Deposit' or 'Withdrawal'");
        }

        BigDecimal newBalance = deposit
                ? member.getSavingsBalance().add(amount)
                : member.getSavingsBalance().subtract(amount);
        if (newBalance.signum() < 0) {
            throw new IllegalStateException("Insufficient savings balance for withdrawal");
        }
        if (newBalance.compareTo(product.getMinBalance()) < 0) {
            throw new IllegalStateException("Withdrawal would breach minimum balance of "
                    + product.getMinBalance());
        }
        member.setSavingsBalance(newBalance);
        memberRepository.save(member);

        SavingsTransaction tx = new SavingsTransaction();
        tx.setMemberId(memberId);
        tx.setProductId(productId);
        tx.setDate(LocalDate.now());
        tx.setType(deposit ? "Deposit" : "Withdrawal");
        tx.setAmount(amount);
        tx.setTeller(teller != null ? teller : "System");
        tx.setChannel(channel != null ? channel : "Cash");
        transactionRepository.save(tx);

        postGl(deposit, amount, product, teller);
        return tx;
    }

    @Transactional
    public int postMonthlyInterest() {
        int count = 0;
        for (SavingsProduct product : productRepository.findAll()) {
            BigDecimal rate = product.getInterestRatePct();
            if (rate == null || rate.signum() <= 0) continue;

            BigDecimal productInterest = BigDecimal.ZERO;
            boolean minimumBalanceMethod = "Minimum Balance".equalsIgnoreCase(product.getInterestMethod());

            for (SavingsAccount account : accountRepository.findByProductId(product.getId())) {
                BigDecimal balance = safe(account.getBalance());
                if (balance.signum() <= 0) continue;

                Member member = memberRepository.findById(account.getMemberId()).orElse(null);
                if (member == null) continue;

                BigDecimal base = balance;
                if (minimumBalanceMethod) {
                    BigDecimal minBalance = safe(product.getMinBalance());
                    if (minBalance.signum() > 0) base = balance.min(minBalance);
                }
                BigDecimal interest = base.multiply(rate)
                        .divide(BigDecimal.valueOf(1200), 2, RoundingMode.HALF_UP);
                if (interest.signum() <= 0) continue;

                account.setBalance(balance.add(interest));
                accountRepository.save(account);

                member.setSavingsBalance(safe(member.getSavingsBalance()).add(interest));
                memberRepository.save(member);

                SavingsTransaction tx = new SavingsTransaction();
                tx.setMemberId(account.getMemberId());
                tx.setProductId(product.getId());
                tx.setDate(LocalDate.now());
                tx.setType("Interest");
                tx.setAmount(interest);
                tx.setTeller("System");
                tx.setChannel("Bank");
                transactionRepository.save(tx);

                productInterest = productInterest.add(interest);
                count++;
            }

            if (productInterest.signum() > 0) {
                String expenseCode = codeOr(product.getGlInterestExpenseCode(), INTEREST_EXPENSE_GL);
                String liabilityCode = codeOr(product.getGlLiabilityCode(),
                        "Mandatory".equals(product.getType()) ? MANDATORY_GL : VOLUNTARY_GL);
                GlAccount expense = glAccount(expenseCode);
                GlAccount savings = glAccount(liabilityCode);
                expense.setBalance(safe(expense.getBalance()).add(productInterest));
                savings.setBalance(safe(savings.getBalance()).subtract(productInterest));
                glAccountRepository.saveAll(List.of(expense, savings));

                String ref = "JRN-" + LocalDate.now().getYear() + "-INT-" + product.getId()
                        + "-" + (journalEntryRepository.count() + 1);
                journalEntryRepository.save(entry(LocalDate.now(), ref, "Monthly interest posting",
                        expenseCode, expense.getName(), productInterest, BigDecimal.ZERO, "System"));
                journalEntryRepository.save(entry(LocalDate.now(), ref, "Monthly interest posting",
                        liabilityCode, savings.getName(), BigDecimal.ZERO, productInterest, "System"));
            }
        }
        return count;
    }

    @Transactional
    public Map<String, Object> postMaintenanceFees() {
        int posted = 0;
        int skipped = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SavingsProduct product : productRepository.findAll()) {
            BigDecimal feeAmount = safe(product.getMaintenanceFee());
            String frequency = product.getMaintenanceFeeFrequency();
            if (feeAmount.signum() <= 0 || frequency == null || frequency.isBlank()
                    || "None".equalsIgnoreCase(frequency)) {
                continue;
            }

            BigDecimal productTotal = BigDecimal.ZERO;
            for (SavingsAccount account : accountRepository.findByProductId(product.getId())) {
                BigDecimal balance = safe(account.getBalance());
                if (balance.signum() <= 0) continue;
                Member member = memberRepository.findById(account.getMemberId()).orElse(null);
                if (member == null) continue;
                BigDecimal available = balance.subtract(safe(product.getMinBalance()));
                if (available.signum() < 0) available = BigDecimal.ZERO;
                BigDecimal charge = feeAmount.min(available).setScale(2, RoundingMode.HALF_UP);
                if (charge.signum() <= 0) {
                    skipped++;
                    continue;
                }

                account.setBalance(balance.subtract(charge));
                accountRepository.save(account);

                member.setSavingsBalance(safe(member.getSavingsBalance()).subtract(charge).max(BigDecimal.ZERO));
                memberRepository.save(member);

                SavingsTransaction tx = new SavingsTransaction();
                tx.setMemberId(account.getMemberId());
                tx.setProductId(product.getId());
                tx.setDate(LocalDate.now());
                tx.setType("Fee");
                tx.setAmount(charge);
                tx.setTeller("System");
                tx.setChannel("Bank");
                transactionRepository.save(tx);

                productTotal = productTotal.add(charge);
                posted++;
            }

            if (productTotal.signum() > 0) {
                String feeCode = codeOr(product.getGlFeeIncomeCode(), FEE_INCOME_GL);
                String liabilityCode = codeOr(product.getGlLiabilityCode(),
                        "Mandatory".equals(product.getType()) ? MANDATORY_GL : VOLUNTARY_GL);
                GlAccount feeIncome = glAccount(feeCode);
                GlAccount savings = glAccount(liabilityCode);
                feeIncome.setBalance(safe(feeIncome.getBalance()).subtract(productTotal));
                savings.setBalance(safe(savings.getBalance()).add(productTotal));
                glAccountRepository.saveAll(List.of(feeIncome, savings));

                String ref = "JRN-" + LocalDate.now().getYear() + "-FEE-" + product.getId()
                        + "-" + (journalEntryRepository.count() + 1);
                journalEntryRepository.save(entry(LocalDate.now(), ref, "Maintenance fee posting",
                        liabilityCode, savings.getName(), productTotal, BigDecimal.ZERO, "System"));
                journalEntryRepository.save(entry(LocalDate.now(), ref, "Maintenance fee posting",
                        feeCode, feeIncome.getName(), BigDecimal.ZERO, productTotal, "System"));
                totalAmount = totalAmount.add(productTotal);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("posted", posted);
        result.put("totalAmount", totalAmount);
        result.put("skipped", skipped);
        return result;
    }

    @Transactional
    public Map<String, Object> chargePassbookFee(Long memberId, Long productId) {
        SavingsProduct product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Savings product not found: " + productId));
        SavingsAccount account = accountRepository.findByMemberId(memberId).stream()
                .filter(a -> productId.equals(a.getProductId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException(
                        "Savings account not found for member " + memberId + " and product " + productId));

        BigDecimal fee = safe(product.getPassbookFee()).setScale(2, RoundingMode.HALF_UP);
        if (fee.signum() <= 0) {
            throw new IllegalArgumentException("passbookFee must be greater than zero");
        }

        BigDecimal balance = safe(account.getBalance());
        if (balance.subtract(fee).compareTo(safe(product.getMinBalance())) < 0) {
            throw new IllegalArgumentException("Passbook fee would reduce balance below minimum balance");
        }

        account.setBalance(balance.subtract(fee));
        accountRepository.save(account);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new NotFoundException("Member not found: " + memberId));
        member.setSavingsBalance(safe(member.getSavingsBalance()).subtract(fee).max(BigDecimal.ZERO));
        memberRepository.save(member);

        SavingsTransaction tx = new SavingsTransaction();
        tx.setMemberId(memberId);
        tx.setProductId(productId);
        tx.setDate(LocalDate.now());
        tx.setType("Fee");
        tx.setAmount(fee);
        tx.setTeller("System");
        tx.setChannel("Bank");
        transactionRepository.save(tx);

        String feeCode = codeOr(product.getGlFeeIncomeCode(), FEE_INCOME_GL);
        String liabilityCode = codeOr(product.getGlLiabilityCode(),
                "Mandatory".equals(product.getType()) ? MANDATORY_GL : VOLUNTARY_GL);
        GlAccount feeIncome = glAccount(feeCode);
        GlAccount savings = glAccount(liabilityCode);
        feeIncome.setBalance(safe(feeIncome.getBalance()).subtract(fee));
        savings.setBalance(safe(savings.getBalance()).add(fee));
        glAccountRepository.saveAll(List.of(feeIncome, savings));

        String ref = "JRN-" + LocalDate.now().getYear() + "-PB-" + memberId + "-" + productId
                + "-" + (journalEntryRepository.count() + 1);
        journalEntryRepository.save(entry(LocalDate.now(), ref, "Passbook fee posting",
                liabilityCode, savings.getName(), fee, BigDecimal.ZERO, "System"));
        journalEntryRepository.save(entry(LocalDate.now(), ref, "Passbook fee posting",
                feeCode, feeIncome.getName(), BigDecimal.ZERO, fee, "System"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("posted", 1);
        result.put("amount", fee);
        return result;
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String codeOr(String code, String fallback) {
        return code != null && !code.isBlank() ? code : fallback;
    }

    private GlAccount glAccount(String code) {
        return glAccountRepository.findAll().stream()
                .filter(a -> code.equals(a.getCode())).findFirst()
                .orElseThrow(() -> new NotFoundException("GL account missing: " + code));
    }

    private void postGl(boolean deposit, BigDecimal amount, SavingsProduct product, String teller) {
        GlAccount cash = glAccountRepository.findAll().stream()
                .filter(a -> CASH_ACCOUNT.equals(a.getCode())).findFirst()
                .orElseThrow(() -> new NotFoundException("Cash account missing"));
        String glCode = "Mandatory".equals(product.getType()) ? MANDATORY_GL : VOLUNTARY_GL;
        GlAccount savings = glAccountRepository.findAll().stream()
                .filter(a -> glCode.equals(a.getCode())).findFirst()
                .orElseThrow(() -> new NotFoundException("Savings GL account missing"));

        if (deposit) {
            cash.setBalance(cash.getBalance().add(amount));
            savings.setBalance(savings.getBalance().subtract(amount));
        } else {
            cash.setBalance(cash.getBalance().subtract(amount));
            savings.setBalance(savings.getBalance().add(amount));
        }
        glAccountRepository.saveAll(List.of(cash, savings));

        String ref = "JRN-" + LocalDate.now().getYear() + "-" + String.format("%03d", journalEntryRepository.count() + 1);
        String postedBy = teller != null ? teller : "System";
        if (deposit) {
            journalEntryRepository.save(entry(LocalDate.now(), ref,
                    "Savings " + product.getType() + " deposit",
                    CASH_ACCOUNT, "Cash on Hand", amount, BigDecimal.ZERO, postedBy));
            journalEntryRepository.save(entry(LocalDate.now(), ref,
                    "Savings " + product.getType() + " deposit",
                    glCode, savings.getName(), BigDecimal.ZERO, amount, postedBy));
        } else {
            journalEntryRepository.save(entry(LocalDate.now(), ref,
                    "Savings " + product.getType() + " withdrawal",
                    CASH_ACCOUNT, "Cash on Hand", BigDecimal.ZERO, amount, postedBy));
            journalEntryRepository.save(entry(LocalDate.now(), ref,
                    "Savings " + product.getType() + " withdrawal",
                    glCode, savings.getName(), amount, BigDecimal.ZERO, postedBy));
        }
    }

    private JournalEntry entry(LocalDate date, String ref, String description,
                               String code, String name, BigDecimal debit, BigDecimal credit, String postedBy) {
        JournalEntry e = new JournalEntry();
        e.setDate(date);
        e.setRef(ref);
        e.setDescription(description);
        e.setAccountCode(code);
        e.setAccountName(name);
        e.setDebit(debit);
        e.setCredit(credit);
        e.setPostedBy(postedBy);
        return e;
    }
}