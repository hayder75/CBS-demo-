import { http, HttpResponse, delay } from 'msw';
import dayjs from 'dayjs';
import type { TermDeposit } from '../../types';
import { members, savingsProducts } from '../data';

const round2 = (n: number) => Math.round(n * 100) / 100;

export const termDeposits: TermDeposit[] = [
  {
    id: 'td1',
    accountNo: 'TFS-2026-001',
    memberId: 'm1',
    memberName: 'Abebe Bekele',
    productId: 'sp4',
    productName: 'Fixed-Term Deposit 12M',
    principal: 120000,
    ratePct: 8,
    termMonths: 12,
    startDate: '2026-03-01',
    maturityDate: '2027-03-01',
    interestAccrued: 4800,
    maturityValue: round2(120000 * (1 + (8 / 100) * 12 / 12)),
    penaltyPct: 2,
    status: 'Active',
  },
  {
    id: 'td2',
    accountNo: 'TFS-2026-002',
    memberId: 'm3',
    memberName: 'Dawit Tesfaye',
    productId: 'sp4',
    productName: 'Fixed-Term Deposit 12M',
    principal: 80000,
    ratePct: 7,
    termMonths: 12,
    startDate: '2025-09-20',
    maturityDate: '2026-09-20',
    interestAccrued: 5600,
    maturityValue: round2(80000 * (1 + (7 / 100) * 12 / 12)),
    penaltyPct: 3,
    status: 'Active',
  },
  {
    id: 'td3',
    accountNo: 'TFS-2026-003',
    memberId: 'm4',
    memberName: 'Hanna Girma',
    productId: 'sp5',
    productName: 'Fixed-Term Deposit 24M',
    principal: 300000,
    ratePct: 9.5,
    termMonths: 24,
    startDate: '2026-07-01',
    maturityDate: '2028-07-01',
    interestAccrued: 7125,
    maturityValue: round2(300000 * (1 + (9.5 / 100) * 24 / 12)),
    penaltyPct: 1.5,
    status: 'Active',
  },
  {
    id: 'td4',
    accountNo: 'TFS-2026-004',
    memberId: 'm6',
    memberName: 'Selamawit Haile',
    productId: 'sp4',
    productName: 'Fixed-Term Deposit 12M',
    principal: 100000,
    ratePct: 8,
    termMonths: 12,
    startDate: '2025-08-01',
    maturityDate: '2026-08-01',
    interestAccrued: 8000,
    maturityValue: round2(100000 * (1 + (8 / 100) * 12 / 12)),
    penaltyPct: 2,
    status: 'Matured',
  },
  {
    id: 'td5',
    accountNo: 'TFS-2026-005',
    memberId: 'm7',
    memberName: 'Samuel Worku',
    productId: 'sp4',
    productName: 'Fixed-Term Deposit 12M',
    principal: 50000,
    ratePct: 7,
    termMonths: 6,
    startDate: '2025-06-01',
    maturityDate: '2025-12-01',
    interestAccrued: 1750,
    maturityValue: round2(50000 * (1 + (7 / 100) * 6 / 12)),
    penaltyPct: 2,
    status: 'Matured',
  },
  {
    id: 'td6',
    accountNo: 'TFS-2026-006',
    memberId: 'm9',
    memberName: 'Natnael Mekonnen',
    productId: 'sp4',
    productName: 'Fixed-Term Deposit 12M',
    principal: 60000,
    ratePct: 8,
    termMonths: 12,
    startDate: '2025-11-01',
    maturityDate: '2026-11-01',
    interestAccrued: 2080,
    maturityValue: 62080,
    penaltyPct: 2,
    status: 'Broken',
    brokenAt: '2026-05-01T10:20:00',
    brokenBy: 'Kaleab Desta',
  },
];

let seq = termDeposits.length;

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

export const termDepositHandlers = [
  http.get('/api/term-deposits', async () => {
    await delay(250);
    return json(termDeposits);
  }),

  http.post('/api/term-deposits', async ({ request }) => {
    await delay(400);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const principal = Number(body.principal);
    const termMonths = Number(body.termMonths);
    const ratePct = Number(body.ratePct ?? 0);
    if (!Number.isFinite(principal) || principal <= 0) {
      return HttpResponse.json({ error: 'principal must be greater than zero' }, { status: 400 });
    }
    if (!Number.isFinite(termMonths) || termMonths <= 0) {
      return HttpResponse.json({ error: 'termMonths must be greater than zero' }, { status: 400 });
    }
    if (!Number.isFinite(ratePct) || ratePct < 0) {
      return HttpResponse.json({ error: 'ratePct must be non-negative' }, { status: 400 });
    }

    const member = members.find((m) => String(m.id) === String(body.memberId));
    if (!member) {
      return HttpResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    const product = savingsProducts.find((p) => String(p.id) === String(body.productId));
    if (!product) {
      return HttpResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const start = dayjs();
    seq += 1;
    const deposit: TermDeposit = {
      id: `td-${Date.now()}`,
      accountNo: `TFS-2026-${String(seq).padStart(3, '0')}`,
      memberId: member.id,
      memberName: member.fullName,
      productId: product.id,
      productName: product.name,
      principal,
      ratePct,
      termMonths,
      startDate: start.format('YYYY-MM-DD'),
      maturityDate: start.add(termMonths, 'month').format('YYYY-MM-DD'),
      interestAccrued: 0,
      maturityValue: round2(principal * (1 + (ratePct / 100) * termMonths / 12)),
      penaltyPct: 0,
      status: 'Active',
    };
    termDeposits.unshift(deposit);
    return json(deposit);
  }),

  http.post('/api/term-deposits/:id/mature', async ({ params }) => {
    await delay(400);
    const deposit = termDeposits.find((d) => d.id === params.id);
    if (!deposit) {
      return HttpResponse.json({ error: 'Term deposit not found' }, { status: 404 });
    }
    if (deposit.status !== 'Active') {
      return HttpResponse.json({ error: 'Only Active deposits can be matured' }, { status: 400 });
    }
    deposit.status = 'Matured';
    deposit.interestAccrued = round2(deposit.maturityValue - deposit.principal);
    return json(deposit);
  }),

  http.post('/api/term-deposits/:id/break', async ({ params, request }) => {
    await delay(400);
    const deposit = termDeposits.find((d) => d.id === params.id);
    if (!deposit) {
      return HttpResponse.json({ error: 'Term deposit not found' }, { status: 404 });
    }
    if (deposit.status !== 'Active') {
      return HttpResponse.json({ error: 'Only Active deposits can be broken' }, { status: 400 });
    }
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const penaltyPct = Number(body.penaltyPct ?? deposit.penaltyPct ?? 0);
    if (!Number.isFinite(penaltyPct) || penaltyPct < 0) {
      return HttpResponse.json({ error: 'penaltyPct must be non-negative' }, { status: 400 });
    }
    const penalty = round2(deposit.interestAccrued * penaltyPct / 100);
    deposit.interestAccrued = round2(Math.max(0, deposit.interestAccrued - penalty));
    deposit.maturityValue = round2(deposit.principal + deposit.interestAccrued);
    deposit.penaltyPct = penaltyPct;
    deposit.status = 'Broken';
    deposit.brokenAt = new Date().toISOString();
    deposit.brokenBy = 'Tigist Fikre';
    return json(deposit);
  }),
];
