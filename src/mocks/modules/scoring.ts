import { http, HttpResponse } from 'msw';
import { members, loans, savingsTransactions, savingsAccounts } from '../data';

const policy = {
  id: 1, version: 1, name: 'Anchor Scorecard v1', active: true,
  effectiveFrom: '2026-09-01', minScoreAutoApprove: 75, minScoreRefer: 55,
  maxLoanToSavings: 3, baseInterestPct: 14, maxAmount: 500000,
  notes: 'Initial explainable scorecard policy',
};

const factors = [
  { id: 1, policyId: 1, code: 'savings_consistency', name: 'Savings consistency', weight: 1.5, direction: 'POSITIVE', description: 'Regular deposits and stable average balance', sortOrder: 1 },
  { id: 2, policyId: 1, code: 'savings_growth', name: 'Savings growth', weight: 1.0, direction: 'POSITIVE', description: 'Momentum of savings balance over time', sortOrder: 2 },
  { id: 3, policyId: 1, code: 'share_capital', name: 'Share capital', weight: 1.0, direction: 'POSITIVE', description: 'Committed share capital held', sortOrder: 3 },
  { id: 4, policyId: 1, code: 'repayment_history', name: 'Repayment history', weight: 2.0, direction: 'POSITIVE', description: 'On-time repayment and absence of arrears', sortOrder: 4 },
  { id: 5, policyId: 1, code: 'affordability', name: 'Affordability', weight: 1.5, direction: 'POSITIVE', description: 'Debt burden relative to savings/income', sortOrder: 5 },
  { id: 6, policyId: 1, code: 'tenure', name: 'Membership tenure', weight: 0.8, direction: 'POSITIVE', description: 'Length of active membership', sortOrder: 6 },
  { id: 7, policyId: 1, code: 'collateral', name: 'Collateral coverage', weight: 1.0, direction: 'POSITIVE', description: 'Pledged collateral vs requested amount', sortOrder: 7 },
  { id: 8, policyId: 1, code: 'kyc', name: 'KYC completeness', weight: 0.5, direction: 'POSITIVE', description: 'Identity and KYC documentation complete', sortOrder: 8 },
];

const bands = [
  { id: 1, policyId: 1, grade: 'A', minScore: 85, maxScore: 100, pdPct: 1.5, interestPct: 12 },
  { id: 2, policyId: 1, grade: 'B', minScore: 70, maxScore: 84.99, pdPct: 3.5, interestPct: 14 },
  { id: 3, policyId: 1, grade: 'C', minScore: 55, maxScore: 69.99, pdPct: 8, interestPct: 16 },
  { id: 4, policyId: 1, grade: 'D', minScore: 40, maxScore: 54.99, pdPct: 18, interestPct: 19 },
  { id: 5, policyId: 1, grade: 'E', minScore: 0, maxScore: 39.99, pdPct: 35, interestPct: 22 },
];

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const monthsBetween = (d: string) => {
  const then = new Date(d).getTime();
  return Math.max(0, Math.round((Date.now() - then) / (1000 * 60 * 60 * 24 * 30.44)));
};

function computeFeatures(memberId: number) {
  const m = members.find((x) => Number(x.id) === memberId);
  const mLoans = loans.filter((l) => Number(l.memberId) === memberId);
  const mTxns = savingsTransactions.filter((t) => Number(t.memberId) === memberId);
  const acctBalance = savingsAccounts
    .filter((a) => Number(a.memberId) === memberId)
    .reduce((s, a) => s + Number(a.balance || 0), 0);
  const avgBalance = acctBalance || Number(m?.savingsBalance || 0);
  const depositCount = mTxns.filter((t) => t.type === 'Deposit').length;
  const freq = Math.round((depositCount / 12) * 100) / 100;
  const outstanding = Number(m?.loanOutstanding || 0);
  const share = Number(m?.shareBalance || 0);
  const base = avgBalance + share;
  const dti = base === 0 ? 100 : Math.round((outstanding / base) * 10000) / 100;
  const overdue = mLoans.filter((l) => l.overdueDays > 0);
  const arrears = overdue.reduce((s, l) => Math.max(s, l.overdueDays), 0);
  const onTime = mLoans.length === 0 ? 100 : Math.round(((mLoans.length - overdue.length) / mLoans.length) * 100);
  return {
    memberId,
    savingsAvgBalance: avgBalance,
    depositFreqMonthly: freq,
    savingsGrowthPct: 12,
    shareBalance: share,
    onTimePct: onTime,
    arrearsDays: arrears,
    parRatio: 0,
    dtiPct: dti,
    loanToSavings: avgBalance === 0 ? 99 : Math.round((outstanding / avgBalance) * 100) / 100,
    tenureMonths: m?.joinDate ? monthsBetween(m.joinDate) : 0,
    collateralCoveragePct: 70,
    guarantorScore: 60,
    kycComplete: true,
  };
}

interface Features { memberId: number; [k: string]: number | boolean }

