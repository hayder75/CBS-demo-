package com.cbs.sacco.termdeposit.web;

import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.savings.entity.SavingsProduct;
import com.cbs.sacco.savings.repo.SavingsProductRepository;
import com.cbs.sacco.termdeposit.entity.TermDeposit;
import com.cbs.sacco.termdeposit.repo.TermDepositRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/term-deposits")
public class TermDepositController {

    private final TermDepositRepository termDepositRepository;
    private final MemberRepository memberRepository;
    private final SavingsProductRepository productRepository;

    public TermDepositController(TermDepositRepository termDepositRepository,
                                 MemberRepository memberRepository,
                                 SavingsProductRepository productRepository) {
        this.termDepositRepository = termDepositRepository;
        this.memberRepository = memberRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<TermDeposit> list() {
        return termDepositRepository.findAll();
    }

    @PostMapping
    public TermDeposit create(@RequestBody Map<String, Object> body) {
        Long memberId = asLong(body, "memberId");
        Long productId = asLong(body, "productId");
        BigDecimal principal = asDecimal(body, "principal");
        Integer termMonths = asInt(body, "termMonths");
        BigDecimal ratePct = asDecimal(body, "ratePct");

        if (principal == null || principal.signum() <= 0) {
            throw new IllegalArgumentException("principal must be greater than zero");
        }
        if (termMonths == null || termMonths <= 0) {
            throw new IllegalArgumentException("termMonths must be greater than zero");
        }
        if (ratePct == null || ratePct.signum() < 0) {
            throw new IllegalArgumentException("ratePct must be non-negative");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new NotFoundException("Member not found: " + memberId));
        SavingsProduct product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));

        LocalDate start = LocalDate.now();
        TermDeposit deposit = new TermDeposit();
        deposit.setAccountNo("TFS-2026-" + String.format("%03d", termDepositRepository.count() + 1));
        deposit.setMemberId(member.getId());
        deposit.setMemberName(member.getFullName());
        deposit.setProductId(product.getId());
        deposit.setProductName(product.getName());
        deposit.setPrincipal(principal);
        deposit.setRatePct(ratePct);
        deposit.setTermMonths(termMonths);
        deposit.setStartDate(start);
        deposit.setMaturityDate(start.plusMonths(termMonths));
        deposit.setInterestAccrued(BigDecimal.ZERO);
        deposit.setMaturityValue(principal
                .multiply(BigDecimal.ONE.add(ratePct
                        .multiply(BigDecimal.valueOf(termMonths))
                        .divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP));
        deposit.setPenaltyPct(BigDecimal.ZERO);
        deposit.setStatus("Active");
        return termDepositRepository.save(deposit);
    }

    @PostMapping("/{id}/mature")
    public TermDeposit mature(@PathVariable Long id) {
        TermDeposit deposit = termDepositRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Term deposit not found: " + id));
        if (!"Active".equals(deposit.getStatus())) {
            throw new IllegalArgumentException("Only Active deposits can be matured");
        }
        deposit.setStatus("Matured");
        deposit.setInterestAccrued(deposit.getMaturityValue().subtract(deposit.getPrincipal()));
        return termDepositRepository.save(deposit);
    }

    @PostMapping("/{id}/break")
    public TermDeposit breakDeposit(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        TermDeposit deposit = termDepositRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Term deposit not found: " + id));
        if (!"Active".equals(deposit.getStatus())) {
            throw new IllegalArgumentException("Only Active deposits can be broken");
        }
        BigDecimal penaltyPct = body == null ? null : asDecimal(body, "penaltyPct");
        if (penaltyPct == null) {
            penaltyPct = deposit.getPenaltyPct() != null ? deposit.getPenaltyPct() : BigDecimal.ZERO;
        }
        if (penaltyPct.signum() < 0) {
            throw new IllegalArgumentException("penaltyPct must be non-negative");
        }
        BigDecimal penalty = deposit.getInterestAccrued()
                .multiply(penaltyPct)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal netInterest = deposit.getInterestAccrued().subtract(penalty);
        if (netInterest.signum() < 0) {
            netInterest = BigDecimal.ZERO;
        }
        deposit.setInterestAccrued(netInterest);
        deposit.setMaturityValue(deposit.getPrincipal().add(netInterest));
        deposit.setPenaltyPct(penaltyPct);
        deposit.setStatus("Broken");
        deposit.setBrokenAt(Instant.now());
        deposit.setBrokenBy(body != null && body.get("brokenBy") != null ? body.get("brokenBy").toString() : "System");
        return termDepositRepository.save(deposit);
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

    private static Integer asInt(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try {
            return v instanceof Number n ? n.intValue() : Integer.valueOf(v.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(key + " must be a number");
        }
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
}
