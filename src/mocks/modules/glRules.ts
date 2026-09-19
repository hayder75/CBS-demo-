import { http, HttpResponse, delay } from 'msw';
import type { GlPostingRule } from '../../types';
import { glAccounts } from '../data';

const productTypes: GlPostingRule['productType'][] = [
  'Savings',
  'Loan',
  'Share',
  'Fee',
  'Treasury',
  'Expense',
];

const rules: GlPostingRule[] = [
  { id: 'gr-1', event: 'SAVINGS_DEPOSIT', description: 'Cash deposit into member savings account', productType: 'Savings', debitAccountCode: '1000', creditAccountCode: '1200', status: 'Active' },
  { id: 'gr-2', event: 'SAVINGS_WITHDRAWAL', description: 'Member savings withdrawal paid over the counter', productType: 'Savings', debitAccountCode: '1200', creditAccountCode: '1000', status: 'Active' },
  { id: 'gr-3', event: 'LOAN_DISBURSEMENT', description: 'Loan principal disbursed to a member', productType: 'Loan', debitAccountCode: '1400', creditAccountCode: '1000', status: 'Active' },
  { id: 'gr-4', event: 'LOAN_REPAYMENT', description: 'Loan principal and interest repayment received', productType: 'Loan', debitAccountCode: '1000', creditAccountCode: '1400', status: 'Active' },
  { id: 'gr-5', event: 'LOAN_INTEREST_ACCRUAL', description: 'Interest income accrual on outstanding loans', productType: 'Loan', debitAccountCode: '1400', creditAccountCode: '2000', status: 'Inactive' },
  { id: 'gr-6', event: 'SHARE_PURCHASE', description: 'Member share capital subscription', productType: 'Share', debitAccountCode: '1000', creditAccountCode: '1300', status: 'Active' },
  { id: 'gr-7', event: 'DIVIDEND_POSTING', description: 'Dividend declared and credited to member savings', productType: 'Share', debitAccountCode: '1500', creditAccountCode: '1201', status: 'Inactive' },
  { id: 'gr-8', event: 'FEE_INCOME', description: 'Service and processing fee income recognized', productType: 'Fee', debitAccountCode: '1000', creditAccountCode: '2100', status: 'Active' },
  { id: 'gr-9', event: 'TREASURY_BANK_TRANSFER', description: 'Cash transferred from vault to bank account', productType: 'Treasury', debitAccountCode: '1100', creditAccountCode: '1000', status: 'Active' },
  { id: 'gr-10', event: 'EXPENSE_PAYMENT', description: 'Operating expense paid from cash on hand', productType: 'Expense', debitAccountCode: '3000', creditAccountCode: '1000', status: 'Active' },
];

let ruleSeq = rules.length;

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const hasAccount = (code: string) => glAccounts.some((a) => a.code === code);

const validateMapping = (debitAccountCode: string, creditAccountCode: string) => {
  if (!debitAccountCode || !creditAccountCode) return 'Debit and credit accounts are required';
  if (debitAccountCode === creditAccountCode) return 'Debit and credit accounts must be different';
  if (!hasAccount(debitAccountCode)) return `Unknown debit account: ${debitAccountCode}`;
  if (!hasAccount(creditAccountCode)) return `Unknown credit account: ${creditAccountCode}`;
  return null;
};

export const glRuleHandlers = [
  http.get('/api/gl-rules', async () => {
    await delay(200);
    return json(rules);
  }),

  http.post('/api/gl-rules', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const event = String(body.event ?? '').trim();
    const productType = String(body.productType ?? '');
    const debitAccountCode = String(body.debitAccountCode ?? '').trim();
    const creditAccountCode = String(body.creditAccountCode ?? '').trim();

    if (!event) return HttpResponse.json({ error: 'Event is required' }, { status: 400 });
    if (!productTypes.includes(productType as GlPostingRule['productType'])) {
      return HttpResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }
    const mappingError = validateMapping(debitAccountCode, creditAccountCode);
    if (mappingError) return HttpResponse.json({ error: mappingError }, { status: 400 });

    const rule: GlPostingRule = {
      id: `gr-${++ruleSeq}`,
      event,
      description: String(body.description ?? ''),
      productType: productType as GlPostingRule['productType'],
      debitAccountCode,
      creditAccountCode,
      status: 'Active',
    };
    rules.unshift(rule);
    return json(rule);
  }),

  http.post('/api/gl-rules/:id/toggle', async ({ params }) => {
    await delay(300);
    const rule = rules.find((r) => r.id === params.id);
    if (!rule) return HttpResponse.json({ error: 'Rule not found' }, { status: 400 });
    rule.status = rule.status === 'Active' ? 'Inactive' : 'Active';
    return json(rule);
  }),

  http.post('/api/gl-rules/:id', async ({ params, request }) => {
    await delay(400);
    const rule = rules.find((r) => r.id === params.id);
    if (!rule) return HttpResponse.json({ error: 'Rule not found' }, { status: 400 });
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const debitAccountCode = String(body.debitAccountCode ?? '').trim();
    const creditAccountCode = String(body.creditAccountCode ?? '').trim();

    const mappingError = validateMapping(debitAccountCode, creditAccountCode);
    if (mappingError) return HttpResponse.json({ error: mappingError }, { status: 400 });

    rule.debitAccountCode = debitAccountCode;
    rule.creditAccountCode = creditAccountCode;
    if (body.description != null) rule.description = String(body.description);
    return json(rule);
  }),
];
