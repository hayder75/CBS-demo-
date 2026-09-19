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
  status?: 'Pending' | 'Verified';
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
  payStatus?: string;
  auditedStatus?: 'Unaudited' | 'Audited' | 'Discrepant';
  auditedBy?: string;
  auditedAt?: string;
  auditNote?: string;
  paymentMode?: string;
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
  purpose?: string;
  graceMonths?: number;
  repaymentAccountId?: number;
  reserveAccountId?: number;
}

export interface GLAccount {
  id: string;
  code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  balance: number;
  classId?: string;
  parentId?: string;
  side?: 'DEBIT' | 'CREDIT';
  allowDebit?: boolean;
  allowCredit?: boolean;
  currencyCode?: string;
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
  documentNo?: string;
  documentAttachment?: string;
  registrationDate?: string;
  custodian?: string;
  insuranceCompany?: string;
  description: string;
  valuation: number;
  forcedSaleValue: number;
  discountPct: number;
  loanId?: string;
  loanRef?: string;
  insuranceExpiry?: string;
  notes?: string;
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

// ============================================================
// Franc Core Banking parity types
// ============================================================

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  status: 'Pending' | 'Verified' | 'Inactive' | 'Closed';
  createdAt: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  notesLabel: string;
  centsLabel: string;
  exchangeRate: number;
  status: 'Pending' | 'Verified';
}

export interface PaymentMode {
  id: string;
  code: string;
  name: string;
  paymentType: 'CASH' | 'NON_CASH';
  description: string;
  status: 'Pending' | 'Verified';
}

export interface Vault {
  id: string;
  code: string;
  name: string;
  location: string;
  type: 'BRANCH' | 'HEAD' | 'BANK';
  status: 'Pending' | 'Verified';
}

export interface SavingsAccount {
  id: string;
  accountNo: string;
  memberId: string;
  productId: string;
  accountType: string;
  openedDate: string;
  balance: number;
  status: 'Pending' | 'Active' | 'Dormant' | 'Closed';
  currencyId: string;
  branchId: string;
}

export interface Signatory {
  id: string;
  accountId: string;
  memberId: string;
  primary: boolean;
}

export interface ShareCategory {
  id: string;
  code: string;
  name: string;
  totalShares: number;
  nominalPrice: number;
  sharesForSale: number;
  minPerCustomer: number;
  maxPerCustomer: number;
  paymentAgreementMonths: number;
  status: 'Pending' | 'Verified';
}

export interface ShareAccount {
  id: string;
  memberId: string;
  categoryId: string;
  savingAccountId: string;
  shareCount: number;
  description: string;
  status: 'Pending' | 'Verified';
}

