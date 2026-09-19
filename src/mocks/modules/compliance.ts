import { http, HttpResponse, delay } from 'msw';
import type {
  CashFlowRow,
  CompliancePolicy,
  LargeExposure,
  LiquidityRow,
  ProfitAllocationRow,
} from '../../types';
import { loans, members } from '../data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const err = (message: string, status: number) => HttpResponse.json({ error: message }, { status });

const round2 = (n: number) => Math.round(n * 100) / 100;

const DEFAULT_POLICY: CompliancePolicy = {
  liquidityMinPct: 20,
  exposureMaxPct: 25,
  updatedAt: '2026-09-01T08:00:00.000Z',
};

let policy: CompliancePolicy = { ...DEFAULT_POLICY };

const CASH_AT_BANK = 8_620_000;
const CASH_ON_HAND = 1_245_000;
const BASE_SURPLUS = 6_400_000;

const allocationSplit: Array<{ label: string; pct: number }> = [
  { label: 'Statutory Reserve', pct: 15 },
  { label: 'Dividends', pct: 60 },
  { label: 'Education Fund', pct: 5 },
  { label: 'General Reserve', pct: 10 },
  { label: 'Retained Earnings', pct: 10 },
];

const flowCategories: CashFlowRow[] = [
  { label: 'Operating Activities', inflow: 4_850_000, outflow: 3_210_000 },
  { label: 'Investing Activities', inflow: 120_000, outflow: 940_000 },
  { label: 'Financing Activities', inflow: 1_600_000, outflow: 780_000 },
];

function buildLiquidity(): LiquidityRow[] {
  const memberSavings = members.reduce(
    (sum, m) => sum + (Number.isFinite(m.savingsBalance) ? m.savingsBalance : 0),
    0,
  );
  const cashAtBank = CASH_AT_BANK;
  const cashOnHand = CASH_ON_HAND;
  const liquidAssets = cashAtBank + cashOnHand;
  const shortTermLiabilities = Math.round(memberSavings) + 8_000_000;
  const minRatio = policy.liquidityMinPct / 100;
  const requiredLiquid = Math.round(shortTermLiabilities * minRatio);
  const requiredCashBank = Math.round(requiredLiquid * 0.6);
  const requiredCashHand = requiredLiquid - requiredCashBank;
  const netLiquid = liquidAssets - shortTermLiabilities;

  return [
    {
      label: 'Cash at Bank',
      value: cashAtBank,
      requirement: requiredCashBank,
      status: cashAtBank >= requiredCashBank ? 'Adequate' : 'Below',
    },
    {
      label: 'Cash on Hand',
      value: cashOnHand,
      requirement: requiredCashHand,
      status: cashOnHand >= requiredCashHand ? 'Adequate' : 'Below',
    },
    {
      label: 'Liquid Assets',
      value: liquidAssets,
      requirement: requiredLiquid,
      status: liquidAssets >= requiredLiquid ? 'Adequate' : 'Below',
    },
    {
      label: 'Short-term Liabilities',
      value: shortTermLiabilities,
      requirement: liquidAssets,
      status: shortTermLiabilities <= liquidAssets ? 'Adequate' : 'Below',
    },
    {
      label: 'Net Liquid Assets',
      value: netLiquid,
      requirement: 0,
      status: netLiquid >= 0 ? 'Adequate' : 'Below',
    },
  ];
}

function buildExposures(): LargeExposure[] {
  const base = loans
    .filter((l) => Number(l.balance) > 0)
    .map((l) => ({
      id: l.id,
      memberId: l.memberId,
      memberName: l.memberName,
      loanNo: l.loanNo,
      facility: Number(l.amount) || 0,
      exposure: Number(l.balance) || 0,
    }));
  const total = base.reduce((sum, r) => sum + r.exposure, 0);
  return base
    .map((r) => {
      const exposurePct = total > 0 ? round2((r.exposure / total) * 100) : 0;
      const status: LargeExposure['status'] =
        exposurePct > policy.exposureMaxPct ? 'Breach' : 'Within';
      return { ...r, exposurePct, status };
    })
    .sort((a, b) => b.exposure - a.exposure);
}

function buildAllocations(): ProfitAllocationRow[] {
  return allocationSplit.map((row) => ({
    label: row.label,
    pct: row.pct,
    amount: Math.round((BASE_SURPLUS * row.pct) / 100),
  }));
}

function buildCashFlow(): CashFlowRow[] {
  const inflow = flowCategories.reduce((sum, r) => sum + r.inflow, 0);
  const outflow = flowCategories.reduce((sum, r) => sum + r.outflow, 0);
  return [...flowCategories, { label: 'Net Cash Flow', inflow, outflow }];
}

export const complianceHandlers = [
  http.get('/api/compliance/policy', async () => {
    await delay(200);
    return json(policy);
  }),

  http.post('/api/compliance/policy', async ({ request }) => {
    await delay(350);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return err('Invalid JSON body', 400);
    }

    const hasLiquidity = body.liquidityMinPct !== undefined && body.liquidityMinPct !== null;
    const hasExposure = body.exposureMaxPct !== undefined && body.exposureMaxPct !== null;
    if (!hasLiquidity && !hasExposure) {
      return err('At least one policy threshold is required', 400);
    }

    const liquidityMinPct = hasLiquidity
      ? Number(body.liquidityMinPct)
      : policy.liquidityMinPct;
    const exposureMaxPct = hasExposure ? Number(body.exposureMaxPct) : policy.exposureMaxPct;

    if (!Number.isFinite(liquidityMinPct) || liquidityMinPct < 0 || liquidityMinPct > 100) {
      return err('Liquidity minimum percentage must be between 0 and 100', 400);
    }
    if (!Number.isFinite(exposureMaxPct) || exposureMaxPct < 0 || exposureMaxPct > 100) {
      return err('Exposure maximum percentage must be between 0 and 100', 400);
    }

    policy = {
      liquidityMinPct: round2(liquidityMinPct),
      exposureMaxPct: round2(exposureMaxPct),
      updatedAt: new Date().toISOString(),
    };
    return json(policy);
  }),

  http.get('/api/compliance/liquidity', async () => {
    await delay(250);
    return json(buildLiquidity());
  }),

  http.get('/api/compliance/large-exposures', async () => {
    await delay(250);
    return json(buildExposures());
  }),

  http.get('/api/compliance/profit-allocation', async () => {
    await delay(250);
    return json(buildAllocations());
  }),

  http.get('/api/compliance/cash-flow', async () => {
    await delay(250);
    return json(buildCashFlow());
  }),
];
