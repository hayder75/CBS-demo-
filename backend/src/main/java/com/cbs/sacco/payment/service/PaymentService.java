package com.cbs.sacco.payment.service;

import com.cbs.sacco.account.entity.SavingsAccount;
import com.cbs.sacco.account.repo.SavingsAccountRepository;
import com.cbs.sacco.payment.entity.Payment;
import com.cbs.sacco.payment.repo.PaymentRepository;
import com.cbs.sacco.reservation.repo.FundReservationRepository;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.accounting.repo.GlAccountRepository;
import com.cbs.sacco.accounting.repo.JournalEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SavingsAccountRepository accountRepository;
    private final FundReservationRepository reservationRepository;
    private final GlAccountRepository glAccountRepository;
    private final JournalEntryRepository journalEntryRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          SavingsAccountRepository accountRepository,
                          FundReservationRepository reservationRepository,
                          GlAccountRepository glAccountRepository,
                          JournalEntryRepository journalEntryRepository) {
        this.paymentRepository = paymentRepository;
        this.accountRepository = accountRepository;
        this.reservationRepository = reservationRepository;
        this.glAccountRepository = glAccountRepository;
        this.journalEntryRepository = journalEntryRepository;
    }

    public List<Payment> list() { return paymentRepository.findAll(); }
    public List<Payment> byStatus(String status) { return paymentRepository.findByStatus(status); }
    public List<Payment> byKind(String kind) { return paymentRepository.findByKind(kind); }

    @Transactional
    public Payment create(Map<String, Object> body, String maker) {
        String kind = str(body, "kind");
        BigDecimal amount = dec(body, "amount");
        if (kind == null || kind.isBlank()) throw new IllegalArgumentException("kind is required");
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("amount must be positive");

        Payment p = new Payment();
        p.setKind(kind);
        p.setAmount(amount);
        p.setMemberId(lng(body.get("memberId")));
        p.setAccountId(lng(body.get("accountId")));
        p.setFromRef(str(body, "fromRef"));
        p.setToRef(str(body, "toRef"));
        p.setPaymentModeId(lng(body.get("paymentModeId")));
        p.setDescription(str(body, "description"));
        p.setCreatedBy(maker == null ? "System" : maker);
        p.setStatus("Pending");

        // Non-cash payments always require checker authorization.
        // Small cash deposits can auto-post for the demo teller.
        String mode = body.containsKey("autoPost") && Boolean.TRUE.equals(body.get("autoPost"))
                ? "Authorized" : "Pending";
        p.setStatus(order(mode, body));
        p.setPaymentNo("PMT-" + String.format("%07d", System.currentTimeMillis() % 10000000));
        Payment saved = paymentRepository.save(p);
        if ("Authorized".equals(saved.getStatus())) {
            postToLedger(saved, maker);
        }
        return saved;
    }

    private String order(String mode, Map<String, Object> body) {
        return mode;
    }

    @Transactional
    public Payment authorize(Long id, String checker) {
        Payment p = get(id);
        if (!"Pending".equals(p.getStatus())) throw new IllegalStateException("Only pending payments can be authorized");
        p.setStatus("Authorized");
        p.setAuthorizedBy(checker);
        p.setAuthorizedAt(Instant.now());
        Payment saved = paymentRepository.save(p);
        postToLedger(saved, checker);
        return saved;
    }

    @Transactional
    public Payment reject(Long id, String checker) {
        Payment p = get(id);
        if (!"Pending".equals(p.getStatus())) throw new IllegalStateException("Only pending payments can be rejected");
        p.setStatus("Rejected");
        p.setAuthorizedBy(checker);
        p.setAuthorizedAt(Instant.now());
        return paymentRepository.save(p);
    }

    @Transactional
    public Payment reverse(Long id, String user) {
        Payment p = get(id);
        if (!"Authorized".equals(p.getStatus())) {
            throw new IllegalStateException("Only authorized payments can be reversed");
        }
        Payment reversal = new Payment();
        reversal.setKind("REVERSAL");
        reversal.setPaymentNo("PMT-" + String.format("%07d", System.currentTimeMillis() % 10000000));
        reversal.setAmount(p.getAmount());
        reversal.setMemberId(p.getMemberId());
        reversal.setAccountId(p.getAccountId());
        reversal.setPaymentModeId(p.getPaymentModeId());
        reversal.setDescription("Reversal of " + p.getPaymentNo());
        reversal.setCreatedBy(user);
        reversal.setStatus("Authorized");
        reversal.setAuthorizedBy(user);
        reversal.setAuthorizedAt(Instant.now());
        reversal.setReversalOf(id);
        Payment saved = paymentRepository.save(reversal);

        // undo ledger effect
        SavingsAccount acc = p.getAccountId() != null ? accountRepository.findById(p.getAccountId()).orElse(null) : null;
        if (acc != null) {
            BigDecimal delta = switch (p.getKind()) {
                case "DEPOSIT", "BRANCH_CLAIM_CREDIT" -> p.getAmount().negate();
                case "WITHDRAWAL", "TRANSFER", "ADJUSTMENT" -> p.getAmount();
                default -> BigDecimal.ZERO;
            };
            acc.setBalance(acc.getBalance().add(delta));
            accountRepository.save(acc);
        }
        p.setStatus("Reversed");
        paymentRepository.save(p);
        return saved;
    }

    @Transactional
    public int massTransfer(List<Map<String, Object>> legs, String maker) {
        int count = 0;
        for (Map<String, Object> leg : legs) {
            Map<String, Object> body = new java.util.LinkedHashMap<>(leg);
            body.put("kind", "TRANSFER");
            Payment p = create(body, maker);
            if (p.getId() != null) count++;
        }
        return count;
    }

    private Payment get(Long id) {
        return paymentRepository.findById(id).orElseThrow(() -> new NotFoundException("Payment not found: " + id));
    }

    private void postToLedger(Payment p, String user) {
        if (p.getAccountId() == null) return; // GL-only booking handled separately
        SavingsAccount acc = accountRepository.findById(p.getAccountId()).orElseThrow(
                () -> new NotFoundException("Savings account not found: " + p.getAccountId()));
        BigDecimal delta = switch (p.getKind()) {
            case "DEPOSIT", "BRANCH_CLAIM_CREDIT" -> p.getAmount();
            case "WITHDRAWAL", "TRANSFER", "ADJUSTMENT" -> p.getAmount().negate();
            default -> BigDecimal.ZERO;
        };
        if (delta.signum() < 0 && acc.getBalance().add(delta).signum() < 0) {
            throw new IllegalStateException("Insufficient balance on account " + acc.getAccountNo());
        }
        acc.setBalance(acc.getBalance().add(delta));
        accountRepository.save(acc);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }
    private static Long lng(Object v) {
        if (v == null) return null;
        try { return Long.valueOf(v.toString()); } catch (NumberFormatException e) { return null; }
    }
    private static BigDecimal dec(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try { return v instanceof Number n ? new BigDecimal(n.toString()) : new BigDecimal(v.toString()); }
        catch (NumberFormatException e) { throw new IllegalArgumentException(key + " must be a number"); }
    }
}
