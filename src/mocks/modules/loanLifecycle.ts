import { http, HttpResponse, delay } from 'msw';
import type {
  Loan,
  LoanAutoDebitRow,
  LoanRecovery,
  LoanRestructure,
  LoanWriteOff,
  ProvisionPolicyRow,
  ProvisionRun,
} from '../../types';
import { loans, savingsAccounts } from '../data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const err = (message: string, status: number) => HttpResponse.json({ error: message }, { status });

const DEFAULT_REQUESTER = 'Kaleab Desta';
const DEFAULT_CHECKER = 'Sisay Worku';
const RESTRUCTURABLE: Loan['status'][] = ['Disbursed', 'Partially Paid', 'Restructured'];
const CLASSIFICATIONS: ProvisionPolicyRow['classification'][] = [
  'Pass',
  'Special Mention',
  'Substandard',
  'Doubtful',
  'Loss',
];

const today = () => new Date().toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

const loanById = (id: unknown): Loan | undefined => loans.find((l) => l.id === String(id));

const savingsForMember = (memberId: string): number =>
  savingsAccounts
    .filter((a) => a.memberId === memberId.replace(/^m/i, ''))
    .reduce((sum, a) => sum + a.balance, 0);

const installmentFor = (loan: Loan): number =>
  Math.max(0, Math.round(loan.balance / Math.max(loan.termMonths, 1)));

const dueDateFor = (loan: Loan): string =>
  loan.nextDueDate ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const activeLoans = (): Loan[] =>
  loans
    .filter((l) => (l.status === 'Disbursed' || l.status === 'Partially Paid') && l.balance > 0)
    .sort((a, b) => dueDateFor(a).localeCompare(dueDateFor(b)));

export const loanRestructures: LoanRestructure[] = [
  {
    id: 'lr1',
    loanId: 'l6',
    loanNo: 'LN-2025-088',
    memberName: 'Gizachew Tulu',
    oldTermMonths: 24,
    newTermMonths: 36,
    oldRatePct: 12,
    newRatePct: 10.5,
    outstanding: 58000,
    reason: 'Member suffered drought-related income loss; extended tenor reduces monthly burden.',
    fee: 500,
    status: 'Pending',
    requestedBy: 'Kaleab Desta',
    requestedAt: '2026-09-10T09:20:00',
  },
  {
    id: 'lr2',
    loanId: 'l2',
    loanNo: 'LN-2026-014',
    memberName: 'Hanna Girma',
    oldTermMonths: 36,
    newTermMonths: 48,
    oldRatePct: 10.5,
    newRatePct: 10,
    outstanding: 61000,
    reason: 'Education expense season; restructuring aligned to school calendar cash flows.',
    fee: 300,
    status: 'Approved',
    requestedBy: 'Rahel Abebe',
    approvedBy: 'Tigist Fikre',
    requestedAt: '2026-09-06T11:05:00',
  },
  {
    id: 'lr3',
    loanId: 'l8',
    loanNo: 'LN-2025-112',
    memberName: 'Selam Teshome',
    oldTermMonths: 12,
    newTermMonths: 18,
    oldRatePct: 13,
    newRatePct: 12,
    outstanding: 7000,
    reason: 'Recovery negotiation with member; small residual balance re-aged.',
    fee: 200,
    status: 'Executed',
    requestedBy: 'Biruk Kebede',
    approvedBy: 'Sisay Worku',
    requestedAt: '2026-08-18T08:40:00',
  },
  {
    id: 'lr4',
    loanId: 'l1',
    loanNo: 'LN-2026-001',
    memberName: 'Abebe Bekele',
    oldTermMonths: 24,
    newTermMonths: 30,
    oldRatePct: 12,
    newRatePct: 11,
    outstanding: 134000,
    reason: 'Requested tenor extension although repayment performance remains satisfactory.',
    fee: 600,
    status: 'Rejected',
    requestedBy: 'Marta Demissie',
    approvedBy: 'Tigist Fikre',
    requestedAt: '2026-08-30T15:15:00',
  },
];

