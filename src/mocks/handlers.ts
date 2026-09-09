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
  Branch,
  Currency,
  PaymentMode,
  Vault,
  SavingsAccount,
  ShareCategory,
  ShareAccount,
  Charge,
  FundReservation,
  TransactionLimit,
  LoanCategory,
  LoanGroup,
  CreditCommittee,
  BatchJob,
  FixedAsset,
  GlClass,
  Payment,
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
  branches,
  currencies,
  paymentModes,
  vaults,
  savingsAccounts,
  shareCategories,
  shareAccounts,
  shareRequests,
  charges,
  reservations,
  transactionLimits,
  loanCategories,
  loanGroups,
  committees,
  batchJobs,
  assets,
  glClasses,
  payments,
  auditLogs,
} from './data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

let idCounter = 1000;

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

  // ---- Franc parity modules ----
  http.get('/api/branches', () => json(branches)),
  http.get('/api/branches/:id', ({ params }) => json(branches.find((b) => b.id === params.id) ?? null)),
  http.post('/api/branches', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const b = { id: String(++idCounter), code: String(body.code), name: String(body.name), address: String(body.address ?? ''), phone: String(body.phone ?? ''), status: 'Pending', createdAt: new Date().toISOString() } as Branch;
    branches.push(b);
    return json(b);
  }),
  http.post('/api/branches/:id/verify', ({ params }) => { const b = branches.find((x) => x.id === params.id); if (b) b.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/currencies', () => json(currencies)),
  http.post('/api/currencies', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const c = { id: String(++idCounter), code: String(body.code), name: String(body.name), notesLabel: String(body.notesLabel ?? ''), centsLabel: String(body.centsLabel ?? ''), exchangeRate: Number(body.exchangeRate ?? 1), status: 'Pending' } as Currency;
    currencies.push(c);
    return json(c);
  }),
  http.post('/api/currencies/:id/verify', ({ params }) => { const c = currencies.find((x) => x.id === params.id); if (c) c.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/payment-modes', () => json(paymentModes)),
  http.post('/api/payment-modes', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const m = { id: String(++idCounter), code: String(body.code), name: String(body.name), paymentType: String(body.paymentType ?? 'CASH'), description: String(body.description ?? ''), status: 'Pending' } as PaymentMode;
    paymentModes.push(m);
    return json(m);
  }),
  http.post('/api/payment-modes/:id/verify', ({ params }) => { const m = paymentModes.find((x) => x.id === params.id); if (m) m.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/vaults', () => json(vaults)),
  http.post('/api/vaults', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const v = { id: String(++idCounter), code: String(body.code), name: String(body.name), location: String(body.location ?? ''), type: String(body.type ?? 'BRANCH'), status: 'Pending' } as Vault;
    vaults.push(v);
    return json(v);
  }),
  http.post('/api/vaults/:id/verify', ({ params }) => { const v = vaults.find((x) => x.id === params.id); if (v) v.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/accounts', () => json(savingsAccounts)),
  http.get('/api/accounts/member/:memberId', ({ params }) => json(savingsAccounts.filter((a) => a.memberId === params.memberId))),
  http.post('/api/accounts', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(++idCounter);
    const a = { id, accountNo: `SA-NEW-${id}`, memberId: String(body.memberId), productId: String(body.productId), accountType: String(body.accountType ?? 'Saving'), openedDate: new Date().toISOString().slice(0, 10), balance: 0, status: 'Pending', currencyId: String(body.currencyId ?? '1'), branchId: String(body.branchId ?? '1') } as SavingsAccount;
    savingsAccounts.push(a);
    return json(a);
  }),
  http.post('/api/accounts/:id/verify', ({ params }) => { const a = savingsAccounts.find((x) => x.id === params.id); if (a) a.status = 'Active'; return json({ ok: true }); }),
  http.post('/api/accounts/:id/freeze', ({ params }) => { const a = savingsAccounts.find((x) => x.id === params.id); if (a) a.status = 'Dormant'; return json({ ok: true }); }),
  http.post('/api/accounts/:id/close', ({ params }) => { const a = savingsAccounts.find((x) => x.id === params.id); if (a) a.status = 'Closed'; return json({ ok: true }); }),

  http.get('/api/share-categories', () => json(shareCategories)),
  http.post('/api/share-categories', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const c = { id: String(++idCounter), code: String(body.code), name: String(body.name), totalShares: Number(body.totalShares ?? 0), nominalPrice: Number(body.nominalPrice ?? 0), sharesForSale: Number(body.sharesForSale ?? 0), minPerCustomer: Number(body.minPerCustomer ?? 1), maxPerCustomer: Number(body.maxPerCustomer ?? 0), paymentAgreementMonths: Number(body.paymentAgreementMonths ?? 0), status: 'Pending' } as ShareCategory;
    shareCategories.push(c);
    return json(c);
  }),
  http.post('/api/share-categories/:id/verify', ({ params }) => { const c = shareCategories.find((x) => x.id === params.id); if (c) c.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/share-accounts', () => json(shareAccounts)),
  http.post('/api/share-accounts', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const s = { id: String(++idCounter), memberId: String(body.memberId), categoryId: String(body.categoryId), savingAccountId: String(body.savingAccountId ?? ''), shareCount: Number(body.shareCount ?? 0), description: String(body.description ?? ''), status: 'Pending' } as ShareAccount;
    shareAccounts.push(s);
    return json(s);
  }),
  http.post('/api/share-accounts/:id/verify', ({ params }) => { const s = shareAccounts.find((x) => x.id === params.id); if (s) s.status = 'Verified'; return json({ ok: true }); }),
  http.get('/api/share-accounts/requests', () => json(shareRequests)),
  http.post('/api/share-accounts/requests/:reqId/decide', ({ params }) => { const r = shareRequests.find((x) => x.id === params.reqId); if (r) r.status = params.approve === 'true' ? 'Approved' : 'Rejected'; return json({ ok: true }); }),

  http.get('/api/charges', () => json(charges)),
  http.post('/api/charges', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const c = { id: String(++idCounter), code: String(body.code), name: String(body.name), serviceType: String(body.serviceType ?? ''), glAccountId: String(body.glAccountId ?? ''), calcType: String(body.calcType ?? 'Flat'), amount: Number(body.amount ?? 0), applyPenalty: Boolean(body.applyPenalty), status: 'Pending' } as Charge;
    charges.push(c);
    return json(c);
  }),
  http.post('/api/charges/:id/verify', ({ params }) => { const c = charges.find((x) => x.id === params.id); if (c) c.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/reservations', () => json(reservations)),
  http.post('/api/reservations', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const r = { id: String(++idCounter), accountId: String(body.accountId), memberId: String(body.memberId), amount: Number(body.amount), reason: String(body.reason ?? ''), reservedAt: new Date().toISOString(), reservedBy: String(body.reservedBy ?? 'System'), status: 'Active' } as FundReservation;
    reservations.push(r);
    return json(r);
  }),
  http.post('/api/reservations/:id/release', ({ params }) => { const r = reservations.find((x) => x.id === params.id); if (r) r.status = 'Released'; return json({ ok: true }); }),

  http.get('/api/transaction-limits', () => json(transactionLimits)),
  http.post('/api/transaction-limits', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const t = { id: String(++idCounter), roleCode: String(body.roleCode), txnType: String(body.txnType), maxAmount: Number(body.maxAmount) } as TransactionLimit;
    transactionLimits.push(t);
    return json(t);
  }),

  http.get('/api/loan-categories', () => json(loanCategories)),
  http.post('/api/loan-categories', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const c = { id: String(++idCounter), name: String(body.name), description: String(body.description ?? ''), status: 'Pending' } as LoanCategory;
    loanCategories.push(c);
    return json(c);
  }),
  http.post('/api/loan-categories/:id/verify', ({ params }) => { const c = loanCategories.find((x) => x.id === params.id); if (c) c.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/loan-groups', () => json(loanGroups)),
  http.post('/api/loan-groups', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const g = { id: String(++idCounter), code: String(body.code), name: String(body.name), maxMembers: Number(body.maxMembers ?? 0), status: 'Pending' } as LoanGroup;
    loanGroups.push(g);
    return json(g);
  }),
  http.post('/api/loan-groups/:id/verify', ({ params }) => { const g = loanGroups.find((x) => x.id === params.id); if (g) g.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/committees', () => json(committees)),
  http.post('/api/committees', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const c = { id: String(++idCounter), name: String(body.name), minAmount: Number(body.minAmount ?? 0), maxAmount: Number(body.maxAmount ?? 0), status: 'Pending' } as CreditCommittee;
    committees.push(c);
    return json(c);
  }),
  http.post('/api/committees/:id/verify', ({ params }) => { const c = committees.find((x) => x.id === params.id); if (c) c.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/batch-jobs', () => json(batchJobs)),
  http.post('/api/batch-jobs', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const j = { id: String(++idCounter), jobType: String(body.jobType), name: String(body.name), status: 'Idle', lastRunAt: null as unknown as string } as BatchJob;
    batchJobs.push(j);
    return json(j);
  }),
  http.post('/api/batch-jobs/:id/run', ({ params }) => { const j = batchJobs.find((x) => x.id === params.id); if (j) { j.status = 'Done'; j.lastRunAt = new Date().toISOString(); } return json({ ok: true }); }),

  http.get('/api/assets', () => json(assets)),
  http.post('/api/assets', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const a = { id: String(++idCounter), code: String(body.code), name: String(body.name), value: Number(body.value ?? 0), depreciationRate: Number(body.depreciationRate ?? 0), dprLink: String(body.dprLink ?? ''), glLink: String(body.glLink ?? ''), branch: String(body.branch ?? ''), status: 'Active' } as FixedAsset;
    assets.push(a);
    return json(a);
  }),
  http.post('/api/assets/:id/depreciate', ({ params }) => { const a = assets.find((x) => x.id === params.id); if (a) a.value = Math.round(a.value * (1 - a.depreciationRate / 100)); return json({ ok: true }); }),

  http.get('/api/coa/classes', () => json(glClasses)),
  http.post('/api/coa/classes', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const c = { id: String(++idCounter), name: String(body.name), status: 'Pending' } as GlClass;
    glClasses.push(c);
    return json(c);
  }),
  http.post('/api/coa/classes/:id/verify', ({ params }) => { const c = glClasses.find((x) => x.id === params.id); if (c) c.status = 'Verified'; return json({ ok: true }); }),

  http.get('/api/payments', () => json(payments)),
  http.get('/api/payments/status/:status', ({ params }) => json(payments.filter((p) => p.status === params.status))),
  http.get('/api/payments/kind/:kind', ({ params }) => json(payments.filter((p) => p.kind === params.kind))),
  http.post('/api/payments', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const p = {
      id: String(++idCounter),
      paymentNo: `PMT-${String(idCounter).padStart(7, '0')}`,
      kind: String(body.kind),
      memberId: String(body.memberId ?? ''),
      accountId: String(body.accountId ?? ''),
      fromRef: String(body.fromRef ?? ''),
      toRef: String(body.toRef ?? ''),
      amount: Number(body.amount ?? 0),
      paymentModeId: String(body.paymentModeId ?? ''),
      description: String(body.description ?? ''),
      status: body.kind === 'DEPOSIT' ? 'Authorized' : 'Pending',
      createdBy: 'Kaleab Desta',
      createdAt: new Date().toISOString(),
      authorizedBy: null,
      authorizedAt: null,
      reversalOf: null,
    } as unknown as Payment;
    payments.unshift(p);
    return json(p);
  }),
  http.post('/api/payments/:id/authorize', ({ params }) => { const p = payments.find((x) => x.id === params.id); if (p) { p.status = 'Authorized'; p.authorizedBy = 'Tigist Fikre'; p.authorizedAt = new Date().toISOString(); } return json(p ?? {}); }),
  http.post('/api/payments/:id/reject', ({ params }) => { const p = payments.find((x) => x.id === params.id); if (p) p.status = 'Rejected'; return json(p ?? {}); }),
  http.post('/api/payments/:id/reverse', ({ params }) => { const p = payments.find((x) => x.id === params.id); if (p) p.status = 'Reversed'; return json(p ?? {}); }),
  http.post('/api/payments/mass-transfer', async ({ request }) => {
    const body = (await request.json()) as { legs?: unknown[] };
    return json({ posted: body.legs?.length ?? 0 });
  }),

  http.get('/api/audit/transactions', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'Unaudited';
    const rows = savingsTransactions.map((t) => ({ ...t, auditedStatus: t.auditedStatus ?? 'Unaudited' as const }));
    return json(status === 'all' ? rows : rows.filter((t) => t.auditedStatus === status));
  }),
  http.post('/api/audit/transactions/:id/exact', ({ params }) => { const t = savingsTransactions.find((x) => x.id === params.id); if (t) t.auditedStatus = 'Audited'; return json(t ?? {}); }),
  http.post('/api/audit/transactions/:id/discrepant', async ({ params, request }) => { const t = savingsTransactions.find((x) => x.id === params.id); if (t) { const b = await request.json().catch(() => ({})); t.auditedStatus = 'Discrepant'; t.auditNote = (b as { note?: string }).note; } return json(t ?? {}); }),
  http.post('/api/audit/transactions/:id/unaudit', ({ params }) => { const t = savingsTransactions.find((x) => x.id === params.id); if (t) t.auditedStatus = 'Unaudited'; return json(t ?? {}); }),
  http.post('/api/audit/transactions/:id/note', async ({ params, request }) => { const t = savingsTransactions.find((x) => x.id === params.id); const b = await request.json().catch(() => ({})); if (t) t.auditNote = (b as { note?: string }).note; return json(t ?? {}); }),
  http.get('/api/audit/logs', () => json(auditLogs)),

  http.get('/api/dop', () => json([{ id: '1', opDate: '2026-09-09', branchId: '1', vaultId: '1', status: 'Open', openedBy: 'Sisay Worku', openedAt: '2026-09-09T08:00:00', closedBy: null, closedAt: null }])),
  http.get('/api/dop/open', () => json({ id: '1', opDate: '2026-09-09', branchId: '1', vaultId: '1', status: 'Open', openedBy: 'Sisay Worku', openedAt: '2026-09-09T08:00:00' })),
  http.post('/api/dop/start', async () => { await delay(400); return json({ ok: true }); }),
  http.post('/api/dop/close', async () => { await delay(400); return json({ ok: true }); }),

  http.get('/api/reports/loan-aging', () => json([
    { bucket: 'Current', count: 12, balance: 861000 },
    { bucket: 'Substandard', count: 2, balance: 94000 },
    { bucket: 'Doubtful', count: 1, balance: 61000 },
    { bucket: 'Loss', count: 1, balance: 27000 },
  ])),
  http.get('/api/reports/delinquency', () => json([
    { loanNo: 'LN-2026-002', overdueDays: 45, balance: 61000, classification: 'Substandard', status: 'Partially Paid' },
    { loanNo: 'LN-2026-001', overdueDays: 15, balance: 58000, classification: 'Special Mention', status: 'Partially Paid' },
  ])),
  http.get('/api/reports/loan-disbursement-by-gender', () => json([{ gender: 'M', amount: 1200000, count: 6 }, { gender: 'F', amount: 980000, count: 5 }])),
  http.get('/api/reports/loan-disbursement-by-product', () => json([{ product: 'L-PER', amount: 800000 }, { product: 'L-EDU', amount: 420000 }])),
  http.get('/api/reports/top-borrowers', () => json([{ member: 'Tigist Fikre', loanNo: 'LN-2026-009', balance: 538000 }, { member: 'Samuel Worku', loanNo: 'LN-2026-011', balance: 270000 }])),
  http.get('/api/reports/transactions', () => json({ deposits: 24, withdrawals: 15, depositAmount: 850000, withdrawalAmount: 420000, total: 42 })),
  http.get('/api/reports/customers', () => json({ total: 20, active: 16, dormant: 2, suspended: 2 })),
  http.get('/api/reports/shares', () => json({ membersWithShares: 20, totalShareValue: 4820000 })),
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