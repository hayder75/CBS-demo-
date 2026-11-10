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
import { dayControlHandlers } from './modules/dayControl';
import { termDepositHandlers } from './modules/termDeposits';
import { membershipApplicationHandlers } from './modules/membershipApplications';
import { generalAssemblyHandlers } from './modules/generalAssembly';
import { expenseHandlers } from './modules/expenses';
import { bankReconHandlers } from './modules/bankRecon';
import { glRuleHandlers } from './modules/glRules';
import { feeWaiverHandlers } from './modules/feeWaivers';
import { notificationTemplateHandlers } from './modules/notificationTemplates';
import { loanLifecycleHandlers } from './modules/loanLifecycle';
import { complianceHandlers } from './modules/compliance';
import { systemOpsHandlers } from './modules/systemOps';
import { twoFactorHandlers } from './modules/twoFactor';
import { afroSmsHandlers } from './modules/afroSms';
import { reportFrameworkHandlers } from './modules/reports';
import { adminConsoleHandlers } from './modules/admin';
import { scoringHandlers } from './modules/scoring';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

let idCounter = 1000;

const loanConfig = [
  { id: 'lc1', configKey: 'default_interest_rate_pct', configValue: '14', valueType: 'NUMBER', configGroup: 'Interest', description: 'Default annual interest rate for new loans' },
  { id: 'lc2', configKey: 'max_loan_to_savings_ratio', configValue: '3', valueType: 'NUMBER', configGroup: 'Limits', description: 'Maximum loan as a multiple of savings' },
  { id: 'lc3', configKey: 'min_loan_amount', configValue: '1000', valueType: 'NUMBER', configGroup: 'Limits', description: 'Minimum loan amount' },
  { id: 'lc4', configKey: 'max_loan_amount', configValue: '500000', valueType: 'NUMBER', configGroup: 'Limits', description: 'Maximum single loan amount' },
  { id: 'lc5', configKey: 'default_term_months', configValue: '24', valueType: 'NUMBER', configGroup: 'Tenor', description: 'Default loan term in months' },
  { id: 'lc6', configKey: 'penalty_rate_pct', configValue: '2', valueType: 'NUMBER', configGroup: 'Penalty', description: 'Late payment penalty rate' },
  { id: 'lc7', configKey: 'grace_period_months', configValue: '1', valueType: 'NUMBER', configGroup: 'Tenor', description: 'Default grace period' },
  { id: 'lc8', configKey: 'require_collateral_above', configValue: '100000', valueType: 'NUMBER', configGroup: 'Collateral', description: 'Collateral required above this amount' },
];

const productTypes = [
  { id: 'pt1', code: 'SAV-MAND', name: 'Mandatory Savings', category: 'Saving', description: 'Compulsory member savings', status: 'Verified' },
  { id: 'pt2', code: 'SAV-VOL', name: 'Voluntary Savings', category: 'Saving', description: 'Optional member savings', status: 'Verified' },
  { id: 'pt3', code: 'SAV-FIX', name: 'Fixed / Time Deposit', category: 'Saving', description: 'Fixed-term deposit product', status: 'Verified' },
  { id: 'pt4', code: 'SHR-ORD', name: 'Ordinary Shares', category: 'Share', description: 'Standard member share', status: 'Verified' },
  { id: 'pt5', code: 'SHR-SPEC', name: 'Special Shares', category: 'Share', description: 'Founder / special share class', status: 'Pending' },
  { id: 'pt6', code: 'LN-PER', name: 'Personal Loan', category: 'Loan', description: 'Individual personal loan', status: 'Verified' },
  { id: 'pt7', code: 'LN-GRP', name: 'Group Loan', category: 'Loan', description: 'Group-guaranteed loan', status: 'Verified' },
  { id: 'pt8', code: 'LN-BIZ', name: 'Business Loan', category: 'Loan', description: 'SME / business loan', status: 'Verified' },
  { id: 'pt9', code: 'LN-EMG', name: 'Emergency Loan', category: 'Loan', description: 'Short-term emergency loan', status: 'Verified' },
  { id: 'pt10', code: 'LN-EDU', name: 'Education Loan', category: 'Loan', description: 'School fees loan', status: 'Pending' },
];

