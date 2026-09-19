import { http, HttpResponse, delay } from 'msw';
import type { BankAccount, BankReconSession, BankTransaction } from '../../types';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const err = (message: string, status: number) => HttpResponse.json({ error: message }, { status });

const round2 = (n: number) => Math.round(n * 100) / 100;

const today = () => new Date().toISOString().slice(0, 10);

const accounts: BankAccount[] = [
  {
    id: 'ba1',
    code: 'BNK-001',
    bankName: 'Commercial Bank of Ethiopia',
    accountNo: '1000123456789',
    branch: 'Head Office',
    currencyCode: 'ETB',
    bookBalance: 1250000,
    status: 'Active',
  },
  {
    id: 'ba2',
    code: 'BNK-002',
    bankName: 'Awash Bank',
    accountNo: '0132012345678',
    branch: 'Bole',
    currencyCode: 'ETB',
    bookBalance: 480000,
    status: 'Active',
  },
  {
    id: 'ba3',
    code: 'BNK-003',
    bankName: 'Dashen Bank',
    accountNo: '0450012345678',
    branch: 'Piassa',
    currencyCode: 'ETB',
    bookBalance: 96500,
    status: 'Active',
  },
];

const transactions: BankTransaction[] = [
  { id: 'bt1', bankAccountId: 'ba1', date: '2026-09-01', ref: 'DEP-2026-0901', description: 'Member deposits batch', type: 'Deposit', amount: 250000, reconStatus: 'Unmatched' },
  { id: 'bt2', bankAccountId: 'ba1', date: '2026-09-02', ref: 'CHQ-100234', description: 'Supplier payment', type: 'Withdrawal', amount: 120000, reconStatus: 'Matched' },
  { id: 'bt3', bankAccountId: 'ba1', date: '2026-09-03', ref: 'DEP-2026-0903', description: 'Check-off collection', type: 'Deposit', amount: 88000, reconStatus: 'Unmatched' },
  { id: 'bt4', bankAccountId: 'ba1', date: '2026-09-04', ref: 'CHQ-100241', description: 'Office rent', type: 'Withdrawal', amount: 45000, reconStatus: 'Excluded' },
  { id: 'bt5', bankAccountId: 'ba1', date: '2026-09-10', ref: 'TRF-2026-0910', description: 'Loan repayment transfer', type: 'Deposit', amount: 150000, reconStatus: 'Unmatched' },
  { id: 'bt6', bankAccountId: 'ba1', date: '2026-09-12', ref: 'ATM-2026-0912', description: 'ATM charges', type: 'Withdrawal', amount: 32000, reconStatus: 'Matched' },
  { id: 'bt7', bankAccountId: 'ba1', date: '2026-09-15', ref: 'DEP-2026-0915', description: 'Share capital subscription', type: 'Deposit', amount: 61000, reconStatus: 'Unmatched' },
  { id: 'bt8', bankAccountId: 'ba2', date: '2026-09-05', ref: 'DEP-2026-0905', description: 'Bole branch deposits', type: 'Deposit', amount: 90000, reconStatus: 'Matched' },
  { id: 'bt9', bankAccountId: 'ba2', date: '2026-09-08', ref: 'EFT-2026-0908', description: 'Utility payment', type: 'Withdrawal', amount: 21000, reconStatus: 'Unmatched' },
  { id: 'bt10', bankAccountId: 'ba2', date: '2026-09-14', ref: 'DEP-2026-0914', description: 'Mobile banking collections', type: 'Deposit', amount: 47000, reconStatus: 'Unmatched' },
  { id: 'bt11', bankAccountId: 'ba3', date: '2026-09-06', ref: 'CHQ-100260', description: 'Petty cash top-up', type: 'Withdrawal', amount: 15000, reconStatus: 'Excluded' },
  { id: 'bt12', bankAccountId: 'ba3', date: '2026-09-11', ref: 'DEP-2026-0911', description: 'Dormant revival deposits', type: 'Deposit', amount: 52000, reconStatus: 'Unmatched' },
];

let sessions: BankReconSession[] = [
  {
    id: 'brs-1',
    bankAccountId: 'ba1',
    bankAccountLabel: 'Commercial Bank of Ethiopia • 6789',
    statementDate: '2026-08-31',
    statementBalance: 1190000,
    bookBalance: 1180000,
    difference: 10000,
    status: 'Completed',
    matchedCount: 5,
    unmatchedCount: 0,
    startedBy: 'Kaleab Desta',
    startedAt: '2026-09-01T09:00:00.000Z',
    completedAt: '2026-09-01T09:20:00.000Z',
  },
];

const accountLabel = (account: BankAccount) =>
  `${account.bankName} • ${account.accountNo.slice(-4)}`;

const countStatuses = (accountId: string) => {
  const rows = transactions.filter((t) => t.bankAccountId === accountId);
  return {
    matchedCount: rows.filter((t) => t.reconStatus === 'Matched').length,
    unmatchedCount: rows.filter((t) => t.reconStatus === 'Unmatched').length,
  };
};

const refreshOpenSession = (accountId: string) => {
  const session = sessions.find((s) => s.bankAccountId === accountId && s.status === 'Open');
  if (!session) return;
  const { matchedCount, unmatchedCount } = countStatuses(accountId);
  session.matchedCount = matchedCount;
  session.unmatchedCount = unmatchedCount;
};

