package com.cbs.sacco.scoring.service;

import com.cbs.sacco.account.repo.SavingsAccountRepository;
import com.cbs.sacco.account.entity.SavingsAccount;
import com.cbs.sacco.collateral.entity.Collateral;
import com.cbs.sacco.collateral.repo.CollateralRepository;
import com.cbs.sacco.loan.entity.Loan;
import com.cbs.sacco.loan.repo.LoanRepository;
import com.cbs.sacco.member.entity.Member;
import com.cbs.sacco.member.repo.MemberRepository;
import com.cbs.sacco.savings.entity.SavingsTransaction;
import com.cbs.sacco.savings.repo.SavingsTransactionRepository;
import com.cbs.sacco.scoring.entity.*;
import com.cbs.sacco.scoring.repo.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Explainable loan scorecard: features computed from existing data, normalised and weighted
 * by the active policy, producing a score, grade, PD, recommendation and template narration.
 */
@Service
public class LoanScoringService {

    private final MemberRepository members;
    private final LoanRepository loans;
    private final SavingsTransactionRepository txns;
    private final SavingsAccountRepository accounts;
    private final CollateralRepository collateral;
    private final ScoringPolicyRepository policies;
    private final ScoringFactorRepository factors;
    private final ScoringBandRepository bands;
    private final MemberFeatureSnapshotRepository snapshots;
    private final ScoreRunRepository scoreRuns;
    private final ObjectMapper mapper = new ObjectMapper();

    public LoanScoringService(MemberRepository members, LoanRepository loans,
                              SavingsTransactionRepository txns, SavingsAccountRepository accounts,
                              CollateralRepository collateral, ScoringPolicyRepository policies,
                              ScoringFactorRepository factors, ScoringBandRepository bands,
                              MemberFeatureSnapshotRepository snapshots, ScoreRunRepository scoreRuns) {
        this.members = members;
        this.loans = loans;
        this.txns = txns;
        this.accounts = accounts;
        this.collateral = collateral;
        this.policies = policies;
        this.factors = factors;
        this.bands = bands;
        this.snapshots = snapshots;
        this.scoreRuns = scoreRuns;
    }

    public ScoringPolicy activePolicy() {
        return policies.findFirstByActiveTrueOrderByVersionDesc()
                .orElseGet(() -> policies.findAllByOrderByVersionDesc().stream().findFirst().orElseThrow());
    }

    // ---------- features ----------