export const loanWriteOffs: LoanWriteOff[] = [
  {
    id: 'lw1',
    loanId: 'l8',
    loanNo: 'LN-2025-112',
    memberName: 'Selam Teshome',
    balance: 7000,
    type: 'Full',
    reason: 'Member deceased; guarantors exhausted and collateral insufficient for recovery.',
    status: 'Pending',
    requestedBy: 'Kaleab Desta',
    requestedAt: '2026-09-11T10:00:00',
  },
  {
    id: 'lw2',
    loanId: 'l6',
    loanNo: 'LN-2025-088',
    memberName: 'Gizachew Tulu',
    balance: 20000,
    type: 'Partial',
    reason: 'Partial write-off of penalty and interest as part of negotiated settlement.',
    status: 'Pending',
    requestedBy: 'Rahel Abebe',
    requestedAt: '2026-09-09T14:30:00',
  },
  {
    id: 'lw3',
    loanId: 'l6',
    loanNo: 'LN-2025-088',
    memberName: 'Gizachew Tulu',
    balance: 5000,
    type: 'Partial',
    reason: 'Unrecoverable accrued interest on a restructured facility.',
    status: 'Approved',
    requestedBy: 'Biruk Kebede',
    approvedBy: 'Sisay Worku',
    requestedAt: '2026-07-22T09:10:00',
  },
  {
    id: 'lw4',
    loanId: 'l8',
    loanNo: 'LN-2025-112',
    memberName: 'Selam Teshome',
    balance: 0,
    type: 'Partial',
    reason: 'Zero-balance request retained for audit reference only.',
    status: 'Rejected',
    requestedBy: 'Marta Demissie',
    approvedBy: 'Tigist Fikre',
    requestedAt: '2026-07-15T12:00:00',
  },
];

export const loanRecoveries: LoanRecovery[] = [
  {
    id: 'lrc1',
    loanId: 'l8',
    loanNo: 'LN-2025-112',
    memberName: 'Selam Teshome',
    date: '2026-09-12',
    amount: 2500,
    source: 'Cash',
    recordedBy: 'Kaleab Desta',
  },
  {
    id: 'lrc2',
    loanId: 'l6',
    loanNo: 'LN-2025-088',
    memberName: 'Gizachew Tulu',
    date: '2026-09-08',
    amount: 4000,
    source: 'Savings',
    recordedBy: 'Rahel Abebe',
  },
  {
    id: 'lrc3',
    loanId: 'l8',
    loanNo: 'LN-2025-112',
    memberName: 'Selam Teshome',
    date: '2026-08-28',
    amount: 1500,
    source: 'Cash',
    recordedBy: 'Biruk Kebede',
  },
  {
    id: 'lrc4',
    loanId: 'l2',
    loanNo: 'LN-2026-014',
    memberName: 'Hanna Girma',
    date: '2026-08-20',
    amount: 3000,
    source: 'Savings',
    recordedBy: 'Marta Demissie',
  },
];

export const provisionPolicy: ProvisionPolicyRow[] = [
  { id: 'pp1', classification: 'Pass', provisionPct: 1 },
  { id: 'pp2', classification: 'Special Mention', provisionPct: 5 },
  { id: 'pp3', classification: 'Substandard', provisionPct: 20 },
  { id: 'pp4', classification: 'Doubtful', provisionPct: 50 },
  { id: 'pp5', classification: 'Loss', provisionPct: 100 },
];

export const provisionRuns: ProvisionRun[] = [
  {
    id: 'pr1',
    businessDate: '2026-08-31',
    loansProcessed: 6,
    totalProvision: 88700,
    runAt: '2026-08-31T18:30:00',
    runBy: 'Tigist Fikre',
  },
  {
    id: 'pr2',
    businessDate: '2026-07-31',
    loansProcessed: 5,
    totalProvision: 76400,
    runAt: '2026-07-31T18:25:00',
    runBy: 'Tigist Fikre',
  },
];

export const loanAutoDebitRows: LoanAutoDebitRow[] = activeLoans().map((loan) => {
  const installment = installmentFor(loan);
  const savingsBalance = savingsForMember(loan.memberId);
  return {
    id: `ad-${loan.id}`,
    loanNo: loan.loanNo,
    memberName: loan.memberName,
    installment,
    savingsBalance,
    status: savingsBalance >= installment ? 'Debited' : 'Insufficient',
  } as LoanAutoDebitRow;
});

let seq = 100;