const documentTypes = [
  { id: 'dt1', code: 'DOC-NID', name: 'National ID Copy', category: 'Customer', mandatory: true, retentionYears: 10, description: 'Copy of the national identity card', status: 'Verified' },
  { id: 'dt2', code: 'DOC-PHOTO', name: 'Passport Photo', category: 'Customer', mandatory: true, retentionYears: 5, description: 'Recent passport-size photograph', status: 'Verified' },
  { id: 'dt3', code: 'DOC-KYC', name: 'KYC Form', category: 'Customer', mandatory: true, retentionYears: 10, description: 'Know-your-customer declaration', status: 'Verified' },
  { id: 'dt4', code: 'DOC-SIG', name: 'Signature Card', category: 'Customer', mandatory: true, retentionYears: 10, description: 'Specimen signature card', status: 'Verified' },
  { id: 'dt5', code: 'DOC-PAYSLIP', name: 'Payslip / Employment Letter', category: 'Loan', mandatory: false, retentionYears: 5, description: 'Proof of income', status: 'Verified' },
  { id: 'dt6', code: 'DOC-TITLE', name: 'Collateral Title Deed', category: 'Collateral', mandatory: false, retentionYears: 15, description: 'Ownership document for collateral', status: 'Verified' },
  { id: 'dt7', code: 'DOC-INSURANCE', name: 'Insurance Certificate', category: 'Collateral', mandatory: false, retentionYears: 5, description: 'Insurance covering pledged asset', status: 'Pending' },
  { id: 'dt8', code: 'DOC-GUARANTEE', name: 'Guarantee Agreement', category: 'Loan', mandatory: false, retentionYears: 10, description: 'Loan guarantee contract', status: 'Verified' },
];

const messages = [
  { id: 'm1', title: 'Liquidity ratio below policy', body: 'The liquidity ratio has fallen below the 20% policy floor.', category: 'Risk', audience: 'MANAGER', channel: 'In-App', status: 'Sent', createdBy: 'Workineh', createdAt: '2026-09-20T09:10:00', sentAt: '2026-09-20T09:10:00' },
  { id: 'm2', title: 'Month-end close reminder', body: 'All tellers must close tills before the end-of-month close.', category: 'Operations', audience: 'TELLER', channel: 'In-App', status: 'Sent', createdBy: 'Workineh', createdAt: '2026-09-28T16:00:00', sentAt: '2026-09-28T16:00:00' },
  { id: 'm3', title: 'Loan arrears follow-up', body: 'PAR increased this month; follow up on 30+ day arrears.', category: 'Credit', audience: 'LOAN_OFFICER', channel: 'Email', status: 'Draft', createdBy: 'Workineh', createdAt: '2026-09-29T11:30:00', sentAt: null },
];

const attachments: { id: string; documentTypeId: string; entityType: string; entityId: string; fileName: string; mimeType: string; sizeKb: number; uploadedBy: string; uploadedAt: string; status: string }[] = [];

const kycOf = (i: number) => ({
  hasPhoto: i % 7 !== 0,
  hasSignature: i % 5 !== 0,
  kycStatus: i % 10 === 0 ? 'KycWaiting' : i % 6 === 0 ? 'Pending' : 'Verified',
});

const searchHandlers = [
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') ?? 'Customer';
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const m = (s?: string) => !q || (s ?? '').toLowerCase().includes(q);
    const t = type.toLowerCase();
    let results: { title: string; subtitle: string; detail: string; ref: string }[] = [];
    if (t.includes('account') && !t.includes('share')) {
      results = savingsAccounts.filter((a) => m(a.accountNo) || m(a.accountType)).map((a) => ({ title: a.accountNo, subtitle: `${a.accountType} · ${a.status}`, detail: `Balance ${a.balance}`, ref: a.accountNo }));
    } else if (t.includes('share')) {
      results = shareAccounts.filter((s) => m(s.status) || m(String(s.shareCount))).map((s) => ({ title: `Share account #${s.id}`, subtitle: s.status, detail: `${s.shareCount ?? 0} shares`, ref: String(s.id) }));
    } else if (t === 'gl' || t.includes('ledger')) {
      results = glAccounts.filter((g) => m(g.code) || m(g.name) || m(g.category)).map((g) => ({ title: `${g.code} — ${g.name}`, subtitle: g.category, detail: `Balance ${g.balance}`, ref: g.code }));
    } else if (t.includes('document')) {
      results = documentTypes.filter((d) => m(d.code) || m(d.name) || m(d.category)).map((d) => ({ title: d.name, subtitle: `${d.code} · ${d.category}`, detail: d.mandatory ? 'Mandatory' : 'Optional', ref: d.code }));
    } else if (t.includes('transaction')) {
      results = savingsTransactions.filter((x) => m(String(x.id)) || m(x.teller) || m(x.type)).map((x) => ({ title: `#${x.id} ${x.type}`, subtitle: String(x.date), detail: `${x.amount} by ${x.teller ?? '—'}`, ref: String(x.id) }));
    } else if (t.includes('loan')) {
      results = loans.filter((l) => m(l.loanNo) || m(l.status) || m(l.classification)).map((l) => ({ title: l.loanNo, subtitle: `${l.status} · ${l.classification}`, detail: `Balance ${l.balance}`, ref: l.loanNo }));
    } else {
      results = members.filter((mm) => m(mm.fullName) || m(mm.memberNo) || m(mm.phone)).map((mm) => ({ title: mm.fullName, subtitle: mm.memberNo, detail: `Phone ${mm.phone ?? '—'} · ${mm.status}`, ref: mm.memberNo }));
    }
    return json({ type, query: q, count: results.length, results });
  }),
];

