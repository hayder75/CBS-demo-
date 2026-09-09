package com.cbs.sacco.loan.service;

import com.cbs.sacco.loan.entity.Loan;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class LoanService {

    private final LoanRepository loanRepository;

    public LoanService(LoanRepository loanRepository) {
        this.loanRepository = loanRepository;
    }

    /** Committee decision: approve / reject / modify amount. */
    @Transactional
    public Loan decide(Long id, boolean approve, String note, String decidedBy) {
        Loan loan = get(id);
        if (approve) {
            loan.setStatus("Approved");
        } else {
            loan.setStatus("Rejected");
        }
        loan.setDecisionNote(note);
        loanRepository.save(loan);
        return loan;
    }

    /** Disburse an approved loan: balance = principal, sets receipt account flows. */
    @Transactional
    public Loan disburse(Long id) {
        Loan loan = get(id);
        if (!"Approved".equals(loan.getStatus())) {
            throw new IllegalStateException("Loan " + loan.getLoanNo() + " is not approved yet (" + loan.getStatus() + ")");
        }
        loan.setStatus("Disbursed");
        loan.setDisbursedAt(LocalDate.now());
        loan.setBalance(loan.getAmount());
        loan.setNextDueDate(generateAmortization(loan).isEmpty()
                ? LocalDate.now().plusMonths(1) : loan.getNextDueDate());
        return loanRepository.save(loan);
    }

    /**
     * Generate amortization schedule rows (reducing balance).
     * Returns as list of maps for API/UI display.
     */
    public List<Map<String, Object>> amortization(Long id) {
        Loan loan = get(id);
        return generateAmortization(loan);
    }

    private List<Map<String, Object>> generateAmortization(Loan loan) {
        List<Map<String, Object>> rows = new ArrayList<>();
        int term = loan.getTermMonths() == null ? 12 : loan.getTermMonths();
        BigDecimal amount = loan.getAmount();
        BigDecimal monthlyRate = loan.getRatePct() == null
                ? BigDecimal.ZERO
                : loan.getRatePct().divide(BigDecimal.valueOf(12 * 100), 10, RoundingMode.HALF_UP);
        if (monthlyRate.signum() == 0) {
            BigDecimal perMonth = amount.divide(BigDecimal.valueOf(term), 2, RoundingMode.HALF_UP);
            for (int i = 1; i <= term; i++) {
                rows.add(Map.of(
                        "period", i,
                        "dueDate", LocalDate.now().plusMonths(i).toString(),
                        "principal", perMonth, "interest", BigDecimal.ZERO,
                        "total", perMonth, "paid", BigDecimal.ZERO, "balance", amount.subtract(perMonth.multiply(BigDecimal.valueOf(i)))));
            }
            return rows;
        }
        BigDecimal factor = monthlyRate.add(BigDecimal.ONE).pow(term);
        BigDecimal numerator = amount.multiply(monthlyRate).multiply(factor);
        BigDecimal denominator = factor.subtract(BigDecimal.ONE);
        BigDecimal installment = numerator.divide(denominator, 2, RoundingMode.HALF_UP);
        BigDecimal remaining = amount;
        for (int i = 1; i <= term; i++) {
            BigDecimal interest = remaining.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = installment.subtract(interest);
            remaining = remaining.subtract(principal).max(BigDecimal.ZERO);
            rows.add(Map.of(
                    "period", i,
                    "dueDate", LocalDate.now().plusMonths(i).toString(),
                    "principal", principal, "interest", interest,
                    "total", installment, "paid", BigDecimal.ZERO, "balance", remaining));
        }
        return rows;
    }

    /** Reverse an erroneous disbursement back to approved. */
    @Transactional
    public Loan unDisburse(Long id) {
        Loan loan = get(id);
        loan.setStatus("Approved");
        loan.setDisbursedAt(null);
        loan.setBalance(BigDecimal.ZERO);
        return loanRepository.save(loan);
    }

    private Loan get(Long id) {
        return loanRepository.findById(id).orElseThrow(() -> new NotFoundException("Loan not found: " + id));
    }
}