let accountCounter = 100;
let txnCounter = 100;
let sessionCounter = 100;

export const bankReconHandlers = [
  http.get('/api/bank/accounts', () => json(accounts)),

  http.post('/api/bank/accounts', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const accountNo = String(body.accountNo ?? '').trim();
    if (!accountNo) return err('Account number is required', 400);
    if (accounts.some((a) => a.accountNo === accountNo)) {
      return err(`Bank account ${accountNo} already exists`, 400);
    }
    const bookBalance = Number(body.bookBalance ?? 0);
    if (!Number.isFinite(bookBalance) || bookBalance < 0) {
      return err('Book balance cannot be negative', 400);
    }
    const account: BankAccount = {
      id: `ba-${++accountCounter}`,
      code: String(body.code ?? `BNK-${String(accounts.length + 1).padStart(3, '0')}`),
      bankName: String(body.bankName ?? ''),
      accountNo,
      branch: String(body.branch ?? ''),
      currencyCode: String(body.currencyCode ?? 'ETB'),
      bookBalance,
      status: 'Active',
    };
    accounts.push(account);
    return json(account);
  }),

  http.get('/api/bank/transactions', ({ request }) => {
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    return json(accountId ? transactions.filter((t) => t.bankAccountId === accountId) : transactions);
  }),

  http.post('/api/bank/transactions', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const bankAccountId = String(body.bankAccountId ?? '');
    if (!accounts.some((a) => a.id === bankAccountId)) {
      return err('Bank account not found', 400);
    }
    const amount = Number(body.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return err('Amount must be greater than zero', 400);
    }
    const txn: BankTransaction = {
      id: `bt-${++txnCounter}`,
      bankAccountId,
      date: String(body.date ?? today()),
      ref: String(body.ref ?? `BNK-${Date.now()}`),
      description: String(body.description ?? ''),
      type: body.type === 'Withdrawal' ? 'Withdrawal' : 'Deposit',
      amount,
      reconStatus: 'Unmatched',
    };
    transactions.unshift(txn);
    refreshOpenSession(bankAccountId);
    return json(txn);
  }),

  http.get('/api/bank/recon/unmatched', ({ request }) => {
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');
    return json(
      transactions.filter(
        (t) => t.reconStatus === 'Unmatched' && (!accountId || t.bankAccountId === accountId),
      ),
    );
  }),

  http.get('/api/bank/recon', () => json(sessions)),

  http.post('/api/bank/recon/start', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const bankAccountId = String(body.bankAccountId ?? '');
    const account = accounts.find((a) => a.id === bankAccountId);
    if (!account) return err('Bank account not found', 404);
    if (sessions.some((s) => s.bankAccountId === bankAccountId && s.status === 'Open')) {
      return err('An open reconciliation session already exists for this account', 400);
    }
    const statementBalance = Number(body.statementBalance ?? 0);
    if (!Number.isFinite(statementBalance)) {
      return err('Statement balance must be a number', 400);
    }
    const { matchedCount, unmatchedCount } = countStatuses(bankAccountId);
    const session: BankReconSession = {
      id: `brs-${++sessionCounter}`,
      bankAccountId,
      bankAccountLabel: accountLabel(account),
      statementDate: String(body.statementDate ?? today()),
      statementBalance,
      bookBalance: account.bookBalance,
      difference: round2(statementBalance - account.bookBalance),
      status: 'Open',
      matchedCount,
      unmatchedCount,
      startedBy: 'Kaleab Desta',
      startedAt: new Date().toISOString(),
    };
    sessions = [session, ...sessions];
    return json(session);
  }),

  http.post('/api/bank/recon/:txnId/match', async ({ params }) => {
    await delay(300);
    const txn = transactions.find((t) => t.id === params.txnId);
    if (!txn) return err('Transaction not found', 404);
    if (txn.reconStatus !== 'Unmatched') {
      return err('Only unmatched transactions can be matched', 400);
    }
    txn.reconStatus = 'Matched';
    refreshOpenSession(txn.bankAccountId);
    return json(txn);
  }),

  http.post('/api/bank/recon/:txnId/exclude', async ({ params }) => {
    await delay(300);
    const txn = transactions.find((t) => t.id === params.txnId);
    if (!txn) return err('Transaction not found', 404);
    if (txn.reconStatus === 'Matched') {
      return err('Matched transactions cannot be excluded', 400);
    }
    txn.reconStatus = 'Excluded';
    refreshOpenSession(txn.bankAccountId);
    return json(txn);
  }),

  http.post('/api/bank/recon/:sessionId/complete', async ({ params }) => {
    await delay(500);
    const session = sessions.find((s) => s.id === params.sessionId);
    if (!session) return err('Reconciliation session not found', 404);
    if (session.status !== 'Open') {
      return err('Only open reconciliation sessions can be completed', 400);
    }
    const { matchedCount, unmatchedCount } = countStatuses(session.bankAccountId);
    if (unmatchedCount > 0) {
      return err(`${unmatchedCount} unmatched transaction(s) must be resolved first`, 400);
    }
    session.matchedCount = matchedCount;
    session.unmatchedCount = unmatchedCount;
    session.status = 'Completed';
    session.completedAt = new Date().toISOString();
    return json(session);
  }),
];