const gapHandlers = [
  http.get('/api/members/kyc/summary', () => {
    const enriched = members.map((_, i) => ({ ...kycOf(i) }));
    return json({
      total: enriched.length,
      pending: enriched.filter((m) => m.kycStatus === 'Pending' || m.kycStatus === 'KycWaiting').length,
      verified: enriched.filter((m) => m.kycStatus === 'Verified').length,
      emptyPhoto: enriched.filter((m) => !m.hasPhoto).length,
      withoutSignature: enriched.filter((m) => !m.hasSignature).length,
    });
  }),
  http.get('/api/members/kyc', ({ request }) => {
    const filter = new URL(request.url).searchParams.get('filter') ?? 'all';
    const enriched = members.map((m, i) => ({ id: m.id, memberNo: m.memberNo, fullName: m.fullName, gender: m.gender, phone: m.phone, status: m.status, ...kycOf(i) }));
    const f = filter.toLowerCase();
    return json(enriched.filter((m) => {
      if (f === 'pending') return m.kycStatus === 'Pending' || m.kycStatus === 'KycWaiting';
      if (f === 'verified') return m.kycStatus === 'Verified';
      if (f === 'empty-photo') return !m.hasPhoto;
      if (f === 'without-signature') return !m.hasSignature;
      if (f === 'kyc-waiting') return m.kycStatus === 'KycWaiting';
      return true;
    }));
  }),
  http.post('/api/members/import', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as { rows?: { fullName?: string }[] };
    if (!Array.isArray(b.rows)) return HttpResponse.json({ error: 'rows must be an array' }, { status: 400 });
    return json({ created: b.rows.filter((r) => r.fullName).length, total: b.rows.length });
  }),
  http.get('/api/documents/attachments', ({ request }) => {
    const url = new URL(request.url);
    const et = url.searchParams.get('entityType');
    const ei = url.searchParams.get('entityId');
    return json(et && ei ? attachments.filter((a) => a.entityType === et && a.entityId === ei) : attachments);
  }),
  http.post('/api/documents/attachments', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as { documentTypeId?: string | number; entityType?: string; entityId?: string; fileName?: string; mimeType?: string; sizeKb?: number; uploadedBy?: string };
    if (!b.documentTypeId || !b.entityType || !b.entityId || !b.fileName) return HttpResponse.json({ error: 'missing fields' }, { status: 400 });
    const a = { id: String(++idCounter), documentTypeId: String(b.documentTypeId), entityType: b.entityType, entityId: b.entityId, fileName: b.fileName, mimeType: b.mimeType ?? 'application/pdf', sizeKb: b.sizeKb ?? 0, uploadedBy: b.uploadedBy ?? 'Workineh', uploadedAt: new Date().toISOString(), status: 'Active' };
    attachments.push(a);
    return json(a);
  }),
  http.delete('/api/documents/attachments/:id', ({ params }) => {
    const i = attachments.findIndex((a) => a.id === params.id);
    if (i >= 0) attachments.splice(i, 1);
    return json({ ok: true });
  }),
  http.get('/api/messages', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    return json(status ? messages.filter((m) => m.status === status) : messages);
  }),
  http.post('/api/messages', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as { title?: string; body?: string; category?: string; audience?: string; channel?: string; send?: boolean };
    if (!b.title) return HttpResponse.json({ error: 'title is required' }, { status: 400 });
    const m = { id: String(++idCounter), title: b.title, body: b.body ?? '', category: b.category ?? 'General', audience: b.audience ?? 'All', channel: b.channel ?? 'In-App', status: b.send ? 'Sent' : 'Draft', createdBy: 'Workineh', createdAt: new Date().toISOString(), sentAt: b.send ? new Date().toISOString() : null };
    messages.push(m);
    return json(m);
  }),
  http.post('/api/messages/:id/send', ({ params }) => {
    const m = messages.find((x) => x.id === params.id);
    if (m) { m.status = 'Sent'; m.sentAt = new Date().toISOString(); }
    return json(m ?? {});
  }),
  http.delete('/api/messages/:id', ({ params }) => {
    const i = messages.findIndex((m) => m.id === params.id);
    if (i >= 0) messages.splice(i, 1);
    return json({ ok: true });
  }),
];

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
  http.get('/api/loans/repayment-prediction', () =>
    json(loans.filter((l) => l.balance > 0).map((l) => ({
      loanNo: l.loanNo,
      member: l.memberName,
      balance: l.balance,
      nextDueDate: l.disbursedAt ?? '',
      overdueDays: l.overdueDays,
      aiScore: l.aiScore ?? 60,
      aiPdPct: l.aiPdPct ?? 5,
      guidance: l.aiGuidance ?? 'Monitor',
    })))),
  http.get('/api/loan-config', () => json(loanConfig)),
  http.put('/api/loan-config/:key', async ({ params, request }) => {
    const c = loanConfig.find((x) => x.configKey === params.key);
    if (!c) return HttpResponse.json({ error: 'not found' }, { status: 404 });
    const b = (await request.json().catch(() => ({}))) as { configValue?: string };
    if (b.configValue !== undefined) c.configValue = b.configValue;
    return json(c);
  }),
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
      documentNo: body.documentNo ? String(body.documentNo) : undefined,
      documentAttachment: body.documentAttachment ? String(body.documentAttachment) : undefined,
      registrationDate: body.registrationDate ? String(body.registrationDate) : undefined,
      custodian: body.custodian ? String(body.custodian) : undefined,
      insuranceCompany: body.insuranceCompany ? String(body.insuranceCompany) : undefined,
      description: String(body.description ?? ''),
      valuation,
      forcedSaleValue: Math.round(valuation * (1 - discount / 100)),
      discountPct: discount,
      loanId: undefined,
      loanRef: body.loanRef ? String(body.loanRef) : undefined,
      insuranceExpiry: body.insuranceExpiry ? String(body.insuranceExpiry) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
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
    const member = members.find((m) => m.id === body.memberId);
    const newLoan: Loan = {
      id: `l-${Date.now()}`,
      loanNo: `LN-2026-0${60 + Math.floor(Math.random() * 40)}`,
      memberId: body.memberId ?? 'm10',
      memberName: member?.fullName ?? 'Liya Getachew',
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
      collateralIds: body.collateralIds ?? [],
      aiScore: Math.floor(Math.random() * 40) + 55,
      aiPdPct: Number((Math.random() * 15).toFixed(1)),
      aiGuidance: 'Approve with reduced amount',
      repaymentAccountId: body.repaymentAccountId,
      reserveAccountId: body.reserveAccountId,
    };
    (body.collateralIds ?? []).forEach((cid: string) => {
      const c = collateral.find((x) => x.id === cid);
      if (c) c.loanId = newLoan.id;
    });
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
  http.get('/api/accounts/member/:memberId', ({ params }) => {
    const id = String(params.memberId).replace(/^m/i, '');
    return json(savingsAccounts.filter((a) => a.memberId === id));
  }),
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
  http.post('/api/accounts/:id/suspend', ({ params, request }) => {
    const kind = new URL(request.url).searchParams.get('kind') ?? 'Under';
    const a = savingsAccounts.find((x) => x.id === params.id);
    if (a) a.status = kind === 'Credit' ? 'CreditSuspension' : kind === 'Debit' ? 'DebitSuspension' : 'UnderSuspension';
    return json(a ?? {});
  }),
  http.post('/api/accounts/:id/inactivate', ({ params }) => { const a = savingsAccounts.find((x) => x.id === params.id); if (a) a.status = 'Inactive'; return json(a ?? {}); }),
  http.post('/api/accounts/:id/reactivate', ({ params }) => { const a = savingsAccounts.find((x) => x.id === params.id); if (a) a.status = 'Active'; return json(a ?? {}); }),
  http.get('/api/documents', () => json(documentTypes)),
  http.post('/api/documents', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as { code?: string; name?: string; category?: string; mandatory?: boolean; retentionYears?: number };
    if (!b.code || !b.name) return HttpResponse.json({ error: 'code and name are required' }, { status: 400 });
    if (documentTypes.some((d) => d.code === b.code)) return HttpResponse.json({ error: 'document code exists' }, { status: 400 });
    const d = { id: String(++idCounter), code: b.code, name: b.name, category: b.category ?? 'Customer', mandatory: !!b.mandatory, retentionYears: b.retentionYears ?? 5, description: '', status: 'Pending' };
    documentTypes.push(d);
    return json(d);
  }),
  http.post('/api/documents/:id/verify', ({ params }) => {
    const d = documentTypes.find((x) => x.id === params.id);
    if (d) d.status = 'Verified';
    return json(d ?? {});
  }),

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
  http.get('/api/coa/leaves', () => json(glAccounts)),
  http.get('/api/coa/hierarchical', () => json(glClasses.map((c) => ({
    id: c.id, name: c.name, status: c.status,
    leaves: glAccounts.filter((a) => String(a.classId) === String(c.id)).map((a) => ({
      code: a.code, name: a.name, balance: a.balance, category: a.category,
    })),
  })))),
  http.post('/api/coa/import-gl-balance', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as { rows?: { code: string; balance: number }[] };
    let updated = 0;
    (b.rows ?? []).forEach((r) => {
      const a = glAccounts.find((x) => x.code === r.code);
      if (a) { a.balance = Number(r.balance); updated++; }
    });
    return json({ updated, total: b.rows?.length ?? 0 });
  }),
  http.get('/api/product-types', () => json(productTypes)),
  http.post('/api/product-types', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as { code?: string; name?: string; category?: string };
    if (!b.code || !b.name) return HttpResponse.json({ error: 'code and name are required' }, { status: 400 });
    if (productTypes.some((p) => p.code === b.code)) return HttpResponse.json({ error: 'product code exists' }, { status: 400 });
    const p = { id: String(++idCounter), code: b.code, name: b.name, category: b.category ?? 'Saving', description: '', status: 'Pending' };
    productTypes.push(p);
    return json(p);
  }),
  http.post('/api/product-types/:id/verify', ({ params }) => {
    const p = productTypes.find((x) => String(x.id) === params.id);
    if (p) p.status = 'Verified';
    return json(p ?? {});
  }),
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
  http.get('/api/payments/authorize/categories', () => {
    const cats = [
      ['CUSTOMER_DEPOSIT', 'Customer Deposits', 'Deposits funds into member accounts', ['DEPOSIT']],
      ['CUSTOMER_WITHDRAWAL', 'Customer Withdrawals', 'Withdrawals from member accounts', ['WITHDRAWAL']],
      ['SHARE_WITHDRAWAL', 'Share Withdrawals', 'Withdrawal of shares from member accounts', ['SHARE_WITHDRAWAL']],
      ['SHARE_TRANSFER', 'Share Transfers', 'Movement of shares between member accounts', ['SHARE_TRANSFER']],
      ['CUSTOMER_ADJUSTMENT', 'Customer Adjustments', 'Period-end corrections to member balances', ['ADJUSTMENT', 'CUSTOMER_ADJUSTMENT']],
      ['OUTGOING_CLAIM', 'Outgoing Claims', 'Branch transferring funds to another branch GL', ['BRANCH_CLAIM', 'OUTGOING_CLAIM']],
      ['TILL', 'Till Transactions', 'Cash movement within the till network', ['TILL']],
      ['RECEIPT_VOUCHER', 'Receipt Voucher', 'Incoming receipt posted to the GL', ['RECEIPT_VOUCHER']],
      ['MANUAL_DEPOSIT', 'Manual Deposits/Credits', 'Direct credit to a GL account', ['MANUAL_DEPOSIT']],
      ['MANUAL_WITHDRAWAL', 'Manual Withdrawals/Debits', 'Direct debit from a GL account', ['MANUAL_WITHDRAWAL']],
      ['ACCOUNT_TRANSFER', 'Account Transfers', 'Transfer between accounts within the organisation', ['TRANSFER', 'ACCOUNT_TRANSFER']],
      ['MASS_TRANSFER', 'Mass Transfers', 'One-to-many / many-to-many transfers', ['MASS', 'MASS_TRANSFER']],
      ['MANUAL_ADJUSTMENT', 'Manual Adjustments', 'Period-end GL corrections', ['MANUAL_ADJUSTMENT']],
      ['INCOMING_CLAIM', 'Incoming Claims', 'Branch claiming funds owed by another branch GL', ['INCOMING_CLAIM']],
      ['PAYMENT_VOUCHER', 'Payment Voucher', 'Outgoing payment settled through the GL', ['PAYMENT_VOUCHER']],
    ] as const;
    return json(cats.map(([key, name, description, kinds]) => ({
      key, name, description, kinds,
      pending: payments.filter((p) => p.status === 'Pending' && (kinds as readonly string[]).includes(p.kind)).length,
    })));
  }),
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

  http.get('/api/audit/ho-overview', () => {
    const all = savingsTransactions;
    const exact = all.filter((t) => t.auditedStatus === 'Audited').length;
    const discrepant = all.filter((t) => t.auditedStatus === 'Discrepant').length;
    const unaudited = all.filter((t) => !t.auditedStatus || t.auditedStatus === 'Unaudited').length;
    const byTeller = new Map<string, { exact: number; discrepant: number; unaudited: number }>();
    all.forEach((t) => {
      const k = t.teller ?? 'Unassigned';
      const e = byTeller.get(k) ?? { exact: 0, discrepant: 0, unaudited: 0 };
      if (t.auditedStatus === 'Audited') e.exact++;
      else if (t.auditedStatus === 'Discrepant') e.discrepant++;
      else e.unaudited++;
      byTeller.set(k, e);
    });
    return json({
      total: all.length,
      auditedExact: exact,
      auditedDiscrepant: discrepant,
      unaudited,
      byTeller: [...byTeller.entries()].map(([teller, v]) => ({
        teller, ...v, total: v.exact + v.discrepant + v.unaudited,
      })),
    });
  }),
  http.get('/api/audit/ho/transactions', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status') ?? 'all';
    return json(savingsTransactions.filter((t) => status === 'all' || t.auditedStatus === status));
  }),

  http.get('/api/finance/cash-position', () => {
    const accounts = glAccounts
      .filter((a) => a.code.startsWith('10') || a.code.startsWith('11') || /cash|bank/i.test(a.name))
      .map((a) => ({ code: a.code, account: a.name, balance: a.balance, currency: 'ETB' }));
    return json({ total: accounts.reduce((s, a) => s + a.balance, 0), accounts, asOf: new Date().toISOString() });
  }),
  http.get('/api/finance/daily-trial-balance', () => {
    const rows = glAccounts.map((a) => ({
      code: a.code, name: a.name,
      debit: a.balance >= 0 ? a.balance : 0,
      credit: a.balance < 0 ? Math.abs(a.balance) : 0,
    }));
    return json({
      rows,
      totalDebit: rows.reduce((s, r) => s + r.debit, 0),
      totalCredit: rows.reduce((s, r) => s + r.credit, 0),
    });
  }),
  http.get('/api/finance/income-statement', () => {
    const income = glAccounts.filter((a) => a.category === 'Income').map((a) => ({ code: a.code, name: a.name, amount: a.balance }));
    const expense = glAccounts.filter((a) => a.category === 'Expense').map((a) => ({ code: a.code, name: a.name, amount: a.balance }));
    const totalIncome = income.reduce((s, a) => s + a.amount, 0);
    const totalExpense = expense.reduce((s, a) => s + a.amount, 0);
    return json({ income, expense, totalIncome, totalExpense, netSurplus: totalIncome - totalExpense });
  }),
  http.get('/api/finance/opening-balance', () =>
    json(glAccounts.map((a) => ({ code: a.code, name: a.name, balance: a.balance, category: a.category })))),
  http.post('/api/finance/opening-balance', async ({ request }) => {
    const b = (await request.json().catch(() => ({}))) as { code?: string; amount?: number };
    const a = glAccounts.find((x) => x.code === b.code);
    if (!a) return HttpResponse.json({ error: 'GL account not found' }, { status: 404 });
    a.balance = Number(b.amount ?? 0);
    return json({ code: a.code, name: a.name, balance: a.balance });
  }),

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

  ...dayControlHandlers,
  ...termDepositHandlers,
  ...membershipApplicationHandlers,
  ...generalAssemblyHandlers,
  ...expenseHandlers,
  ...bankReconHandlers,
  ...glRuleHandlers,
  ...feeWaiverHandlers,
  ...notificationTemplateHandlers,
  ...loanLifecycleHandlers,
  ...complianceHandlers,
  ...systemOpsHandlers,
  ...twoFactorHandlers,
  ...reportFrameworkHandlers,
  ...adminConsoleHandlers,
  ...searchHandlers,
  ...gapHandlers,
  ...scoringHandlers,
  ...afroSmsHandlers,
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