export interface ShareRequest {
  id: string;
  shareAccountId: string;
  requestType: 'UPGRADE' | 'DOWNGRADE';
  shareCount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Charge {
  id: string;
  code: string;
  name: string;
  serviceType: string;
  glAccountId: string;
  calcType: 'Flat' | 'Fixed' | 'Percentile';
  amount: number;
  applyPenalty: boolean;
  status: 'Pending' | 'Verified';
}

export interface FundReservation {
  id: string;
  accountId: string;
  memberId: string;
  amount: number;
  reason: string;
  reservedAt: string;
  reservedBy: string;
  status: 'Active' | 'Released';
}

export interface TransactionLimit {
  id: string;
  roleCode: string;
  txnType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  maxAmount: number;
}

export interface LoanCategory {
  id: string;
  name: string;
  description: string;
  status: 'Pending' | 'Verified';
}

export interface LoanGroup {
  id: string;
  code: string;
  name: string;
  maxMembers: number;
  status: 'Pending' | 'Verified';
}

export interface LoanGroupMember {
  id: string;
  groupId: string;
  memberId: string;
  amount: number;
  installments: number;
  graceMonths: number;
}

export interface CreditCommittee {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  status: 'Pending' | 'Verified';
}

export interface CommitteeMember {
  id: string;
  committeeId: string;
  userId: string;
  username: string;
}

export interface BatchJob {
  id: string;
  jobType: string;
  name: string;
  status: 'Idle' | 'Running' | 'Done' | 'Failed';
  lastRunAt: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  value: number;
  depreciationRate: number;
  dprLink: string;
  glLink: string;
  branch: string;
  status: string;
}

export interface GlClass {
  id: string;
  name: string;
  status: 'Pending' | 'Verified';
}

export interface GlLeaf {
  id: string;
  code: string;
  name: string;
  category: string;
  balance: number;
  classId: string;
  parentId: string;
  side: 'DEBIT' | 'CREDIT';
  allowDebit: boolean;
  allowCredit: boolean;
  currencyCode: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  kind: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'ADJUSTMENT' | 'BRANCH_CLAIM' | 'MASS_TRANSFER' | 'REVERSAL';
  memberId: string;
  accountId: string;
  fromRef: string;
  toRef: string;
  amount: number;
  paymentModeId: string;
  description: string;
  status: 'Pending' | 'Authorized' | 'Rejected' | 'Reversed';
  createdBy: string;
  createdAt: string;
  authorizedBy: string;
  authorizedAt: string;
  reversalOf: string;
}

export interface DailyOperation {
  id: string;
  opDate: string;
  branchId: string;
  vaultId: string;
  status: 'Open' | 'Closed';
  openedBy: string;
  openedAt: string;
  closedBy: string;
  closedAt: string;
}

export interface AuditLogEntry {
  id: string;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  occurredAt: string;
}

export type AuditStatus = 'Unaudited' | 'Audited' | 'Discrepant';

export interface LoanReportRow {
  bucket: string;
  count: number;
  balance: number;
}

// ============================================================
// Phase 1 parity modules: Day Control / TFS / Membership / GA
// ============================================================

export type DayStatus = 'Open' | 'EOD Running' | 'EOD Completed' | 'Closed';

export interface BranchCob {
  id: string;
  branchId: string;
  branch: string;
  businessDate: string;
  status: 'Open' | 'Closed';
  closedBy?: string;
  closedAt?: string;
}

export type EodStepStatus = 'Pending' | 'Running' | 'Done' | 'Failed' | 'Skipped';

export interface EodStep {
  key: string;
  name: string;
  status: EodStepStatus;
  processed?: number;
  message?: string;
}

export interface EodRun {
  id: string;
  businessDate: string;
  status: 'Running' | 'Completed' | 'Failed';
  startedAt: string;
  completedAt?: string;
  startedBy: string;
  steps: EodStep[];
}

export interface DayControlState {
  businessDate: string;
  nextBusinessDate: string;
  status: DayStatus;
  lastEodDate?: string;
  eodRuns: EodRun[];
  branches: BranchCob[];
}

export interface TermDeposit {
  id: string;
  accountNo: string;
  memberId: string;
  memberName: string;
  productId: string;
  productName: string;
  principal: number;
  ratePct: number;
  termMonths: number;
  startDate: string;
  maturityDate: string;
  interestAccrued: number;
  maturityValue: number;
  penaltyPct: number;
  status: 'Active' | 'Matured' | 'Broken';
  linkedAccountId?: string;
  brokenAt?: string;
  brokenBy?: string;
}

export interface MembershipApplication {
  id: string;
  applicationNo: string;
  applicantType: 'Individual' | 'Entity';
  fullName: string;
  faydaId?: string;
  phone: string;
  email?: string;
  employer?: string;
  branch: string;
  shareProductId: string;
  shareCount: number;
  compulsoryProductId?: string;
  entranceFee: number;
  registrationFee: number;
  paymentStatus: 'Unpaid' | 'Paid';
  channel: 'Staff' | 'Portal';
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  rejectReason?: string;
  createdMemberId?: string;
  createdShareAccountId?: string;
}

export interface GaResolution {
  id: string;
  ref: string;
  year: number;
  totalSurplus: number;
  dividendPct: number;
  reservePct: number;
  distributable: number;
  dividendPerShare: number;
  eligibleMembers: number;
  totalDividend: number;
  totalReserve: number;
  status: 'Draft' | 'Approved' | 'Executed' | 'Rejected';
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  note?: string;
}

// ============================================================
// Phase 3 parity modules
// ============================================================

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  glAccountCode: string;
  status: 'Pending' | 'Verified';
}