function evaluate(f: Features) {
  const n: Record<string, number> = {
    savings_consistency: clamp(Number(f.savingsAvgBalance) / 100000 * 0.5 + Number(f.depositFreqMonthly) / 8 * 0.5),
    savings_growth: clamp((Number(f.savingsGrowthPct) + 10) / 40),
    share_capital: clamp(Number(f.shareBalance) / 50000),
    repayment_history: clamp(Number(f.onTimePct) / 100 * 0.7 + (1 - Math.min(Number(f.arrearsDays), 90) / 90) * 0.3),
    affordability: clamp(1 - Math.min(Number(f.dtiPct), 100) / 100),
    tenure: clamp(Math.min(Number(f.tenureMonths), 60) / 60),
    collateral: clamp(Number(f.collateralCoveragePct) / 100),
    kyc: f.kycComplete ? 1 : 0,
  };
  let totalWeight = 0;
  let weighted = 0;
  const breakdown = factors.map((d) => {
    const val = n[d.code] ?? 0;
    totalWeight += d.weight;
    weighted += val * d.weight;
    return { code: d.code, name: d.name, direction: d.direction, weight: d.weight, value: Math.round(val * 1000) / 1000, contribution: Math.round(val * d.weight * 100) / 100 };
  });
  const score = Math.round((weighted / totalWeight) * 100 * 100) / 100;
  const band = bands.find((b) => score >= b.minScore) ?? bands[bands.length - 1];
  const outstanding = Number(loans.filter((l) => Number(l.memberId) === f.memberId).reduce((s, l) => s + Number(l.balance || 0), 0));
  const recommended = Math.max(0, Math.min(policy.maxAmount, Number(f.savingsAvgBalance) * policy.maxLoanToSavings - outstanding));
  const decision = score >= policy.minScoreAutoApprove && recommended > 0 ? 'AUTO_APPROVE' : score >= policy.minScoreRefer ? 'REFER' : 'DECLINE';
  const sorted = [...breakdown].sort((a, b) => b.contribution - a.contribution);
  const best = sorted[0]?.name ?? 'savings';
  const worst = sorted[sorted.length - 1]?.name ?? 'history';
  const narration = `Score ${score}/100 (Grade ${band.grade}, est. PD ${band.pdPct}%). Strongest factor: ${best}. Weakest factor: ${worst}. ` +
    (decision === 'AUTO_APPROVE' ? `Recommended for auto-approval up to ${recommended} ETB.`
      : decision === 'REFER' ? `Referred to the credit committee; indicative limit ${recommended} ETB.`
        : 'Recommend decline or further review at this time.');
  return {
    memberId: f.memberId, policy: { id: policy.id, version: policy.version, name: policy.name },
    score, grade: band.grade, pdPct: band.pdPct, interestPct: band.interestPct, decision,
    recommendedAmount: recommended, recommendedTerm: score >= 70 ? 36 : 24, narration, factors: breakdown, features: f,
  };
}

const runs: Record<string, unknown>[] = [];
let runSeq = 0;

export const scoringHandlers = [
  http.get('/api/loan-scoring/policy', () =>
    HttpResponse.json({ policy, factors, bands, versions: [policy] })),
  http.put('/api/loan-scoring/policy/:id', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    Object.assign(policy, b);
    return HttpResponse.json(policy);
  }),
  http.put('/api/loan-scoring/factors/:id', async ({ params, request }) => {
    const f = factors.find((x) => String(x.id) === params.id);
    if (!f) return HttpResponse.json({ error: 'not found' }, { status: 404 });
    const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (b.weight !== undefined) f.weight = Number(b.weight);
    if (b.name !== undefined) f.name = String(b.name);
    return HttpResponse.json(f);
  }),
  http.post('/api/loan-scoring/policy/:id/activate', ({ params }) => {
    policy.active = String(policy.id) === params.id;
    return HttpResponse.json(policy);
  }),
  http.get('/api/loan-scoring/features/:memberId', ({ params }) =>
    HttpResponse.json(computeFeatures(Number(params.memberId)))),
  http.post('/api/loan-scoring/preview', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    let f: Features;
    if (b.memberId) {
      f = computeFeatures(Number(b.memberId)) as unknown as Features;
    } else {
      f = {
        memberId: 0,
        savingsAvgBalance: Number(b.savingsAvgBalance ?? 0),
        depositFreqMonthly: Number(b.depositFreqMonthly ?? 0),
        savingsGrowthPct: Number(b.savingsGrowthPct ?? 0),
        shareBalance: Number(b.shareBalance ?? 0),
        onTimePct: Number(b.onTimePct ?? 100),
        arrearsDays: Number(b.arrearsDays ?? 0),
        parRatio: Number(b.parRatio ?? 0),
        dtiPct: Number(b.dtiPct ?? 0),
        loanToSavings: Number(b.loanToSavings ?? 0),
        tenureMonths: Number(b.tenureMonths ?? 0),
        collateralCoveragePct: Number(b.collateralCoveragePct ?? 0),
        guarantorScore: Number(b.guarantorScore ?? 60),
        kycComplete: b.kycComplete !== false,
      };
    }
    const result = evaluate(f);
    const run = { id: String(++runSeq), ...result, createdAt: new Date().toISOString() };
    runs.unshift(run);
    return HttpResponse.json({ scoreRunId: run.id, ...result });
  }),
  http.post('/api/loan-scoring/recompute', () => HttpResponse.json({ recomputed: members.length })),
  http.get('/api/loan-scoring/runs', () => HttpResponse.json(runs)),
  http.get('/api/loan-scoring/loan/:loanId', ({ params }) => {
    const loan = loans.find((l) => String(l.id) === params.loanId);
    if (!loan) return HttpResponse.json({ error: 'not found' }, { status: 404 });
    const f = computeFeatures(Number(loan.memberId)) as unknown as Features;
    const result = evaluate(f);
    const run = { id: String(++runSeq), ...result, createdAt: new Date().toISOString() };
    runs.unshift(run);
    return HttpResponse.json({ scoreRunId: run.id, ...result });
  }),
  http.post('/api/loan-scoring/runs/:id/override', async ({ params, request }) => {
    const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const run = runs.find((r) => r.id === params.id);
    if (run) {
      run.overrideDecision = b.decision;
      run.overrideReason = b.reason;
      run.overrideBy = 'demo';
      run.overrideAt = new Date().toISOString();
    }
    return HttpResponse.json(run ?? {});
  }),
];
