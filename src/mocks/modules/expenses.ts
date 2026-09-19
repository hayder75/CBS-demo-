import { http, HttpResponse, delay } from 'msw';
import type { ExpenseCategory, ExpenseEntry } from '../../types';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const err = (message: string, status: number) => HttpResponse.json({ error: message }, { status });

export const expenseCategories: ExpenseCategory[] = [
  { id: 'ec1', code: 'EXP-SAL', name: 'Staff Salaries', glAccountCode: '3000', status: 'Verified' },
  { id: 'ec2', code: 'EXP-RENT', name: 'Office Rent', glAccountCode: '3100', status: 'Verified' },
  { id: 'ec3', code: 'EXP-UTIL', name: 'Utilities & Communication', glAccountCode: '3200', status: 'Pending' },
  { id: 'ec4', code: 'EXP-PROV', name: 'Provision for Loan Losses', glAccountCode: '3300', status: 'Pending' },
];

export const expenseEntries: ExpenseEntry[] = [
  {
    id: 'ex1',
    date: '2026-09-02',
    categoryId: 'ec1',
    categoryName: 'Staff Salaries',
    description: 'August staff salaries',
    amount: 342000,
    paymentMode: 'Cash',
    glAccountCode: '3000',
    postedBy: 'Kaleab Desta',
    status: 'Posted',
  },
  {
    id: 'ex2',
    date: '2026-09-03',
    categoryId: 'ec2',
    categoryName: 'Office Rent',
    description: 'September office rent',
    amount: 120000,
    paymentMode: 'Bank Transfer',
    glAccountCode: '3100',
    postedBy: 'Tigist Fikre',
    status: 'Posted',
  },
  {
    id: 'ex3',
    date: '2026-09-05',
    categoryId: 'ec1',
    categoryName: 'Staff Salaries',
    description: 'Overtime allowance for tellers',
    amount: 18500,
    paymentMode: 'Cash',
    glAccountCode: '3000',
    postedBy: 'Kaleab Desta',
    status: 'Posted',
  },
  {
    id: 'ex4',
    date: '2026-09-06',
    categoryId: 'ec2',
    categoryName: 'Office Rent',
    description: 'Duplicate rent payment',
    amount: 120000,
    paymentMode: 'Bank Transfer',
    glAccountCode: '3100',
    postedBy: 'Kaleab Desta',
    status: 'Reversed',
  },
  {
    id: 'ex5',
    date: '2026-08-28',
    categoryId: 'ec1',
    categoryName: 'Staff Salaries',
    description: 'August salaries - batch 1',
    amount: 338000,
    paymentMode: 'Cash',
    glAccountCode: '3000',
    postedBy: 'Marta Demissie',
    status: 'Posted',
  },
  {
    id: 'ex6',
    date: '2026-09-08',
    categoryId: 'ec1',
    categoryName: 'Staff Salaries',
    description: 'Contract cleaner wages',
    amount: 9500,
    paymentMode: 'Cash',
    glAccountCode: '3000',
    postedBy: 'Kaleab Desta',
    status: 'Posted',
  },
  {
    id: 'ex7',
    date: '2026-08-15',
    categoryId: 'ec2',
    categoryName: 'Office Rent',
    description: 'August office rent',
    amount: 120000,
    paymentMode: 'Check',
    glAccountCode: '3100',
    postedBy: 'Tigist Fikre',
    status: 'Posted',
  },
  {
    id: 'ex8',
    date: '2026-09-09',
    categoryId: 'ec2',
    categoryName: 'Office Rent',
    description: 'Parking space rent',
    amount: 15000,
    paymentMode: 'Digital',
    glAccountCode: '3100',
    postedBy: 'Kaleab Desta',
    status: 'Posted',
  },
];

let categorySeq = expenseCategories.length;
let entrySeq = expenseEntries.length;

export const expenseHandlers = [
  http.get('/api/expenses/categories', async () => {
    await delay(250);
    return json(expenseCategories);
  }),

  http.post('/api/expenses/categories', async ({ request }) => {
    await delay(400);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return err('Invalid JSON body', 400);
    }
    const code = String(body.code ?? '').trim();
    const name = String(body.name ?? '').trim();
    const glAccountCode = String(body.glAccountCode ?? '').trim();
    if (!code) return err('Category code is required', 400);
    if (!name) return err('Category name is required', 400);
    if (!glAccountCode) return err('GL account code is required', 400);
    if (expenseCategories.some((c) => c.code.toLowerCase() === code.toLowerCase())) {
      return err(`Expense category code ${code} already exists`, 400);
    }
    categorySeq += 1;
    const category: ExpenseCategory = {
      id: `ec-${Date.now()}-${categorySeq}`,
      code,
      name,
      glAccountCode,
      status: 'Pending',
    };
    expenseCategories.push(category);
    return json(category);
  }),

  http.post('/api/expenses/categories/:id/verify', async ({ params }) => {
    await delay(350);
    const category = expenseCategories.find((c) => c.id === params.id);
    if (!category) return err('Expense category not found', 404);
    if (category.status === 'Verified') {
      return err('Expense category is already verified', 400);
    }
    category.status = 'Verified';
    return json(category);
  }),

  http.get('/api/expenses', async () => {
    await delay(250);
    return json(expenseEntries);
  }),

  http.post('/api/expenses', async ({ request }) => {
    await delay(450);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return err('Invalid JSON body', 400);
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return err('Amount must be greater than zero', 400);
    }
    const category = expenseCategories.find((c) => c.id === String(body.categoryId ?? ''));
    if (!category) return err('Expense category not found', 400);
    if (category.status !== 'Verified') {
      return err('Expense category must be verified before posting', 400);
    }
    const description = String(body.description ?? '').trim();
    if (!description) return err('Description is required', 400);

    entrySeq += 1;
    const entry: ExpenseEntry = {
      id: `ex-${Date.now()}-${entrySeq}`,
      date: body.date ? String(body.date) : new Date().toISOString().slice(0, 10),
      categoryId: category.id,
      categoryName: category.name,
      description,
      amount,
      paymentMode: String(body.paymentMode ?? 'Cash'),
      glAccountCode: category.glAccountCode,
      postedBy: String(body.postedBy ?? 'Kaleab Desta'),
      status: 'Posted',
    };
    expenseEntries.unshift(entry);
    return json(entry);
  }),

  http.post('/api/expenses/:id/reverse', async ({ params }) => {
    await delay(400);
    const entry = expenseEntries.find((e) => e.id === params.id);
    if (!entry) return err('Expense entry not found', 404);
    if (entry.status !== 'Posted') {
      return err(`Only posted entries can be reversed (current: ${entry.status})`, 400);
    }
    entry.status = 'Reversed';
    return json(entry);
  }),
];
