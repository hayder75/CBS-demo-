package com.cbs.sacco.loan.web;

import com.cbs.sacco.collateral.repo.CollateralRepository;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.loan.dto.LoanDto;
import com.cbs.sacco.loan.entity.Loan;
import com.cbs.sacco.loan.entity.LoanProduct;
import com.cbs.sacco.loan.repo.LoanProductRepository;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.member.repo.MemberRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanRepository loanRepository;
    private final LoanProductRepository productRepository;
    private final CollateralRepository collateralRepository;
    private final MemberRepository memberRepository;

    public LoanController(LoanRepository loanRepository,
                          LoanProductRepository productRepository,
                          CollateralRepository collateralRepository,
                          MemberRepository memberRepository) {
        this.loanRepository = loanRepository;
        this.productRepository = productRepository;
        this.collateralRepository = collateralRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping
    public List<LoanDto> list() {
        return loanRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/products")
    public List<LoanProduct> products() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public LoanDto get(@PathVariable Long id) {
        Loan loan = loanRepository.findById(id).orElseThrow(
                () -> new NotFoundException("Loan not found: " + id));
        return toDto(loan);
    }

    @PostMapping
    public LoanDto create(@RequestBody Map<String, Object> body) {
        Long productId = asLong(body, "productId");
        if (productId == null) {
            throw new IllegalArgumentException("productId is required");
        }
        LoanProduct product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));

        BigDecimal amount = asBigDecimal(body, "amount");
        Integer termMonths = asInteger(body, "termMonths");
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("A valid positive amount is required");
        }
        if (termMonths == null || termMonths < 1) {
            throw new IllegalArgumentException("A valid termMonths is required");
        }

        Loan loan = new Loan();
        loan.setLoanNo("LN-2026-" + String.format("%03d", 100 + loanRepository.count()));
        loan.setMemberId(10L);
        loan.setProduct(product);
        loan.setStatus("Pending");
        loan.setAmount(amount);
        loan.setTermMonths(termMonths);
        loan.setRatePct(product.getRatePct());
        loan.setScheduleType(product.getSchedule());
        loan.setBalance(BigDecimal.ZERO);
        loan.setPrincipalPaid(BigDecimal.ZERO);
        loan.setInterestPaid(BigDecimal.ZERO);
        loan.setOverdueDays(0);
        loan.setClassification("Pass");
        loan.setAiScore(55 + (int) (Math.random() * 40));
        loan.setAiPdPct(new BigDecimal(String.format("%.1f", Math.random() * 15)));
        loan.setAiGuidance("Approve with reduced amount");
        return toDto(loanRepository.save(loan));
    }

    private static Long asLong(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.longValue() : Long.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static Integer asInteger(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.intValue() : Integer.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private static BigDecimal asBigDecimal(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? new BigDecimal(n.toString()) : new BigDecimal(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
    }

    private LoanDto toDto(Loan loan) {
        List<Long> collateralIds = collateralRepository.findByLoanId(loan.getId())
                .stream().map(c -> c.getId()).toList();
        String memberName = loan.getMemberId() != null
                ? memberRepository.findById(loan.getMemberId()).map(m -> m.getFullName()).orElse("Member #" + loan.getMemberId())
                : null;
        return LoanDto.from(loan, collateralIds, memberName);
    }
}