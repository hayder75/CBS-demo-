package com.cbs.sacco.scoring.web;

import com.cbs.sacco.auth.security.AppUserPrincipal;
import com.cbs.sacco.common.NotFoundException;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.scoring.entity.MemberFeatureSnapshot;
import com.cbs.sacco.scoring.entity.ScoreRun;
import com.cbs.sacco.scoring.entity.ScoringBand;
import com.cbs.sacco.scoring.entity.ScoringFactor;
import com.cbs.sacco.scoring.entity.ScoringPolicy;
import com.cbs.sacco.scoring.repo.ScoringBandRepository;
import com.cbs.sacco.scoring.repo.ScoringFactorRepository;
import com.cbs.sacco.scoring.repo.ScoringPolicyRepository;
import com.cbs.sacco.scoring.service.LoanScoringService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loan-scoring")
public class LoanScoringController {

    private final LoanScoringService service;
    private final ScoringPolicyRepository policies;
    private final ScoringFactorRepository factors;
    private final ScoringBandRepository bands;
    private final LoanRepository loans;

    public LoanScoringController(LoanScoringService service, ScoringPolicyRepository policies,
                                 ScoringFactorRepository factors, ScoringBandRepository bands,
                                 LoanRepository loans) {
        this.service = service;
        this.policies = policies;
        this.factors = factors;
        this.bands = bands;
        this.loans = loans;
    }

    @GetMapping("/policy")
    public Map<String, Object> policy() {
        ScoringPolicy p = service.activePolicy();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("policy", p);
        out.put("factors", factors.findByPolicyIdOrderBySortOrderAsc(p.getId()));
        out.put("bands", bands.findByPolicyIdOrderByMinScoreDesc(p.getId()));
        out.put("versions", policies.findAllByOrderByVersionDesc());
        return out;
    }

    @PutMapping("/policy/{id}")
    @Transactional
    public ScoringPolicy updatePolicy(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ScoringPolicy p = policies.findById(id).orElseThrow(() -> new NotFoundException("Policy not found: " + id));
        if (body.containsKey("minScoreAutoApprove")) p.setMinScoreAutoApprove(dec(body, "minScoreAutoApprove"));
        if (body.containsKey("minScoreRefer")) p.setMinScoreRefer(dec(body, "minScoreRefer"));
        if (body.containsKey("maxLoanToSavings")) p.setMaxLoanToSavings(dec(body, "maxLoanToSavings"));
        if (body.containsKey("baseInterestPct")) p.setBaseInterestPct(dec(body, "baseInterestPct"));
        if (body.containsKey("maxAmount")) p.setMaxAmount(dec(body, "maxAmount"));
        if (body.containsKey("name")) p.setName(str(body, "name"));
        if (body.containsKey("notes")) p.setNotes(str(body, "notes"));
        return policies.save(p);
    }

    @PutMapping("/factors/{id}")
    @Transactional
    public ScoringFactor updateFactor(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        ScoringFactor f = factors.findById(id).orElseThrow(() -> new NotFoundException("Factor not found: " + id));
        if (body.containsKey("weight")) f.setWeight(dec(body, "weight"));
        if (body.containsKey("name")) f.setName(str(body, "name"));
        if (body.containsKey("description")) f.setDescription(str(body, "description"));
        return factors.save(f);
    }

    @PostMapping("/policy/{id}/activate")
    @Transactional
    public ScoringPolicy activate(@PathVariable Long id) {
        ScoringPolicy p = policies.findById(id).orElseThrow(() -> new NotFoundException("Policy not found: " + id));
        for (ScoringPolicy other : policies.findAll()) {
            if (!other.getId().equals(p.getId()) && Boolean.TRUE.equals(other.getActive())) {
                other.setActive(false);
                policies.save(other);
            }
        }
        p.setActive(true);
        return policies.save(p);
    }

    @PostMapping("/preview")
    public Map<String, Object> preview(@RequestBody Map<String, Object> body) {
        if (body.get("memberId") != null) {
            return service.score(asLong(body.get("memberId")), null, "preview");
        }
        MemberFeatureSnapshot f = new MemberFeatureSnapshot();
        f.setMemberId(body.get("memberId") == null ? 0L : asLong(body.get("memberId")));
        f.setSavingsAvgBalance(decOr(body, "savingsAvgBalance", "0"));
        f.setDepositFreqMonthly(decOr(body, "depositFreqMonthly", "0"));
        f.setSavingsGrowthPct(decOr(body, "savingsGrowthPct", "0"));
        f.setShareBalance(decOr(body, "shareBalance", "0"));
        f.setOnTimePct(decOr(body, "onTimePct", "100"));
        f.setArrearsDays(intOr(body, "arrearsDays", 0));
        f.setParRatio(decOr(body, "parRatio", "0"));
        f.setDtiPct(decOr(body, "dtiPct", "0"));
        f.setLoanToSavings(decOr(body, "loanToSavings", "0"));
        f.setTenureMonths(intOr(body, "tenureMonths", 0));
        f.setCollateralCoveragePct(decOr(body, "collateralCoveragePct", "0"));
        f.setGuarantorScore(decOr(body, "guarantorScore", "60"));
        f.setKycComplete(!Boolean.FALSE.equals(body.get("kycComplete")));
        return service.preview(f);
    }

    @GetMapping("/features/{memberId}")
    public MemberFeatureSnapshot features(@PathVariable Long memberId) {
        return service.features(memberId);
    }

    @PostMapping("/recompute")
    public Map<String, Object> recompute() {
        int n = 0;
        for (var m : service.allMemberIds()) {
            service.computeFeatures(m);
            n++;
        }
        return Map.of("recomputed", n);
    }

    @GetMapping("/runs")
    public List<ScoreRun> runs() {
        return service.runs();
    }

    @GetMapping("/loan/{loanId}")
    public Map<String, Object> scoreLoan(@PathVariable Long loanId,
                                         @AuthenticationPrincipal AppUserPrincipal principal) {
        var loan = loans.findById(loanId).orElseThrow(() -> new NotFoundException("Loan not found: " + loanId));
        return service.score(loan.getMemberId(), loanId, principal == null ? "System" : principal.name());
    }

    @PostMapping("/runs/{id}/override")
    public ScoreRun override(@PathVariable Long id, @RequestBody Map<String, Object> body,
                             @AuthenticationPrincipal AppUserPrincipal principal) {
        String decision = str(body, "decision");
        String reason = str(body, "reason");
        if (decision == null) throw new IllegalArgumentException("decision is required");
        return service.override(id, decision, reason, principal == null ? "System" : principal.name());
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static Long asLong(Object v) {
        return v == null ? null : Long.valueOf(v.toString());
    }

    private static BigDecimal dec(Map<String, Object> body, String key) {
        return new BigDecimal(String.valueOf(body.get(key)));
    }

    private static BigDecimal decOr(Map<String, Object> body, String key, String fallback) {
        Object v = body.get(key);
        return new BigDecimal(v == null || String.valueOf(v).isBlank() ? fallback : String.valueOf(v));
    }

    private static int intOr(Map<String, Object> body, String key, int fallback) {
        Object v = body.get(key);
        if (v == null) return fallback;
        try { return v instanceof Number n ? n.intValue() : Integer.parseInt(v.toString()); }
        catch (NumberFormatException e) { return fallback; }
    }
}