const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++seq}`;

export const loanLifecycleHandlers = [
  http.get('/api/loan-restructures', async () => {
    await delay(200);
    return json(loanRestructures);
  }),

  http.post('/api/loan-restructures', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const loan = loanById(body.loanId);
    if (!loan) return err('Loan not found', 404);
    if (!RESTRUCTURABLE.includes(loan.status)) {
      return err(`Loan ${loan.loanNo} is not eligible for restructuring (status: ${loan.status})`, 400);
    }
    if (loanRestructures.some((r) => r.loanId === loan.id && r.status === 'Pending')) {
      return err('A pending restructure already exists for this loan', 409);
    }
    const newTermMonths = Number(body.newTermMonths);
    if (!Number.isFinite(newTermMonths) || newTermMonths <= 0) {
      return err('newTermMonths must be greater than zero', 400);
    }
    const newRatePct = Number(body.newRatePct);
    if (!Number.isFinite(newRatePct) || newRatePct < 0 || newRatePct > 100) {
      return err('newRatePct must be between 0 and 100', 400);
    }
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) return err('Reason is required', 400);
    const fee = Number(body.fee ?? 0);
    if (!Number.isFinite(fee) || fee < 0) return err('fee must be non-negative', 400);

    const row: LoanRestructure = {
      id: nextId('lr'),
      loanId: loan.id,
      loanNo: loan.loanNo,
      memberName: loan.memberName,
      oldTermMonths: loan.termMonths,
      newTermMonths,
      oldRatePct: loan.ratePct,
      newRatePct,
      outstanding: loan.balance,
      reason,
      fee,
      status: 'Pending',
      requestedBy: typeof body.requestedBy === 'string' && body.requestedBy.trim() ? body.requestedBy : DEFAULT_REQUESTER,
      requestedAt: new Date().toISOString(),
    };
    loanRestructures.unshift(row);
    return json(row);
  }),

  http.post('/api/loan-restructures/:id/approve', async ({ params, request }) => {
    await delay(350);
    const row = loanRestructures.find((r) => r.id === params.id);
    if (!row) return err('Restructure not found', 404);
    if (row.status !== 'Pending') return err(`Only pending restructures can be approved (current: ${row.status})`, 400);
    const body = (await request.json().catch(() => ({}))) as { approvedBy?: string };
    const approvedBy = typeof body.approvedBy === 'string' && body.approvedBy.trim() ? body.approvedBy : DEFAULT_CHECKER;
    if (approvedBy === row.requestedBy) return err('Maker and checker must be different users', 400);
    row.status = 'Approved';
    row.approvedBy = approvedBy;
    return json(row);
  }),

  http.post('/api/loan-restructures/:id/reject', async ({ params, request }) => {
    await delay(350);
    const row = loanRestructures.find((r) => r.id === params.id);
    if (!row) return err('Restructure not found', 404);
    if (row.status !== 'Pending') return err(`Only pending restructures can be rejected (current: ${row.status})`, 400);
    await request.json().catch(() => ({}));
    row.status = 'Rejected';
    return json(row);
  }),

  http.post('/api/loan-restructures/:id/execute', async ({ params }) => {
    await delay(400);
    const row = loanRestructures.find((r) => r.id === params.id);
    if (!row) return err('Restructure not found', 404);
    if (row.status !== 'Approved') return err(`Only approved restructures can be executed (current: ${row.status})`, 400);
    const loan = loans.find((l) => l.id === row.loanId);
    if (!loan) return err('Linked loan not found', 404);
    loan.termMonths = row.newTermMonths;
    loan.ratePct = row.newRatePct;
    loan.status = 'Restructured';
    row.status = 'Executed';
    return json(row);
  }),

  http.get('/api/loan-writeoffs', async () => {
    await delay(200);
    return json(loanWriteOffs);
  }),

  http.post('/api/loan-writeoffs', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const loan = loanById(body.loanId);
    if (!loan) return err('Loan not found', 404);
    if (loan.balance <= 0) return err('Loan has no outstanding balance to write off', 400);
    const type = body.type === 'Partial' ? 'Partial' : 'Full';
    const requested = Number(body.amount);
    let balance = type === 'Full' ? loan.balance : Number.isFinite(requested) ? requested : 0;
    if (balance <= 0) return err('Write-off amount must be greater than zero', 400);
    if (type === 'Partial' && balance > loan.balance) return err('Partial write-off cannot exceed the loan balance', 400);
    if (type === 'Full') balance = loan.balance;
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) return err('Reason is required', 400);

    const row: LoanWriteOff = {
      id: nextId('lw'),
      loanId: loan.id,
      loanNo: loan.loanNo,
      memberName: loan.memberName,
      balance: round2(balance),
      type,
      reason,
      status: 'Pending',
      requestedBy: typeof body.requestedBy === 'string' && body.requestedBy.trim() ? body.requestedBy : DEFAULT_REQUESTER,
      requestedAt: new Date().toISOString(),
    };
    loanWriteOffs.unshift(row);
    return json(row);
  }),

  http.post('/api/loan-writeoffs/:id/approve', async ({ params, request }) => {
    await delay(350);
    const row = loanWriteOffs.find((w) => w.id === params.id);
    if (!row) return err('Write-off not found', 404);
    if (row.balance <= 0) return err('Cannot approve a write-off with a non-positive balance', 400);
    if (row.status !== 'Pending') return err(`Only pending write-offs can be approved (current: ${row.status})`, 400);
    const body = (await request.json().catch(() => ({}))) as { approvedBy?: string };
    const approvedBy = typeof body.approvedBy === 'string' && body.approvedBy.trim() ? body.approvedBy : DEFAULT_CHECKER;
    if (approvedBy === row.requestedBy) return err('Maker and checker must be different users', 400);
    row.status = 'Approved';
    row.approvedBy = approvedBy;
    const loan = loans.find((l) => l.id === row.loanId);
    if (loan) {
      loan.balance = Math.max(0, round2(loan.balance - row.balance));
      if (loan.balance === 0) loan.status = 'Write-Off';
    }
    return json(row);
  }),

  http.post('/api/loan-writeoffs/:id/reject', async ({ params, request }) => {
    await delay(350);
    const row = loanWriteOffs.find((w) => w.id === params.id);
    if (!row) return err('Write-off not found', 404);
    if (row.balance <= 0) return err('Cannot reject a write-off with a non-positive balance', 400);
    if (row.status !== 'Pending') return err(`Only pending write-offs can be rejected (current: ${row.status})`, 400);
    await request.json().catch(() => ({}));
    row.status = 'Rejected';
    return json(row);
  }),

  http.get('/api/loan-recoveries', async () => {
    await delay(200);
    return json(loanRecoveries);
  }),

  http.post('/api/loan-recoveries', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const loan = loanById(body.loanId);
    if (!loan) return err('Loan not found', 404);
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return err('Amount must be greater than zero', 400);
    const source = body.source === 'Savings' ? 'Savings' : 'Cash';
    const date = typeof body.date === 'string' && body.date ? body.date : today();
    const row: LoanRecovery = {
      id: nextId('lrc'),
      loanId: loan.id,
      loanNo: loan.loanNo,
      memberName: loan.memberName,
      date,
      amount: round2(amount),
      source,
      recordedBy: typeof body.recordedBy === 'string' && body.recordedBy.trim() ? body.recordedBy : DEFAULT_REQUESTER,
    };
    loanRecoveries.unshift(row);
    if (loan.balance > 0) {
      loan.balance = Math.max(0, round2(loan.balance - amount));
      if (loan.balance === 0 && loan.status !== 'Fully Paid') loan.status = 'Fully Paid';
    }
    return json(row);
  }),

  http.get('/api/provision-policy', async () => {
    await delay(150);
    return json(provisionPolicy);
  }),

  http.post('/api/provision-policy', async ({ request }) => {
    await delay(300);
    const body = await request.json().catch(() => null);
    if (body == null) return err('Invalid JSON body', 400);
    const raw = Array.isArray(body)
      ? body
      : Array.isArray((body as Record<string, unknown>).rows)
        ? ((body as Record<string, unknown>).rows as unknown[])
        : [body];
    for (const entry of raw) {
      if (typeof entry !== 'object' || entry == null) return err('Each policy row must be an object', 400);
      const row = entry as Record<string, unknown>;
      const classification = row.classification as ProvisionPolicyRow['classification'];
      if (!CLASSIFICATIONS.includes(classification)) return err(`Unknown classification: ${String(row.classification)}`, 400);
      const pct = Number(row.provisionPct);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) return err('provisionPct must be between 0 and 100', 400);
      const target = provisionPolicy.find((p) => p.classification === classification);
      if (target) target.provisionPct = pct;
    }
    return json(provisionPolicy);
  }),

  http.get('/api/provisioning/runs', async () => {
    await delay(200);
    return json(provisionRuns);
  }),

  http.post('/api/provisioning/run', async () => {
    await delay(700);
    const processed = loans.filter((l) => l.balance > 0);
    const totalProvision = round2(
      processed.reduce((sum, loan) => {
        const policy = provisionPolicy.find((p) => p.classification === loan.classification);
        const pct = policy ? policy.provisionPct : 0;
        return sum + (loan.balance * pct) / 100;
      }, 0),
    );
    const run: ProvisionRun = {
      id: nextId('pr'),
      businessDate: today(),
      loansProcessed: processed.length,
      totalProvision,
      runAt: new Date().toISOString(),
      runBy: DEFAULT_CHECKER,
    };
    provisionRuns.unshift(run);
    return json(run);
  }),

  http.get('/api/loan-auto-debit', async () => {
    await delay(200);
    return json(loanAutoDebitRows);
  }),

  http.post('/api/loan-auto-debit/run', async () => {
    await delay(650);
    const fresh: LoanAutoDebitRow[] = activeLoans().map((loan) => {
      const installment = installmentFor(loan);
      const savingsBalance = savingsForMember(loan.memberId);
      return {
        id: `ad-${loan.id}`,
        loanNo: loan.loanNo,
        memberName: loan.memberName,
        installment,
        savingsBalance,
        status: savingsBalance >= installment ? 'Debited' : 'Insufficient',
      } as LoanAutoDebitRow;
    });
    loanAutoDebitRows.splice(0, loanAutoDebitRows.length, ...fresh);
    return json(loanAutoDebitRows);
  }),
];
