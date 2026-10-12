import { http, HttpResponse } from 'msw';
import type {
  ReportCategory,
  ReportColumn,
  ReportColumnType,
  ReportDefinition,
  ReportResult,
} from '../../types';
import { members, loans, glAccounts, savingsTransactions, shareAccounts, shareTransfers, savingsAccounts, assets } from '../data';

const col = (key: string, label: string, type: ReportColumnType): ReportColumn => ({ key, label, type });

const def = (
  key: string,
  name: string,
  description: string,
  params: string[],
  columns: ReportColumn[],
): ReportDefinition => ({ key, name, description, params, columns });

const D = ['from', 'to', 'office'];
const DS = ['from', 'to', 'office', 'status'];
const A = ['asOf'];

export const reportCatalog: ReportCategory[] = [
  {
    category: 'financial-reports',
    name: 'Financial Reports',
    reports: [
      def('financial-reports/trial-balance', 'Trial Balance', 'Debit/credit balances by GL account', ['asOf', 'office'],
        [col('code', 'Code', 'STRING'), col('name', 'Account', 'STRING'), col('debit', 'Debit', 'MONEY'), col('credit', 'Credit', 'MONEY')]),
      def('financial-reports/balance-sheet', 'Balance Sheet', 'Assets, liabilities and equity', A,
        [col('category', 'Category', 'STRING'), col('code', 'Code', 'STRING'), col('name', 'Account', 'STRING'), col('amount', 'Amount', 'MONEY')]),
    ],
  },
  {
    category: 'general-loan-reports',
    name: 'General Loan Reports',
    reports: [
      def('general-loan-reports/loan', 'Loan Report', 'All loan accounts', DS,
        [col('loanNo', 'Loan No', 'STRING'), col('member', 'Member', 'STRING'), col('amount', 'Principal', 'MONEY'), col('balance', 'Balance', 'MONEY'), col('overdueDays', 'Overdue', 'NUMBER'), col('classification', 'Classification', 'STRING')]),
      def('general-loan-reports/delinquency-report', 'Delinquency Report', 'Loans past due', D,
        [col('loanNo', 'Loan No', 'STRING'), col('member', 'Member', 'STRING'), col('overdueDays', 'Days Overdue', 'NUMBER'), col('balance', 'Outstanding', 'MONEY'), col('classification', 'Classification', 'STRING')]),
      def('general-loan-reports/loan-status-report', 'Loan Status Report', 'Counts and balances by status', D,
        [col('status', 'Status', 'STRING'), col('count', 'Count', 'NUMBER'), col('balance', 'Balance', 'MONEY')]),
      def('general-loan-reports/aging-report', 'Loan Aging Report', 'Portfolio by aging bucket', A,
        [col('bucket', 'Bucket', 'STRING'), col('count', 'Count', 'NUMBER'), col('balance', 'Balance', 'MONEY')]),
      def('general-loan-reports/loan-loss-reserve-report', 'Loan Loss Reserve', 'Provisioning by classification', A,
        [col('classification', 'Classification', 'STRING'), col('count', 'Count', 'NUMBER'), col('outstanding', 'Outstanding', 'MONEY'), col('ratePct', 'Rate %', 'PERCENT'), col('provision', 'Provision', 'MONEY')]),
      def('general-loan-reports/loan-disbursement-report', 'Loan Disbursement', 'Loans disbursed in period', D,
        [col('loanNo', 'Loan No', 'STRING'), col('member', 'Member', 'STRING'), col('amount', 'Amount', 'MONEY'), col('disbursedAt', 'Disbursed', 'DATE')]),
      def('general-loan-reports/par/dashboard', 'PAR Dashboard', 'Portfolio at risk overview', A,
        [col('bucket', 'Bucket', 'STRING'), col('balance', 'Balance', 'MONEY'), col('parPct', 'PAR %', 'PERCENT')]),
      def('general-loan-reports/loan-book-analysis', 'Loan Book Analysis', 'Portfolio composition', D,
        [col('dimension', 'Dimension', 'STRING'), col('value', 'Value', 'STRING'), col('count', 'Count', 'NUMBER'), col('amount', 'Amount', 'MONEY')]),
    ],
  },
  {
    category: 'head-office-reports',
    name: 'Head Office Reports',
    reports: [
      def('head-office-reports/gl-reports', 'HO GL Reports', 'Consolidated GL', A,
        [col('code', 'Code', 'STRING'), col('name', 'Account', 'STRING'), col('balance', 'Balance', 'MONEY')]),
      def('head-office-reports/posting-journal', 'HO Posting Journal', 'Journal postings', D,
        [col('date', 'Date', 'DATE'), col('ref', 'Ref', 'STRING'), col('account', 'Account', 'STRING'), col('debit', 'Debit', 'MONEY'), col('credit', 'Credit', 'MONEY')]),
      def('head-office-reports/customers-report', 'HO Customers', 'Members by office/status', D,
        [col('office', 'Office', 'STRING'), col('status', 'Status', 'STRING'), col('count', 'Count', 'NUMBER')]),
      def('head-office-reports/fixed-asset-management', 'HO Fixed Assets', 'Asset register', A,
        [col('code', 'Code', 'STRING'), col('name', 'Asset', 'STRING'), col('cost', 'Cost', 'MONEY'), col('netBook', 'Net Book', 'MONEY')]),
      def('head-office-reports/accounts-report', 'HO Accounts', 'Accounts by office/status', D,
        [col('office', 'Office', 'STRING'), col('count', 'Count', 'NUMBER'), col('balance', 'Balance', 'MONEY')]),
      def('head-office-reports/loan', 'HO Loan Report', 'Loans by office', D,
        [col('office', 'Office', 'STRING'), col('count', 'Count', 'NUMBER'), col('balance', 'Balance', 'MONEY')]),
    ],
  },
  {
    category: 'head-office-finance',
    name: 'Head Office Finance',
    reports: [
      def('head-office-finance/balance-sheet', 'Consolidated Balance Sheet', 'Balance sheet by office', A,
        [col('category', 'Category', 'STRING'), col('name', 'Account', 'STRING'), col('amount', 'Amount', 'MONEY')]),
      def('head-office-finance/income-statement', 'Consolidated Income Statement', 'Income and expenses', D,
        [col('line', 'Line', 'STRING'), col('amount', 'Amount', 'MONEY')]),
      def('head-office-finance/daily-trial-balance', 'Daily Trial Balance', 'Trial balance for a day', ['asOf', 'office'],
        [col('code', 'Code', 'STRING'), col('name', 'Account', 'STRING'), col('debit', 'Debit', 'MONEY'), col('credit', 'Credit', 'MONEY')]),
      def('head-office-finance/profit-loss', 'Profit & Loss', 'Profit and loss statement', D,
        [col('line', 'Line', 'STRING'), col('amount', 'Amount', 'MONEY')]),
      def('head-office-finance/cash-position', 'Cash Position', 'Cash and bank positions', A,
        [col('account', 'Account', 'STRING'), col('balance', 'Balance', 'MONEY')]),
      def('head-office-finance/cashflow', 'Cash Flow', 'Cash flow statement', D,
        [col('section', 'Section', 'STRING'), col('line', 'Line', 'STRING'), col('amount', 'Amount', 'MONEY')]),
    ],
  },
  {
    category: 'nbe-reports',
    name: 'NBE Reports',
    reports: [
      def('nbe-reports/trial-balance', 'NBE Trial Balance', 'Regulatory trial balance', A,
        [col('code', 'Code', 'STRING'), col('name', 'Account', 'STRING'), col('debit', 'Debit', 'MONEY'), col('credit', 'Credit', 'MONEY')]),
      def('nbe-reports/balance-sheet', 'NBE Balance Sheet', 'Regulatory balance sheet', A,
        [col('category', 'Category', 'STRING'), col('name', 'Account', 'STRING'), col('amount', 'Amount', 'MONEY')]),
      def('nbe-reports/loan-distribution-by-gender', 'Loan Distribution by Gender', 'NBE gender breakdown', D,
        [col('gender', 'Gender', 'STRING'), col('count', 'Count', 'NUMBER'), col('amount', 'Amount', 'MONEY')]),
      def('nbe-reports/loan-disbursement-by-sector', 'Disbursement by Sector', 'NBE sector breakdown', D,
        [col('sector', 'Sector', 'STRING'), col('count', 'Count', 'NUMBER'), col('amount', 'Amount', 'MONEY')]),
      def('nbe-reports/top-borrowing-groups', 'Top Borrowing Groups', 'Largest exposures', A,
        [col('group', 'Group', 'STRING'), col('accounts', 'Accounts', 'NUMBER'), col('balance', 'Balance', 'MONEY')]),
    ],
  },
  {
    category: 'aml-reports',
    name: 'AML Reports',
    reports: [
      def('aml-reports/dashboard', 'AML Dashboard', 'Alerts and case overview', D,
        [col('pattern', 'Pattern', 'STRING'), col('alerts', 'Alerts', 'NUMBER'), col('cases', 'Cases', 'NUMBER'), col('amount', 'Amount', 'MONEY')]),
      def('aml-reports/case-details', 'AML Case Details', 'Individual AML cases', D,
        [col('caseNo', 'Case No', 'STRING'), col('pattern', 'Pattern', 'STRING'), col('member', 'Member', 'STRING'), col('amount', 'Amount', 'MONEY'), col('status', 'Status', 'STRING')]),
    ],
  },
  {
    category: 'mobile-banking-reports',
    name: 'Mobile Banking Reports',
    reports: [
      def('mobile-banking-reports', 'Mobile Banking', 'Mobile channel activity', D,
        [col('metric', 'Metric', 'STRING'), col('count', 'Count', 'NUMBER'), col('amount', 'Amount', 'MONEY')]),
    ],
  },
  {
    category: 'transaction-report',
    name: 'Transaction Reports',
    reports: [
      def('transaction-report/deposit', 'Deposit Report', 'Deposits in period', D,
        [col('date', 'Date', 'DATE'), col('member', 'Member', 'STRING'), col('amount', 'Amount', 'MONEY'), col('channel', 'Channel', 'STRING'), col('teller', 'Teller', 'STRING')]),
      def('transaction-report/withdrawal', 'Withdrawal Report', 'Withdrawals in period', D,
        [col('date', 'Date', 'DATE'), col('member', 'Member', 'STRING'), col('amount', 'Amount', 'MONEY'), col('channel', 'Channel', 'STRING')]),
      def('transaction-report/deposit-mobilization', 'Deposit Mobilization', 'Deposits by teller', D,
        [col('teller', 'Teller', 'STRING'), col('count', 'Count', 'NUMBER'), col('amount', 'Amount', 'MONEY')]),
    ],
  },
  {
    category: 'customer-report',
    name: 'Customer Reports',
    reports: [
      def('customer-report', 'Customer Report', 'Members with status and balances', DS,
        [col('memberNo', 'Member No', 'STRING'), col('name', 'Full Name', 'STRING'), col('gender', 'Gender', 'STRING'), col('status', 'Status', 'STRING'), col('savingsBalance', 'Savings', 'MONEY'), col('shareBalance', 'Shares', 'MONEY')]),
    ],
  },
  {
    category: 'account-report',
    name: 'Account Reports',
    reports: [
      def('account-report', 'Account Report', 'Accounts by office', D,
        [col('member', 'Member', 'STRING'), col('accountNo', 'Account No', 'STRING'), col('type', 'Type', 'STRING'), col('balance', 'Balance', 'MONEY'), col('status', 'Status', 'STRING')]),
    ],
  },
  {
    category: 'share-report',
    name: 'Share Reports',
    reports: [
      def('share-report/share-collection-sheet', 'Share Collection Sheet', 'Share purchases by member', D,
        [col('member', 'Member', 'STRING'), col('shares', 'Shares', 'NUMBER'), col('amount', 'Amount', 'MONEY')]),
    ],
  },
  {
    category: 'general-report',
    name: 'General Reports',
    reports: [
      def('general-report', 'General Report', 'General ledger listings', A,
        [col('code', 'Code', 'STRING'), col('name', 'Account', 'STRING'), col('balance', 'Balance', 'MONEY')]),
    ],
  },
];

