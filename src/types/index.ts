export type Role =
  | 'ADMIN'
  | 'MANAGER'
  | 'TELLER'
  | 'CREDIT_OFFICER'
  | 'ACCOUNTANT'
  | 'AUDITOR';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  title: string;
  branch: string;
  lastLogin: string;
  token?: string;
}

export type MemberStatus =
  | 'Active'
  | 'Dormant'
  | 'Suspended'
  | 'Deceased'
  | 'Withdrawn';

export interface NextOfKin {
  name: string;
  relation: string;
  phone: string;
}

export interface Beneficiary {
  name: string;
  relation: string;
  percent: number;
  phone: string;
}

export interface Member {
  id: string;
  memberNo: string;
  fullName: string;
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
  email?: string;
  faydaId: string;
  kebele: string;
  woreda: string;
  city: string;
  occupation: string;
  employer?: string;
  status: MemberStatus;
  joinDate: string;
  photoColor?: string;
  shareBalance: number;
  savingsBalance: number;
  loanOutstanding: number;
  nextOfKin: NextOfKin[];
  beneficiaries: Beneficiary[];
}

export interface SavingsProduct {
  id: string;
  code: string;
  name: string;
  type: 'Mandatory' | 'Voluntary' | 'Holiday' | 'Fixed';
  interestRatePct: number;
  minBalance: number;
  noticePeriodDays?: number;
}

export interface SavingsTransaction {
  id: string;
  memberId: string;
  productId: string;
  date: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer In' | 'Transfer Out' | 'Interest' | 'Dividend';
  amount: number;
  teller: string;
  channel: 'Cash' | 'Check-Off' | 'Digital' | 'Bank';
}

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  ratePct: number;
  maxTermMonths: number;
  maxAmount: number;
  schedule: 'Reducing Balance' | 'Flat Rate' | 'Straight-Line';
  processingFeePct: number;
}

export type LoanStatus =
  | 'Pending'
  | 'Under Appraisal'
  | 'Approved'
  | 'Disbursed'
  | 'Partially Paid'
  | 'Fully Paid'
  | 'Restructured'
  | 'Write-Off';

export type LoanClass =
  | 'Pass'
  | 'Special Mention'
  | 'Substandard'
  | 'Doubtful'
  | 'Loss';

export interface Guarantor {
  memberId: string;
  name: string;
  exposure: number;
  pledgedDeposit: number;
  status: 'Active' | 'Released';
}

export interface LoanScheduleRow {
  period: number;
  dueDate: string;
  principal: number;
  interest: number;
  total: number;
  paid: number;
  balance: number;
}

export interface Loan {
  id: string;
  loanNo: string;
  memberId: string;
  memberName: string;
  productId: string;
  productName: string;
  status: LoanStatus;
  amount: number;
  disbursedAt: string;
  termMonths: number;
  ratePct: number;
  scheduleType: string;
  principalPaid: number;
  interestPaid: number;
  balance: number;
  overdueDays: number;
  classification: LoanClass;
  guarantors: Guarantor[];
  collateralIds: string[];
  aiScore?: number;
  aiPdPct?: number;
  aiGuidance?: string;
  nextDueDate?: string;
}

export interface GLAccount {
  id: string;
  code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  balance: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  description: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  postedBy: string;
}

export interface CheckOffBatch {
  id: string;
  employer: string;
  month: string;
  uploadedAt: string;
  rows: number;
  matched: number;
  unmatched: number;
  expected: number;
  received: number;
  variance: number;
  status: 'Reconciled' | 'Variance' | 'Pending';
}

export interface Collateral {
  id: string;
  code: string;
  type: string;
  owner: string;
  description: string;
  valuation: number;
  forcedSaleValue: number;
  discountPct: number;
  loanId?: string;
  loanRef?: string;
  insuranceExpiry?: string;
  status: 'Pledged' | 'Released' | 'Pending Release';
}

export interface ShareTransfer {
  id: string;
  date: string;
  fromMember: string;
  toMember: string;
  shares: number;
  value: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface DividendRun {
  id: string;
  year: string;
  totalSurplus: number;
  statutoryReserve: number;
  distributable: number;
  eligibleMembers: number;
  dividendPerShare: number;
  totalDistribution: number;
  status: 'Proposed' | 'Approved' | 'Credited' | 'Capitalized';
}

export interface Till {
  id: string;
  teller: string;
  opening: number;
  deposits: number;
  withdrawals: number;
  closing: number;
  expected: number;
  variance: number;
  status: 'Balanced' | 'Discrepancy' | 'Open';
}

export interface CashMovement {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  initiatedBy: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: 'Vault to Teller' | 'Teller to Vault' | 'Vault to Bank' | 'Petty Cash';
}

export interface PettyCashEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  receiptNo: string;
  status: 'Open' | 'Reimbursed';
}

export interface ApprovalItem {
  id: string;
  type: string;
  ref: string;
  summary: string;
  amount: number;
  initiatedBy: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Notification {
  id: string;
  memberId: string;
  memberName: string;
  channel: 'SMS' | 'Email';
  type: string;
  message: string;
  sentAt: string;
}

export interface Kpi {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalSavings: number;
  totalDepositsThisMonth: number;
  loanPortfolio: number;
  loanDisbursedThisMonth: number;
  overdueLoans: number;
  parPct: number;
  cashOnHand: number;
  cashAtBank: number;
  incomeThisMonth: number;
  expenseThisMonth: number;
  surplusThisMonth: number;
  membersGrowthPct: number;
  savingsGrowthPct: number;
  dividendPerShare?: number;
  approvalsPending: number;
}