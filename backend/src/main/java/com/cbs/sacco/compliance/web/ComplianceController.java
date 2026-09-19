package com.cbs.sacco.compliance.web;

import com.cbs.sacco.compliance.entity.CompliancePolicy;
import com.cbs.sacco.compliance.repo.CompliancePolicyRepository;
import com.cbs.sacco.loan.entity.Loan;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private static final List<Map.Entry<String, Integer>> ALLOCATION_SPLIT = List.of(
            Map.entry("Statutory Reserve", 15),
            Map.entry("Dividends", 60),
            Map.entry("Education Fund", 5),
            Map.entry("General Reserve", 10),
            Map.entry("Retained Earnings", 10));

    private final CompliancePolicyRepository policyRepository;
    private final MemberRepository memberRepository;
    private final LoanRepository loanRepository;

    public ComplianceController(CompliancePolicyRepository policyRepository,
                                MemberRepository memberRepository,
                                LoanRepository loanRepository) {
        this.policyRepository = policyRepository;
        this.memberRepository = memberRepository;
        this.loanRepository = loanRepository;
    }

    @GetMapping("/policy")
    public CompliancePolicy policy() {
        return currentPolicy();
    }

    @PostMapping("/policy")
    public CompliancePolicy updatePolicy(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null || body.isEmpty()) {
            throw new IllegalArgumentException("Policy thresholds are required");
        }
        boolean hasLiquidity = body.get("liquidityMinPct") != null;
        boolean hasExposure = body.get("exposureMaxPct") != null;
        if (!hasLiquidity && !hasExposure) {
            throw new IllegalArgumentException("At least one policy threshold is required");
        }

        CompliancePolicy current = currentPolicy();
        if (hasLiquidity) {
            BigDecimal liquidityMinPct = dec(body, "liquidityMinPct");
            validatePct(liquidityMinPct, "Liquidity minimum percentage");
            current.setLiquidityMinPct(liquidityMinPct);
        }
        if (hasExposure) {
            BigDecimal exposureMaxPct = dec(body, "exposureMaxPct");
            validatePct(exposureMaxPct, "Exposure maximum percentage");
            current.setExposureMaxPct(exposureMaxPct);
        }
        current.setUpdatedAt(LocalDateTime.now());
        return policyRepository.save(current);
    }

    @GetMapping("/liquidity")
    public List<Map<String, Object>> liquidity() {
        CompliancePolicy policy = currentPolicy();
        BigDecimal memberSavings = memberRepository.findAll().stream()
                .map(Member::getSavingsBalance)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashAtBank = new BigDecimal("8620000");
        BigDecimal cashOnHand = new BigDecimal("1245000");
        BigDecimal liquidAssets = cashAtBank.add(cashOnHand);
        BigDecimal shortTermLiabilities = memberSavings.add(new BigDecimal("8000000"));
        BigDecimal requiredLiquid = pctOf(shortTermLiabilities, policy.getLiquidityMinPct());
        BigDecimal requiredCashBank = requiredLiquid.multiply(new BigDecimal("0.6")).setScale(0, RoundingMode.HALF_UP);
        BigDecimal requiredCashHand = requiredLiquid.subtract(requiredCashBank);
        BigDecimal netLiquidAssets = liquidAssets.subtract(shortTermLiabilities);

        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(row("label", "Cash at Bank", "value", cashAtBank, "requirement", requiredCashBank,
                "status", status(cashAtBank.compareTo(requiredCashBank) >= 0)));
        rows.add(row("label", "Cash on Hand", "value", cashOnHand, "requirement", requiredCashHand,
                "status", status(cashOnHand.compareTo(requiredCashHand) >= 0)));
        rows.add(row("label", "Liquid Assets", "value", liquidAssets, "requirement", requiredLiquid,
                "status", status(liquidAssets.compareTo(requiredLiquid) >= 0)));
        rows.add(row("label", "Short-term Liabilities", "value", shortTermLiabilities, "requirement", liquidAssets,
                "status", status(shortTermLiabilities.compareTo(liquidAssets) <= 0)));
        rows.add(row("label", "Net Liquid Assets", "value", netLiquidAssets, "requirement", BigDecimal.ZERO,
                "status", status(netLiquidAssets.signum() >= 0)));
        return rows;
    }

    @GetMapping("/large-exposures")
    public List<Map<String, Object>> largeExposures() {
        CompliancePolicy policy = currentPolicy();
        Map<Long, String> memberNames = memberRepository.findAll().stream()
                .collect(Collectors.toMap(Member::getId, Member::getFullName, (a, b) -> a, HashMap::new));

        List<Loan> exposed = loanRepository.findAll().stream()
                .filter(l -> l.getBalance() != null && l.getBalance().signum() > 0)
                .sorted(Comparator.comparing(Loan::getBalance).reversed())
                .toList();
        BigDecimal total = exposed.stream()
                .map(Loan::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Loan loan : exposed) {
            BigDecimal exposurePct = total.signum() > 0
                    ? loan.getBalance().multiply(HUNDRED).divide(total, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            boolean breach = exposurePct.compareTo(policy.getExposureMaxPct()) > 0;
            rows.add(row(
                    "id", String.valueOf(loan.getId()),
                    "memberId", String.valueOf(loan.getMemberId()),
                    "memberName", memberNames.getOrDefault(loan.getMemberId(), "Member " + loan.getMemberId()),
                    "loanNo", loan.getLoanNo(),
                    "facility", loan.getAmount(),
                    "exposure", loan.getBalance(),
                    "exposurePct", exposurePct,
                    "status", breach ? "Breach" : "Within"));
        }
        return rows;
    }

    @GetMapping("/profit-allocation")
    public List<Map<String, Object>> profitAllocation() {
        BigDecimal baseSurplus = new BigDecimal("6400000");
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : ALLOCATION_SPLIT) {
            rows.add(row(
                    "label", entry.getKey(),
                    "pct", entry.getValue(),
                    "amount", pctOf(baseSurplus, new BigDecimal(entry.getValue()))));
        }
        return rows;
    }

    @GetMapping("/cash-flow")
    public List<Map<String, Object>> cashFlow() {
        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(flow("Operating Activities", "4850000", "3210000"));
        rows.add(flow("Investing Activities", "120000", "940000"));
        rows.add(flow("Financing Activities", "1600000", "780000"));

        BigDecimal inflow = rows.stream()
                .map(r -> (BigDecimal) r.get("inflow"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outflow = rows.stream()
                .map(r -> (BigDecimal) r.get("outflow"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        rows.add(row("label", "Net Cash Flow", "inflow", inflow, "outflow", outflow));
        return rows;
    }

    private CompliancePolicy currentPolicy() {
        return policyRepository.findTopByOrderByIdAsc().orElseGet(() -> {
            CompliancePolicy created = new CompliancePolicy();
            created.setLiquidityMinPct(new BigDecimal("20"));
            created.setExposureMaxPct(new BigDecimal("25"));
            created.setUpdatedAt(LocalDateTime.now());
            return policyRepository.save(created);
        });
    }

    private static Map<String, Object> flow(String label, String inflow, String outflow) {
        return row("label", label, "inflow", new BigDecimal(inflow), "outflow", new BigDecimal(outflow));
    }

    private static String status(boolean adequate) {
        return adequate ? "Adequate" : "Below";
    }

    private static BigDecimal pctOf(BigDecimal base, BigDecimal pct) {
        return base.multiply(pct).divide(HUNDRED, 0, RoundingMode.HALF_UP);
    }

    private static void validatePct(BigDecimal value, String label) {
        if (value == null || value.signum() < 0 || value.compareTo(HUNDRED) > 0) {
            throw new IllegalArgumentException(label + " must be between 0 and 100");
        }
    }

    private static Map<String, Object> row(Object... pairs) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pairs.length; i += 2) {
            map.put(String.valueOf(pairs[i]), pairs[i + 1]);
        }
        return map;
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