const memberName = (id: unknown) => members.find((m) => m.id === id)?.fullName ?? String(id);

const BUCKETS: Array<[string, number, number]> = [
  ['Current', 0, 0], ['1-30', 1, 30], ['31-60', 31, 60], ['61-90', 61, 90],
  ['91-120', 91, 120], ['121-180', 121, 180], ['180+', 181, 999999],
];

function trialBalance() {
  return glAccounts.map((a) => {
    const debitSide = a.balance >= 0;
    return {
      code: a.code, name: a.name,
      debit: debitSide ? Math.abs(a.balance) : 0,
      credit: debitSide ? 0 : Math.abs(a.balance),
      balance: a.balance,
    };
  });
}

function runRows(key: string): Record<string, unknown>[] {
  switch (key) {
    case 'financial-reports/trial-balance':
    case 'head-office-finance/daily-trial-balance':
    case 'nbe-reports/trial-balance':
      return trialBalance();
    case 'financial-reports/balance-sheet':
    case 'head-office-finance/balance-sheet':
    case 'nbe-reports/balance-sheet':
      return glAccounts.map((a) => ({ category: a.category, code: a.code, name: a.name, amount: a.balance }));
    case 'general-report':
    case 'head-office-reports/gl-reports':
      return glAccounts.map((a) => ({ code: a.code, name: a.name, balance: a.balance }));
    case 'head-office-reports/posting-journal':
      return glAccounts.slice(0, 8).map((a, i) => ({
        date: '2026-09-0' + ((i % 8) + 1), ref: 'JRN-2026-00' + (41 + i),
        account: `${a.code} ${a.name}`, debit: a.balance > 0 ? a.balance : 0, credit: a.balance < 0 ? -a.balance : 0,
      }));
    case 'general-loan-reports/loan':
      return loans.map((l) => ({
        loanNo: l.loanNo, member: l.memberName, amount: l.amount, balance: l.balance,
        overdueDays: l.overdueDays, classification: l.classification, status: l.status,
      }));
    case 'general-loan-reports/delinquency-report':
      return loans.filter((l) => l.overdueDays > 0)
        .sort((a, b) => b.overdueDays - a.overdueDays)
        .map((l) => ({ loanNo: l.loanNo, member: l.memberName, overdueDays: l.overdueDays, balance: l.balance, classification: l.classification }));
    case 'general-loan-reports/loan-status-report': {
      const map = new Map<string, { count: number; balance: number }>();
      loans.forEach((l) => {
        const e = map.get(l.status) ?? { count: 0, balance: 0 };
        e.count += 1; e.balance += l.balance; map.set(l.status, e);
      });
      return [...map.entries()].map(([status, v]) => ({ status, ...v }));
    }
    case 'general-loan-reports/aging-report':
    case 'general-loan-reports/par/dashboard': {
      const outstanding = loans.reduce((s, l) => s + l.balance, 0) || 1;
      return BUCKETS.map(([bucket, lo, hi]) => {
        const inB = loans.filter((l) => { const d = l.overdueDays || 0; return d >= lo && d <= hi; });
        const balance = inB.reduce((s, l) => s + l.balance, 0);
        return { bucket, count: inB.length, balance, parPct: Math.round((balance / outstanding) * 10000) / 100 };
      });
    }
    case 'general-loan-reports/loan-loss-reserve-report': {
      const rates: Record<string, number> = { Pass: 0.01, Watch: 0.03, Substandard: 0.2, Doubtful: 0.5, Loss: 1 };
      const map = new Map<string, { count: number; outstanding: number }>();
      loans.forEach((l) => {
        const c = l.classification || 'Pass';
        const e = map.get(c) ?? { count: 0, outstanding: 0 };
        e.count += 1; e.outstanding += l.balance; map.set(c, e);
      });
      return [...map.entries()].map(([classification, v]) => {
        const rate = rates[classification] ?? 0.01;
        return { classification, ...v, ratePct: rate * 100, provision: Math.round(v.outstanding * rate * 100) / 100 };
      });
    }
    case 'general-loan-reports/loan-disbursement-report':
      return loans.slice(0, 10).map((l) => ({ loanNo: l.loanNo, member: l.memberName, amount: l.amount, disbursedAt: '2026-09-01' }));
    case 'general-loan-reports/loan-book-analysis': {
      const map = new Map<string, { count: number; amount: number }>();
      loans.forEach((l) => {
        const e = map.get(l.productName) ?? { count: 0, amount: 0 };
        e.count += 1; e.amount += l.balance; map.set(l.productName, e);
      });
      return [...map.entries()].map(([value, v]) => ({ dimension: 'Product', value, ...v }));
    }
    case 'nbe-reports/loan-distribution-by-gender': {
      const map = new Map<string, { count: number; amount: number }>();
      loans.forEach((l) => {
        const m = members.find((mm) => mm.id === l.memberId);
        const g = m?.gender === 'F' ? 'Female' : m?.gender === 'M' ? 'Male' : 'Unknown';
        const e = map.get(g) ?? { count: 0, amount: 0 };
        e.count += 1; e.amount += l.amount; map.set(g, e);
      });
      return [...map.entries()].map(([gender, v]) => ({ gender, ...v }));
    }
    case 'nbe-reports/top-borrowing-groups':
      return loans.filter((l) => l.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 10)
        .map((l) => ({ group: l.memberName, accounts: 1, balance: l.balance }));
    case 'transaction-report/deposit':
    case 'transaction-report/withdrawal': {
      const type = key.endsWith('deposit') ? 'Deposit' : 'Withdrawal';
      return savingsTransactions.filter((t) => t.type === type)
        .map((t) => ({ date: t.date, member: memberName(t.memberId), amount: t.amount, channel: t.channel ?? '—', teller: t.teller ?? '—' }));
    }
    case 'transaction-report/deposit-mobilization': {
      const map = new Map<string, { count: number; amount: number }>();
      savingsTransactions.filter((t) => t.type === 'Deposit').forEach((t) => {
        const k = t.teller ?? 'Unknown';
        const e = map.get(k) ?? { count: 0, amount: 0 };
        e.count += 1; e.amount += t.amount; map.set(k, e);
      });
      return [...map.entries()].map(([teller, v]) => ({ teller, ...v }));
    }
    case 'customer-report':
      return members.map((m) => ({
        memberNo: m.memberNo, name: m.fullName, gender: m.gender, phone: m.phone,
        status: m.status, savingsBalance: m.savingsBalance, shareBalance: m.shareBalance,
      }));
    case 'account-report':
      return members.slice(0, 15).map((m) => ({
        member: m.fullName, accountNo: `SAV-${m.memberNo}`, type: m.gender === 'F' ? 'Savings' : 'Savings',
        balance: m.savingsBalance, status: 'Active',
      }));
    case 'share-report/share-collection-sheet':
      return shareAccounts.map((s) => ({ member: memberName(s.memberId), shares: s.shareCount ?? 0, amount: 0 }));
    case 'head-office-reports/fixed-asset-management':
      return assets.map((a) => ({ code: a.code, name: a.name, cost: a.value, netBook: a.value }));
    case 'head-office-reports/customers-report': {
      const map = new Map<string, number>();
      members.forEach((m) => map.set(m.status, (map.get(m.status) ?? 0) + 1));
      return [...map.entries()].map(([status, count]) => ({ office: 'Head Office', status, count }));
    }
    case 'head-office-reports/accounts-report':
      return members.slice(0, 10).map((m) => ({ office: 'Head Office', count: 1, balance: m.savingsBalance }));
    case 'head-office-reports/loan':
      return loans.slice(0, 10).map((l) => ({ office: 'Head Office', count: 1, balance: l.balance }));
    case 'head-office-finance/income-statement':
    case 'head-office-finance/profit-loss': {
      const income = glAccounts.filter((a) => a.category === 'Income').reduce((s, a) => s + Math.abs(a.balance), 0);
      const expense = glAccounts.filter((a) => a.category === 'Expense').reduce((s, a) => s + Math.abs(a.balance), 0);
      return [
        { line: 'Total Income', amount: income },
        { line: 'Total Expenses', amount: expense },
        { line: 'Net Surplus / (Deficit)', amount: income - expense },
      ];
    }
    case 'head-office-finance/cash-position': {
      const cash = glAccounts.find((a) => a.code === '1000');
      const bank = glAccounts.find((a) => a.code === '1100');
      return [
        { account: 'Cash on Hand', balance: cash?.balance ?? 0 },
        { account: 'Bank', balance: bank?.balance ?? 0 },
      ];
    }
    case 'head-office-finance/cashflow':
      return [
        { section: 'Operating', line: 'Net cash from operations', amount: 420000 },
        { section: 'Investing', line: 'Capital expenditure', amount: -120000 },
        { section: 'Financing', line: 'Member deposits', amount: 680000 },
      ];
    case 'aml-reports/dashboard':
      return [
        { pattern: 'Structuring', alerts: 4, cases: 1, amount: 320000 },
        { pattern: 'Rapid transactions', alerts: 3, cases: 0, amount: 180000 },
        { pattern: 'High value', alerts: 6, cases: 2, amount: 1250000 },
      ];
    case 'aml-reports/case-details':
      return [
        { caseNo: 'AML-2026-001', pattern: 'High value', member: 'Tigist Fikre', amount: 538000, status: 'Open' },
        { caseNo: 'AML-2026-002', pattern: 'Structuring', member: 'Samuel Worku', amount: 270000, status: 'Under Review' },
      ];
    case 'mobile-banking-reports':
      return [
        { metric: 'Active users', count: 184, amount: 0 },
        { metric: 'Mobile deposits', count: 320, amount: 486000 },
      ];
    case 'transaction-report/deposit-collection-sheet-customer': {
      const map = new Map<string, { count: number; amount: number }>();
      savingsTransactions.filter((t) => t.type === 'Deposit').forEach((t) => {
        const k = memberName(t.memberId);
        const e = map.get(k) ?? { count: 0, amount: 0 };
        e.count += 1; e.amount += t.amount; map.set(k, e);
      });
      return [...map.entries()].map(([member, v]) => ({ member, ...v }));
    }
    case 'share-report/movement':
      return shareTransfers.map((t) => ({
        date: t.date, member: `${t.fromMember} → ${t.toMember}`, shares: t.shares, amount: t.value,
      }));
    case 'general-loan-reports/loan-collection-sheet':
      return loans.map((l) => ({
        date: l.disbursedAt ?? '', loanNo: l.loanNo,
        principal: l.principalPaid ?? 0, interest: l.interestPaid ?? 0,
        total: (l.principalPaid ?? 0) + (l.interestPaid ?? 0),
      }));
    case 'general-loan-reports/par/historical':
    case 'general-loan-reports/par/trends': {
      const outstanding = loans.reduce((s, l) => s + l.balance, 0) || 1;
      const overdue = loans.filter((l) => l.overdueDays > 0).reduce((s, l) => s + l.balance, 0);
      const parPct = Math.round((overdue / outstanding) * 10000) / 100;
      if (key.endsWith('trends')) return [{ period: '2026-09', balance: overdue, parPct }];
      return ['2026-07', '2026-08', '2026-09'].map((date) => ({ date, balance: overdue, parPct }));
    }
    case 'head-office-reports/difference-tracker-report': {
      const journalNet = new Map<string, number>();
      glAccounts.slice(0, 8).forEach((a, i) => journalNet.set(a.code, (i % 3 === 0 ? a.balance : 0)));
      return glAccounts
        .map((a) => ({ expected: a.balance, actual: journalNet.get(a.code) ?? 0 }))
        .filter((r) => r.expected !== r.actual)
        .map((r) => ({ reference: `GL ${r.expected}`, expected: r.expected, actual: r.actual, difference: r.expected - r.actual }));
    }
    case 'head-office-finance/cashflow': {
      const income = glAccounts.filter((a) => a.category === 'Income').reduce((s, a) => s + Math.abs(a.balance), 0);
      const expense = glAccounts.filter((a) => a.category === 'Expense').reduce((s, a) => s + Math.abs(a.balance), 0);
      const assets = glAccounts.filter((a) => a.category === 'Asset').reduce((s, a) => s + a.balance, 0);
      const fin = glAccounts.filter((a) => a.category === 'Liability' || a.category === 'Equity').reduce((s, a) => s + a.balance, 0);
      return [
        { section: 'Operating', line: 'Net income (income - expenses)', amount: income - expense },
        { section: 'Investing', line: 'Net asset movement', amount: assets },
        { section: 'Financing', line: 'Liabilities & equity', amount: fin },
      ];
    }
    case 'head-office-finance/cash-position':
      return glAccounts.filter((a) => a.code.startsWith('10') || a.code.startsWith('11'))
        .map((a) => ({ account: `${a.code} ${a.name}`, balance: a.balance }));
    case 'account-report/overdraft':
      return savingsAccounts.filter((a) => a.balance < 0).map((a) => ({ accountNo: a.accountNo, limit: 0, balance: a.balance }));
    case 'account-report/overdraft-usage':
      return savingsAccounts.filter((a) => a.balance < 0).map((a) => ({ accountNo: a.accountNo, balance: a.balance, limit: Math.abs(a.balance), usagePct: 100 }));
    default:
      return [];
  }
}

export function runReport(key: string, params: Record<string, string>): ReportResult {
  const d = reportCatalog.flatMap((c) => c.reports).find((r) => r.key === key);
  if (!d) throw new Error('Unknown report: ' + key);
  const rows = runRows(key);
  return {
    key, name: d.name, columns: d.columns, rows, total: rows.length,
    generatedAt: new Date().toISOString(), params, summary: { rows: rows.length },
  };
}

export const reportFrameworkHandlers = [
  http.get('/api/reports/catalog', () => {
    const total = reportCatalog.reduce((s, c) => s + c.reports.length, 0);
    return HttpResponse.json({ total, categories: reportCatalog });
  }),
  http.get('/api/reports/run', ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get('key') ?? '';
    const params: Record<string, string> = {};
    url.searchParams.forEach((v, k) => { if (k !== 'key') params[k] = v; });
    try {
      return HttpResponse.json(runReport(key, params));
    } catch {
      return HttpResponse.json({ error: 'Unknown report: ' + key }, { status: 400 });
    }
  }),
];