    @Transactional
    public MemberFeatureSnapshot computeFeatures(Long memberId) {
        Member m = members.findById(memberId).orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));
        List<SavingsTransaction> memberTxns = txns.findAll().stream()
                .filter(t -> memberId.equals(t.getMemberId())).toList();
        List<Loan> memberLoans = loans.findAll().stream()
                .filter(l -> memberId.equals(l.getMemberId())).toList();

        BigDecimal avgBalance = accounts.findAll().stream()
                .filter(a -> memberId.equals(a.getMemberId()))
                .map(SavingsAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (avgBalance.signum() == 0 && m.getSavingsBalance() != null) avgBalance = m.getSavingsBalance();

        long depositCount = memberTxns.stream().filter(t -> "Deposit".equalsIgnoreCase(t.getType())).count();
        BigDecimal freq = BigDecimal.valueOf(depositCount).divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        BigDecimal growth = computeGrowth(memberTxns);

        BigDecimal onTime = new BigDecimal("100");
        int arrears = 0;
        BigDecimal overdueBalance = BigDecimal.ZERO, totalBalance = BigDecimal.ZERO;
        for (Loan l : memberLoans) {
            BigDecimal bal = nz(l.getBalance());
            totalBalance = totalBalance.add(bal);
            int od = l.getOverdueDays() == null ? 0 : l.getOverdueDays();
            if (od > 0) { arrears = Math.max(arrears, od); overdueBalance = overdueBalance.add(bal); }
        }
        if (!memberLoans.isEmpty()) {
            long bad = memberLoans.stream().filter(l -> l.getOverdueDays() != null && l.getOverdueDays() > 0).count();
            onTime = BigDecimal.valueOf(memberLoans.size() - bad)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(memberLoans.size()), 2, RoundingMode.HALF_UP);
        }
        BigDecimal par = totalBalance.signum() == 0 ? BigDecimal.ZERO
                : overdueBalance.multiply(BigDecimal.valueOf(100)).divide(totalBalance, 2, RoundingMode.HALF_UP);

        BigDecimal outstanding = nz(m.getLoanOutstanding());
        BigDecimal base = avgBalance.add(nz(m.getShareBalance()));
        BigDecimal dti = base.signum() == 0 ? new BigDecimal("100")
                : outstanding.multiply(BigDecimal.valueOf(100)).divide(base, 2, RoundingMode.HALF_UP);
        BigDecimal lts = avgBalance.signum() == 0 ? new BigDecimal("99")
                : outstanding.divide(avgBalance, 2, RoundingMode.HALF_UP);

        int tenure = 0;
        if (m.getJoinDate() != null) {
            tenure = (int) ChronoUnit.MONTHS.between(m.getJoinDate(), LocalDate.now());
            if (tenure < 0) tenure = 0;
        }

        BigDecimal collateralValue = BigDecimal.ZERO;
        for (Loan l : memberLoans) {
            for (Collateral c : collateral.findByLoanId(l.getId())) collateralValue = collateralValue.add(nz(c.getForcedSaleValue()));
        }
        BigDecimal coverage = outstanding.signum() == 0 ? new BigDecimal("100")
                : collateralValue.multiply(BigDecimal.valueOf(100)).divide(outstanding, 2, RoundingMode.HALF_UP);

        MemberFeatureSnapshot s = snapshots.findByMemberId(memberId).orElseGet(MemberFeatureSnapshot::new);
        s.setMemberId(memberId);
        s.setSavingsAvgBalance(avgBalance);
        s.setDepositFreqMonthly(freq);
        s.setSavingsGrowthPct(growth);
        s.setShareBalance(nz(m.getShareBalance()));
        s.setOnTimePct(onTime);
        s.setArrearsDays(arrears);
        s.setParRatio(par);
        s.setDtiPct(dti);
        s.setLoanToSavings(lts);
        s.setTenureMonths(tenure);
        s.setCollateralCoveragePct(coverage);
        s.setGuarantorScore(new BigDecimal("60"));
        s.setKycComplete(Boolean.TRUE.equals(m.getHasPhoto()) && Boolean.TRUE.equals(m.getHasSignature())
                && !"Pending".equalsIgnoreCase(m.getKycStatus()) && !"KycWaiting".equalsIgnoreCase(m.getKycStatus()));
        s.setComputedAt(Instant.now());
        return snapshots.save(s);
    }

    private BigDecimal computeGrowth(List<SavingsTransaction> list) {
        LocalDate now = LocalDate.now();
        BigDecimal recent = BigDecimal.ZERO, prior = BigDecimal.ZERO;
        for (SavingsTransaction t : list) {
            if (t.getDate() == null || !"Deposit".equalsIgnoreCase(t.getType())) continue;
            long months = ChronoUnit.MONTHS.between(t.getDate(), now);
            if (months >= 0 && months < 3) recent = recent.add(nz(t.getAmount()));
            else if (months >= 3 && months < 6) prior = prior.add(nz(t.getAmount()));
        }
        if (prior.signum() == 0) return recent.signum() > 0 ? new BigDecimal("20") : BigDecimal.ZERO;
        return recent.subtract(prior).multiply(BigDecimal.valueOf(100)).divide(prior, 2, RoundingMode.HALF_UP);
    }

    // ---------- scoring ----------

    @Transactional
    public Map<String, Object> score(Long memberId, Long loanId, String actor) {
        MemberFeatureSnapshot f = computeFeatures(memberId);
        Map<String, Object> result = evaluate(activePolicy(), f, memberId);
        ScoreRun run = persist(result, memberId, loanId, actor);
        result.put("scoreRunId", run.getId());
        result.put("features", f);
        return result;
    }

    public Map<String, Object> preview(MemberFeatureSnapshot f) {
        Map<String, Object> result = evaluate(activePolicy(), f, f.getMemberId());
        result.put("features", f);
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> evaluate(ScoringPolicy policy, MemberFeatureSnapshot f, Long memberId) {
        Map<String, BigDecimal> n = new LinkedHashMap<>();
        n.put("savings_consistency", clamp(f.getSavingsAvgBalance().divide(new BigDecimal("100000"), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("0.5"))
                .add(f.getDepositFreqMonthly().divide(new BigDecimal("8"), 4, RoundingMode.HALF_UP).multiply(new BigDecimal("0.5")))));
        n.put("savings_growth", clamp(f.getSavingsGrowthPct().add(new BigDecimal("10")).divide(new BigDecimal("40"), 4, RoundingMode.HALF_UP)));
        n.put("share_capital", clamp(f.getShareBalance().divide(new BigDecimal("50000"), 4, RoundingMode.HALF_UP)));
        n.put("repayment_history", clamp(f.getOnTimePct().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("0.7"))
                .add(BigDecimal.ONE.subtract(BigDecimal.valueOf(Math.min(f.getArrearsDays(), 90)).divide(new BigDecimal("90"), 4, RoundingMode.HALF_UP)).multiply(new BigDecimal("0.3")))));
        n.put("affordability", clamp(BigDecimal.ONE.subtract(BigDecimal.valueOf(Math.min(f.getDtiPct().doubleValue(), 100)).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))));
        n.put("tenure", clamp(BigDecimal.valueOf(Math.min(f.getTenureMonths(), 60)).divide(new BigDecimal("60"), 4, RoundingMode.HALF_UP)));
        n.put("collateral", clamp(f.getCollateralCoveragePct().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)));
        n.put("kyc", Boolean.TRUE.equals(f.getKycComplete()) ? BigDecimal.ONE : BigDecimal.ZERO);

        List<ScoringFactor> defs = factors.findByPolicyIdOrderBySortOrderAsc(policy.getId());
        BigDecimal totalWeight = BigDecimal.ZERO, weighted = BigDecimal.ZERO;
        List<Map<String, Object>> breakdown = new ArrayList<>();
        for (ScoringFactor d : defs) {
            BigDecimal val = n.getOrDefault(d.getCode(), BigDecimal.ZERO);
            totalWeight = totalWeight.add(nz(d.getWeight()));
            weighted = weighted.add(val.multiply(nz(d.getWeight())));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("code", d.getCode());
            row.put("name", d.getName());
            row.put("direction", d.getDirection());
            row.put("weight", nz(d.getWeight()));
            row.put("value", val.setScale(3, RoundingMode.HALF_UP));
            row.put("contribution", val.multiply(nz(d.getWeight())).setScale(2, RoundingMode.HALF_UP));
            breakdown.add(row);
        }
        BigDecimal score = totalWeight.signum() == 0 ? BigDecimal.ZERO
                : clamp100(weighted.multiply(new BigDecimal("100")).divide(totalWeight, 2, RoundingMode.HALF_UP));

        ScoringBand band = bands.findByPolicyIdOrderByMinScoreDesc(policy.getId()).stream()
                .filter(b -> score.compareTo(nz(b.getMinScore())) >= 0).findFirst().orElse(null);
        String grade = band == null ? "E" : band.getGrade();
        BigDecimal pd = band == null ? new BigDecimal("35") : nz(band.getPdPct());
        BigDecimal interest = band == null ? policy.getBaseInterestPct() : nz(band.getInterestPct());

        BigDecimal maxBySavings = f.getSavingsAvgBalance().multiply(nz(policy.getMaxLoanToSavings())).subtract(memberOutstanding(memberId));
        BigDecimal recommended = maxBySavings.max(BigDecimal.ZERO).min(nz(policy.getMaxAmount())).setScale(0, RoundingMode.DOWN);
        int term = score.compareTo(new BigDecimal("70")) >= 0 ? 36 : 24;

        String decision;
        if (score.compareTo(nz(policy.getMinScoreAutoApprove())) >= 0 && recommended.signum() > 0) decision = "AUTO_APPROVE";
        else if (score.compareTo(nz(policy.getMinScoreRefer())) >= 0) decision = "REFER";
        else decision = "DECLINE";

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("memberId", memberId);
        out.put("policy", Map.of("id", policy.getId(), "version", policy.getVersion(), "name", policy.getName()));
        out.put("score", score);
        out.put("grade", grade);
        out.put("pdPct", pd);
        out.put("interestPct", interest);
        out.put("decision", decision);
        out.put("recommendedAmount", recommended);
        out.put("recommendedTerm", term);
        out.put("narration", narrate(score, grade, pd, decision, recommended, breakdown));
        out.put("factors", breakdown);
        return out;
    }

    @SuppressWarnings("unchecked")
    private ScoreRun persist(Map<String, Object> result, Long memberId, Long loanId, String actor) {
        ScoreRun run = new ScoreRun();
        run.setMemberId(memberId);
        run.setLoanId(loanId);
        run.setPolicyId(((Map<String, Object>) result.get("policy") instanceof Map<?, ?> p)
                ? Long.valueOf(String.valueOf(p.get("id"))) : activePolicy().getId());
        run.setScore((BigDecimal) result.get("score"));
        run.setGrade((String) result.get("grade"));
        run.setPdPct((BigDecimal) result.get("pdPct"));
        run.setDecision((String) result.get("decision"));
        run.setRecommendedAmount((BigDecimal) result.get("recommendedAmount"));
        run.setRecommendedTerm((Integer) result.get("recommendedTerm"));
        run.setInterestPct((BigDecimal) result.get("interestPct"));
        run.setNarration((String) result.get("narration"));
        try {
            run.setFactorsJson(mapper.writeValueAsString(result.get("factors")));
        } catch (Exception e) {
            run.setFactorsJson("[]");
        }
        run.setCreatedBy(actor == null ? "System" : actor);
        return scoreRuns.save(run);
    }

    private BigDecimal memberOutstanding(Long memberId) {
        if (memberId == null) return BigDecimal.ZERO;
        return loans.findAll().stream().filter(l -> memberId.equals(l.getMemberId()))
                .map(l -> nz(l.getBalance())).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public ScoreRun override(Long scoreRunId, String decision, String reason, String actor) {
        ScoreRun run = scoreRuns.findById(scoreRunId).orElseThrow(() -> new IllegalArgumentException("Score run not found: " + scoreRunId));
        run.setOverrideDecision(decision);
        run.setOverrideReason(reason);
        run.setOverrideBy(actor);
        run.setOverrideAt(Instant.now());
        return scoreRuns.save(run);
    }

    public List<ScoreRun> runs() { return scoreRuns.findTop50ByOrderByCreatedAtDesc(); }

    public List<Long> allMemberIds() {
        return members.findAll().stream().map(Member::getId).toList();
    }

    public MemberFeatureSnapshot features(Long memberId) { return computeFeatures(memberId); }

    // ---------- helpers ----------

    private static String narrate(BigDecimal score, String grade, BigDecimal pd, String decision,
                                  BigDecimal recommended, List<Map<String, Object>> breakdown) {
        List<Map<String, Object>> sorted = new ArrayList<>(breakdown);
        sorted.sort((a, b) -> ((BigDecimal) b.get("contribution")).compareTo((BigDecimal) a.get("contribution")));
        String best = sorted.isEmpty() ? "savings" : String.valueOf(sorted.get(0).get("name"));
        String worst = sorted.isEmpty() ? "history" : String.valueOf(sorted.get(sorted.size() - 1).get("name"));
        StringBuilder sb = new StringBuilder();
        sb.append("Score ").append(score).append("/100 (Grade ").append(grade)
          .append(", est. PD ").append(pd).append("%). Strongest factor: ").append(best)
          .append(". Weakest factor: ").append(worst).append(". ");
        switch (decision) {
            case "AUTO_APPROVE" -> sb.append("Recommended for auto-approval up to ").append(recommended).append(" ETB.");
            case "REFER" -> sb.append("Referred to the credit committee; indicative limit ").append(recommended).append(" ETB.");
            default -> sb.append("Recommend decline or further review at this time.");
        }
        return sb.toString();
    }

    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    private static BigDecimal clamp(BigDecimal v) {
        if (v.signum() < 0) return BigDecimal.ZERO;
        if (v.compareTo(BigDecimal.ONE) > 0) return BigDecimal.ONE;
        return v;
    }

    private static BigDecimal clamp100(BigDecimal v) {
        if (v.signum() < 0) return BigDecimal.ZERO;
        if (v.compareTo(BigDecimal.valueOf(100)) > 0) return BigDecimal.valueOf(100);
        return v;
    }
}
