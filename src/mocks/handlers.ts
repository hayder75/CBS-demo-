import { http, HttpResponse, delay } from 'msw';
import type {
  ApprovalItem,
  CashMovement,
  CheckOffBatch,
  Collateral,
  JournalEntry,
  Loan,
  Member,
  PettyCashEntry,
  SavingsProduct,
  SavingsTransaction,
  ShareTransfer,
} from '../types';
import {
  approvals,
  checkOffBatches,
  collateral,
  cashMovements,
  dividendRuns,
  glAccounts,
  journalEntries,
  kpi,
  loanProducts,
  loans,
  members,
  monthlySavingsTrend,
  notifications,
  pettyCashEntries,
  portfolioAtRisk,
  savingsProducts,
  savingsTransactions,
  shareTransfers,
  tills,
  users,
  loanProductMix,
} from './data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

export const handlers = [
  http.get('/api/auth/me', async () => {
    await delay(200);
    const stored = localStorage.getItem('cbs-user');
    return json(stored ? JSON.parse(stored) : null);
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as { username?: string; role?: string };
    const user =
      users.find((u) => u.username === body.username) ??
      users.find((u) => u.role === body.role) ??
      users[1];
    localStorage.setItem('cbs-user', JSON.stringify(user));
    return json(user);
  }),

  http.get('/api/auth/users', () => json(users)),
  http.get('/api/notifications', () => json(notifications)),

  http.get('/api/kpi', () => json(kpi)),

  http.get('/api/portfolio-at-risk', () => json(portfolioAtRisk)),
  http.get('/api/savings-trend', () => json(monthlySavingsTrend)),
  http.get('/api/loan-product-mix', () => json(loanProductMix)),

  http.get('/api/members', () => json(members)),
  http.get('/api/members/:id', ({ params }) =>
    json(members.find((m) => m.id === params.id) ?? null),
  ),
  http.post('/api/members', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const member = {
      id: `m${members.length + 1}`,
      memberNo: `MEM-${String(members.length + 1).padStart(5, '0')}`,
      fullName: String(body.fullName ?? ''),
      gender: String(body.gender ?? 'M'),
      birthDate: String(body.birthDate ?? ''),
      phone: String(body.phone ?? ''),
      email: String(body.email ?? ''),
      faydaId: String(body.faydaId ?? ''),
      kebele: String(body.kebele ?? ''),
      woreda: String(body.woreda ?? ''),
      city: String(body.city ?? 'Addis Ababa'),
      occupation: String(body.occupation ?? ''),
      employer: String(body.employer ?? ''),
      status: 'Active',
      joinDate: String(body.joinDate ?? new Date().toISOString().slice(0, 10)),
      photoColor: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      shareBalance: 0,
      savingsBalance: 0,
      loanOutstanding: 0,
      nextOfKin: [],
      beneficiaries: [],
    } as Member;
    members.unshift(member);
    return json(member);
  }),

  http.get('/api/savings/products', () => json(savingsProducts)),
  http.get('/api/savings/transactions', () => json(savingsTransactions)),
  http.get('/api/savings/transactions/:memberId', ({ params }) =>
    json(savingsTransactions.filter((t) => t.memberId === params.memberId)),
  ),
  http.post('/api/savings/products', async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const product = {
      id: `sp${savingsProducts.length + 1}`,
      code: String(body.code ?? ''),
      name: String(body.name ?? ''),
      type: String(body.type ?? 'Voluntary'),
      interestRatePct: Number(body.interestRatePct ?? 0),
      minBalance: Number(body.minBalance ?? 0),
      noticePeriodDays: body.noticePeriodDays ? Number(body.noticePeriodDays) : undefined,
    } as SavingsProduct;
    savingsProducts.push(product);
    return json(product);
  }),
  http.post('/api/savings/transactions', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { memberId?: string; productId?: string; type?: string; amount?: number };
    const member = members.find((m) => m.id === body.memberId);
    if (!member) return HttpResponse.json({ error: 'Member not found' }, { status: 404 });
    const amount = Number(body.amount ?? 0);
    if (amount <= 0) return HttpResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    const isDeposit = body.type === 'Deposit';
    if (!isDeposit && member.savingsBalance < amount) {
      return HttpResponse.json({ error: 'Insufficient savings balance' }, { status: 409 });
    }
    member.savingsBalance += isDeposit ? amount : -amount;
    const tx = {
      id: `st-${Date.now()}`,
      memberId: body.memberId,
      productId: body.productId ?? 'sp2',
      date: new Date().toISOString().slice(0, 10),
      type: body.type ?? 'Deposit',
      amount,
      teller: 'Kaleab Desta',
      channel: 'Cash',
    } as SavingsTransaction;
    savingsTransactions.unshift(tx);
    return json(tx);
  }),
  http.post('/api/savings/interest', async () => {
    await delay(900);
    let count = 0;
    for (const m of members) {
      if (m.savingsBalance <= 0) continue;
      const interest = Math.round(m.savingsBalance * 0.005);
      if (interest <= 0) continue;
      savingsTransactions.unshift({
        id: `st-${Date.now()}-${m.id}`,
        memberId: m.id,
        productId: 'sp2',
        date: new Date().toISOString().slice(0, 10),
        type: 'Interest',
        amount: interest,
        teller: 'System',
        channel: 'Bank',
      } as SavingsTransaction);
      m.savingsBalance += interest;
      count++;
    }
    return json({ posted: count });
  }),

  http.get('/api/loans', () => json(loans)),
  http.get('/api/loans/products', () => json(loanProducts)),
  http.get('/api/loans/:id', ({ params }) =>
    json(loans.find((l) => l.id === params.id) ?? null),
  ),

  http.get('/api/accounting/accounts', () => json(glAccounts)),
  http.get('/api/accounting/journal', () => json(journalEntries)),
  http.post('/api/accounting/journal', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const debit = Number(body.debit ?? 0);
    const credit = Number(body.credit ?? 0);
    if (debit <= 0 || credit <= 0 || debit !== credit) {
      return HttpResponse.json({ error: 'Unbalanced entry' }, { status: 400 });
    }
    const debitAccount = glAccounts.find((a) => a.code === body.debitAccountCode);
    const creditAccount = glAccounts.find((a) => a.code === body.creditAccountCode);
    if (!debitAccount || !creditAccount) {
      return HttpResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    const ref = String(body.ref ?? `JRN-${journalEntries.length + 1}`);
    const description = String(body.description ?? 'Journal entry');
    debitAccount.balance += debit;
    creditAccount.balance -= credit;
    const date = String(body.date ?? new Date().toISOString().slice(0, 10));
    const rows = [
      { id: `j-${Date.now()}-d`, date, ref, description, accountCode: debitAccount.code, accountName: debitAccount.name, debit, credit: 0, postedBy: 'System' },
      { id: `j-${Date.now()}-c`, date, ref, description, accountCode: creditAccount.code, accountName: creditAccount.name, debit: 0, credit, postedBy: 'System' },
    ] as JournalEntry[];
    journalEntries.push(...rows);
    return json(rows);
  }),

  http.get('/api/checkoff', () => json(checkOffBatches)),
  http.post('/api/checkoff/upload', async ({ request }) => {
    await delay(1200);
    const body = (await request.json()) as { employer?: string; month?: string };
    const batch: CheckOffBatch = {
      id: `co-${Date.now()}`,
      employer: body.employer ?? 'Ministry of Education',
      month: body.month ?? 'Sep 2026',
      uploadedAt: new Date().toISOString(),
      rows: 87,
      matched: 87,
      unmatched: 0,
      expected: 94000,
      received: 94000,
      variance: 0,
      status: 'Reconciled',
    };
    return json(batch);
  }),

  http.get('/api/collateral', () => json(collateral)),
  http.post('/api/collateral', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const valuation = Number(body.valuation ?? 0);
    if (valuation <= 0) return HttpResponse.json({ error: 'valuation must be positive' }, { status: 400 });
    const discount = Number(body.discountPct ?? 0);
    const item = {
      id: `c${collateral.length + 1}`,
      code: `COL-${String(collateral.length + 1).padStart(3, '0')}`,
      type: String(body.type ?? 'Property Title Deed'),
      owner: String(body.owner ?? ''),
      description: String(body.description ?? ''),
      valuation,
      forcedSaleValue: Math.round(valuation * (1 - discount / 100)),
      discountPct: discount,
      loanId: undefined,
      loanRef: body.loanRef ? String(body.loanRef) : undefined,
      insuranceExpiry: body.insuranceExpiry ? String(body.insuranceExpiry) : undefined,
      status: 'Pledged',
    } as Collateral;
    collateral.unshift(item);
    return json(item);
  }),

  http.get('/api/shares/transfers', () => json(shareTransfers)),
  http.get('/api/shares/dividends', () => json(dividendRuns)),
  http.post('/api/shares/transfers', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const shares = Number(body.shares ?? 0);
    if (shares <= 0) return HttpResponse.json({ error: 'shares must be positive' }, { status: 400 });
    const transfer = {
      id: `t${shareTransfers.length + 1}`,
      date: new Date().toISOString().slice(0, 10),
      fromMember: String(body.fromMember ?? ''),
      toMember: String(body.toMember ?? ''),
      shares,
      value: Number(body.value ?? 0),
      status: 'Pending',
    } as ShareTransfer;
    shareTransfers.unshift(transfer);
    return json(transfer);
  }),

  http.get('/api/cashops/tills', () => json(tills)),
  http.get('/api/cashops/movements', () => json(cashMovements)),
  http.get('/api/cashops/pettycash', () => json(pettyCashEntries)),
  http.post('/api/cashops/movements', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const amount = Number(body.amount ?? 0);
    if (amount <= 0) return HttpResponse.json({ error: 'amount must be positive' }, { status: 400 });
    const movement = {
      id: `cm${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      from: String(body.from ?? 'Vault'),
      to: String(body.to ?? 'Teller'),
      amount,
      initiatedBy: 'Kaleab Desta',
      approvedBy: undefined,
      status: 'Pending',
      type: String(body.type ?? 'Vault to Teller'),
    } as CashMovement;
    cashMovements.unshift(movement);
    return json(movement);
  }),
  http.post('/api/cashops/pettycash', async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const amount = Number(body.amount ?? 0);
    if (amount <= 0) return HttpResponse.json({ error: 'amount must be positive' }, { status: 400 });
    const entry = {
      id: `pc${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      description: String(body.description ?? ''),
      category: String(body.category ?? ''),
      amount,
      receiptNo: String(body.receiptNo ?? `RC-${Math.floor(Math.random() * 9000) + 1000}`),
      status: 'Open',
    } as PettyCashEntry;
    pettyCashEntries.unshift(entry);
    return json(entry);
  }),

  http.get('/api/approvals', () => json(approvals)),

  http.post('/api/approvals/:id/approve', async ({ params }) => {
    await delay(500);
    const item = approvals.find((a) => a.id === params.id);
    if (item) item.status = 'Approved';
    return json({ ok: true });
  }),

  http.post('/api/approvals/:id/reject', async ({ params }) => {
    await delay(500);
    const item = approvals.find((a) => a.id === params.id);
    if (item) item.status = 'Rejected';
    return json({ ok: true });
  }),

  http.post('/api/loans', async ({ request }) => {
    await delay(800);
    const body = (await request.json()) as Partial<Loan>;
    const newLoan: Loan = {
      id: `l-${Date.now()}`,
      loanNo: `LN-2026-0${60 + Math.floor(Math.random() * 40)}`,
      memberId: 'm10',
      memberName: 'Liya Getachew',
      productId: body.productId ?? 'lp1',
      productName: 'Personal Loan',
      status: 'Pending',
      amount: body.amount ?? 100000,
      disbursedAt: '',
      termMonths: body.termMonths ?? 24,
      ratePct: 12,
      scheduleType: 'Reducing Balance',
      principalPaid: 0,
      interestPaid: 0,
      balance: 0,
      overdueDays: 0,
      classification: 'Pass',
      guarantors: [],
      collateralIds: [],
      aiScore: Math.floor(Math.random() * 40) + 55,
      aiPdPct: Number((Math.random() * 15).toFixed(1)),
      aiGuidance: 'Approve with reduced amount',
    };
    loans.unshift(newLoan);
    return json(newLoan);
  }),
];

export const reportRows = {
  members: members.map((m) => ({
    MemberNo: m.memberNo,
    Name: m.fullName,
    Status: m.status,
    JoinDate: m.joinDate,
    ShareBalance: m.shareBalance,
    SavingsBalance: m.savingsBalance,
  })),
  loans: loans.map((l) => ({
    LoanNo: l.loanNo,
    Member: l.memberName,
    Product: l.productName,
    Amount: l.amount,
    Balance: l.balance,
    OverdueDays: l.overdueDays,
    Classification: l.classification,
  })),
  approvals: approvals.map((a) => ({
    Type: a.type,
    Ref: a.ref,
    Summary: a.summary,
    Amount: a.amount,
    Status: a.status,
  })),
  tills: tills,
  dividend: dividendRuns,
};

export type { Member, ApprovalItem };