export interface ExpenseEntry {
  id: string;
  date: string;
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  paymentMode: string;
  glAccountCode: string;
  postedBy: string;
  status: 'Posted' | 'Reversed';
}

export interface BankAccount {
  id: string;
  code: string;
  bankName: string;
  accountNo: string;
  branch: string;
  currencyCode: string;
  bookBalance: number;
  status: 'Active' | 'Closed';
}

export type BankTxnReconStatus = 'Unmatched' | 'Matched' | 'Excluded';

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  ref: string;
  description: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  reconStatus: BankTxnReconStatus;
}

export interface BankReconSession {
  id: string;
  bankAccountId: string;
  bankAccountLabel: string;
  statementDate: string;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  status: 'Open' | 'Completed';
  matchedCount: number;
  unmatchedCount: number;
  startedBy: string;
  startedAt: string;
  completedAt?: string;
}

export interface GlPostingRule {
  id: string;
  event: string;
  description: string;
  productType: 'Savings' | 'Loan' | 'Share' | 'Fee' | 'Treasury' | 'Expense';
  debitAccountCode: string;
  creditAccountCode: string;
  status: 'Active' | 'Inactive';
}

export interface FeeWaiver {
  id: string;
  memberId: string;
  memberName: string;
  chargeCode: string;
  chargeName: string;
  dateFrom: string;
  dateTo: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  approvedBy?: string;
  requestedAt: string;
  decidedAt?: string;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  channel: 'Email' | 'SMS';
  event: string;
  subject?: string;
  body: string;
  enabled: boolean;
  updatedAt: string;
}

export interface GatewaySettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  smsProvider: string;
  smsSenderId: string;
  updatedAt: string;
}

// ============================================================
// Phase 4 parity modules
// ============================================================

export interface LoanRestructure {
  id: string;
  loanId: string;
  loanNo: string;
  memberName: string;
  oldTermMonths: number;
  newTermMonths: number;
  oldRatePct: number;
  newRatePct: number;
  outstanding: number;
  reason: string;
  fee: number;
  status: 'Pending' | 'Approved' | 'Executed' | 'Rejected';
  requestedBy: string;
  approvedBy?: string;
  requestedAt: string;
}

export interface LoanWriteOff {
  id: string;
  loanId: string;
  loanNo: string;
  memberName: string;
  balance: number;
  type: 'Partial' | 'Full';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  approvedBy?: string;
  requestedAt: string;
}

export interface LoanRecovery {
  id: string;
  loanId: string;
  loanNo: string;
  memberName: string;
  date: string;
  amount: number;
  source: 'Cash' | 'Savings';
  recordedBy: string;
}

export interface ProvisionPolicyRow {
  id: string;
  classification: 'Pass' | 'Special Mention' | 'Substandard' | 'Doubtful' | 'Loss';
  provisionPct: number;
}

export interface ProvisionRun {
  id: string;
  businessDate: string;
  loansProcessed: number;
  totalProvision: number;
  runAt: string;
  runBy: string;
}

export interface LoanAutoDebitRow {
  id: string;
  loanNo: string;
  memberName: string;
  installment: number;
  savingsBalance: number;
  status: 'Scheduled' | 'Debited' | 'Insufficient' | 'Skipped';
}

export interface LiquidityRow {
  label: string;
  value: number;
  requirement: number;
  status: 'Adequate' | 'Below';
}

export interface LargeExposure {
  id: string;
  memberId: string;
  memberName: string;
  loanNo: string;
  facility: number;
  exposure: number;
  exposurePct: number;
  status: 'Within' | 'Breach';
}

export interface ProfitAllocationRow {
  label: string;
  pct: number;
  amount: number;
}

export interface CompliancePolicy {
  liquidityMinPct: number;
  exposureMaxPct: number;
  updatedAt: string;
}

export interface CashFlowRow {
  label: string;
  inflow: number;
  outflow: number;
}

export interface BackupRecord {
  id: string;
  fileName: string;
  sizeKb: number;
  createdAt: string;
  createdBy: string;
  kind: 'Manual' | 'Scheduled';
}