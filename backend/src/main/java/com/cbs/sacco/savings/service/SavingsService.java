package com.cbs.sacco.savings.service;

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
import java.util.List;

@Service
public class SavingsService {

    private static final String CASH_ACCOUNT = "1000";
    private static final String MANDATORY_GL = "1200";
    private static final String VOLUNTARY_GL = "1201";
    private static final String INTEREST_EXPENSE_GL = "3310";

    private final MemberRepository memberRepository;
    private final SavingsProductRepository productRepository;
    private final SavingsTransactionRepository transactionRepository;
    private final GlAccountRepository glAccountRepository;
    private final JournalEntryRepository journalEntryRepository;

    public SavingsService(MemberRepository memberRepository,
                          SavingsProductRepository productRepository,
                          SavingsTransactionRepository transactionRepository,
                          GlAccountRepository glAccountRepository,
                          JournalEntryRepository journalEntryRepository) {
        this.memberRepository = memberRepository;
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
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
        String glCode = VOLUNTARY_GL;
        SavingsProduct voluntary = productRepository.findById(2L)
                .orElseThrow(() -> new NotFoundException("Voluntary savings product missing"));
        BigDecimal rate = voluntary.getInterestRatePct();

        BigDecimal totalInterest = BigDecimal.ZERO;
        int count = 0;
        for (Member member : memberRepository.findAll()) {
            if (member.getSavingsBalance().signum() <= 0) continue;
            BigDecimal interest = member.getSavingsBalance()
                    .multiply(rate).divide(BigDecimal.valueOf(1200), 2, RoundingMode.HALF_UP);
            if (interest.signum() <= 0) continue;

            SavingsTransaction tx = new SavingsTransaction();
            tx.setMemberId(member.getId());
            tx.setProductId(2L);
            tx.setDate(LocalDate.now());
            tx.setType("Interest");
            tx.setAmount(interest);
            tx.setTeller("System");
            tx.setChannel("Bank");
            transactionRepository.save(tx);

            member.setSavingsBalance(member.getSavingsBalance().add(interest));
            memberRepository.save(member);
            totalInterest = totalInterest.add(interest);
            count++;
        }

        if (totalInterest.signum() > 0) {
            GlAccount expense = glAccountRepository.findAll().stream()
                    .filter(a -> INTEREST_EXPENSE_GL.equals(a.getCode())).findFirst()
                    .orElseThrow(() -> new NotFoundException("Interest expense account missing"));
            GlAccount savings = glAccountRepository.findAll().stream()
                    .filter(a -> glCode.equals(a.getCode())).findFirst()
                    .orElseThrow(() -> new NotFoundException("Savings GL account missing"));
            expense.setBalance(expense.getBalance().add(totalInterest));
            savings.setBalance(savings.getBalance().subtract(totalInterest));
            glAccountRepository.saveAll(List.of(expense, savings));

            String ref = "JRN-" + LocalDate.now().getYear() + "-INT";
            journalEntryRepository.save(entry(LocalDate.now(), ref, "Monthly interest posting",
                    INTEREST_EXPENSE_GL, "Interest Expense - Member Savings",
                    totalInterest, BigDecimal.ZERO, "System"));
            journalEntryRepository.save(entry(LocalDate.now(), ref, "Monthly interest posting",
                    glCode, "Member Savings - Voluntary",
                    BigDecimal.ZERO, totalInterest, "System"));
        }
        return count;
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