import type {
  Member,
  SavingsProduct,
  SavingsTransaction,
  LoanProduct,
  Loan,
  GLAccount,
  JournalEntry,
  CheckOffBatch,
  Collateral,
  ShareTransfer,
  DividendRun,
  Till,
  CashMovement,
  PettyCashEntry,
  ApprovalItem,
  Notification,
  Kpi,
  User,
} from '../types';

export const users: User[] = [
  { id: 'u1', username: 'admin', name: 'Sisay Worku', role: 'ADMIN', title: 'System Administrator', branch: 'Head Office', lastLogin: '2026-09-08T08:12:00' },
  { id: 'u2', username: 'manager', name: 'Tigist Fikre', role: 'MANAGER', title: 'General Manager', branch: 'Head Office', lastLogin: '2026-09-08T08:45:00' },
  { id: 'u3', username: 'teller', name: 'Kaleab Desta', role: 'TELLER', title: 'Senior Teller', branch: 'Bole Branch', lastLogin: '2026-09-08T08:30:00' },
  { id: 'u4', username: 'teller2', name: 'Rahel Abebe', role: 'TELLER', title: 'Teller', branch: 'Bole Branch', lastLogin: '2026-09-07T16:55:00' },
  { id: 'u5', username: 'credit', name: 'Biruk Kebede', role: 'CREDIT_OFFICER', title: 'Senior Credit Officer', branch: 'Head Office', lastLogin: '2026-09-08T09:02:00' },
  { id: 'u6', username: 'accountant', name: 'Marta Demissie', role: 'ACCOUNTANT', title: 'Chief Accountant', branch: 'Head Office', lastLogin: '2026-09-08T07:58:00' },
  { id: 'u7', username: 'auditor', name: 'Gizachew Tulu', role: 'AUDITOR', title: 'Internal Auditor', branch: 'Head Office', lastLogin: '2026-09-06T11:20:00' },
];

const names = [
  ['Abebe Bekele', 'M'], ['Meseret Alemu', 'F'], ['Dawit Tesfaye', 'M'],
  ['Hanna Girma', 'F'], ['Yonas Tadesse', 'M'], ['Selamawit Haile', 'F'],
  ['Samuel Worku', 'M'], ['Frehiwot Negash', 'F'], ['Natnael Mekonnen', 'M'],
  ['Liya Getachew', 'F'], ['Henok Assefa', 'M'], ['Tigist Fikre', 'F'],
  ['Elias Mulugeta', 'M'], ['Bethlehem Admassu', 'F'], ['Gizachew Tulu', 'M'],
  ['Rahel Abebe', 'F'], ['Mekdes Tadesse', 'F'], ['Robel Hailemariam', 'M'],
  ['Selam Teshome', 'F'], ['Yared Bekele', 'M'],
];

const employers = [
  'Ethiopian Airlines', 'Commercial Bank of Ethiopia', 'Addis Ababa University',
  'Ethio Telecom', 'Ministry of Finance', 'Dashen Bank', 'Ministry of Education',
  'National Bank of Ethiopia', 'EEP (Ethiopian Electric Power)', 'Addis Ababa City Administration',
];
const occupations = [
  'Teacher', 'Banker', 'Engineer', 'Nurse', 'Civil Servant', 'Accountant',
  'Driver', 'Aircraft Technician', 'IT Specialist', 'Lecturer', 'Administrator', 'Pharmacist',
];
const kebeles = ['Bole 01', 'Kirkos 03', 'Yeka 08', 'Arada 02', 'Nifas Silk-Lafto 09', 'Kolfe Keranio 11', 'Gulele 05', 'Lideta 06', 'Akaki Kality 14', 'Addis Ketema 04'];

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function makeMember(i: number, extra?: Partial<Member>): Member {
  const [fullName, gender] = names[i];
  const joinYear = 2015 + Math.floor(i / 4);
  const years = 2026 - joinYear;
  const shareBalance = years * 24 * 100 + rnd(0, 2400);
  const savingsBalance = years * 12000 + rnd(0, 60000);
  const loanOutstanding = i % 3 === 0 ? rnd(20000, 240000) : i % 5 === 0 ? rnd(5000, 18000) : 0;
  return {
    id: `m${i + 1}`,
    memberNo: `MEM-${String(2026 - joinYear).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
    fullName,
    gender: gender as 'M' | 'F',
    birthDate: `${1970 + rnd(5, 30)}-${String(rnd(1, 12)).padStart(2, '0')}-${String(rnd(1, 28)).padStart(2, '0')}`,
    phone: `+251 91${rnd(0, 9)} ${rnd(100, 999)} ${rnd(100, 999)}`,
    email: `${fullName.toLowerCase().replace(/ /g, '.')}@gmail.com`,
    faydaId: `FAY-${String(rnd(1000000000, 9999999999))}`,
    kebele: pick(kebeles),
    woreda: `Woreda ${rnd(1, 15)}`,
    city: 'Addis Ababa',
    occupation: pick(occupations),
    employer: pick(employers),
    status: i % 7 === 3 ? 'Dormant' : i % 11 === 5 ? 'Suspended' : 'Active',
    joinDate: `${joinYear}-0${Math.floor(i / 4) + 1}-15`,
    photoColor: `#${((i * 137) % 0xffffff).toString(16).padStart(6, '0')}`,
    shareBalance,
    savingsBalance,
    loanOutstanding,
    nextOfKin: [
      { name: pick(names)[0], relation: i % 2 === 0 ? 'Spouse' : 'Sibling', phone: `+251 92${rnd(0, 9)} ${rnd(100, 999)} ${rnd(100, 999)}` },
    ],
    beneficiaries: [
      { name: pick(names)[0], relation: 'Spouse', percent: 60, phone: `+251 92${rnd(0, 9)} ${rnd(100, 999)} ${rnd(100, 999)}` },
      { name: pick(names)[0], relation: 'Child', percent: 40, phone: `+251 92${rnd(0, 9)} ${rnd(100, 999)} ${rnd(100, 999)}` },
    ],
    ...extra,
  };
}

export const members: Member[] = Array.from({ length: 20 }, (_, i) => makeMember(i));

export const savingsProducts: SavingsProduct[] = [
  { id: 'sp1', code: 'S-MAND', name: 'Mandatory Monthly Savings', type: 'Mandatory', interestRatePct: 5.0, minBalance: 1200 },
  { id: 'sp2', code: 'S-VOL', name: 'Voluntary Withdrawable Savings', type: 'Voluntary', interestRatePct: 6.0, minBalance: 0 },
  { id: 'sp3', code: 'S-HOL', name: 'Holiday / Target Savings', type: 'Holiday', interestRatePct: 6.5, minBalance: 0 },
  { id: 'sp4', code: 'S-FIX-12', name: 'Fixed-Term Deposit 12M', type: 'Fixed', interestRatePct: 8.0, minBalance: 5000 },
  { id: 'sp5', code: 'S-FIX-24', name: 'Fixed-Term Deposit 24M', type: 'Fixed', interestRatePct: 9.5, minBalance: 5000 },
];

export const savingsTransactions: SavingsTransaction[] = members.flatMap((m, idx) => {
  const base: SavingsTransaction[] = [];
  const months = ['2026-07-05', '2026-08-05', '2026-09-05'];
  months.forEach((date, mi) => {
    base.push({
      id: `st-${m.id}-${mi}-m`,
      memberId: m.id,
      productId: 'sp1',
      date,
      type: 'Deposit',
      amount: 1200,
      teller: 'Kaleab Desta',
      channel: 'Check-Off',
    });
  });
  if (idx % 3 === 0) {
    base.push({
      id: `st-${m.id}-v`,
      memberId: m.id,
      productId: 'sp2',
      date: '2026-08-18',
      type: 'Deposit',
      amount: rnd(500, 8000),
      teller: 'Rahel Abebe',
      channel: 'Cash',
    });
  }
  if (idx % 5 === 1) {
    base.push({
      id: `st-${m.id}-i`,
      memberId: m.id,
      productId: 'sp2',
      date: '2026-08-31',
      type: 'Interest',
      amount: rnd(40, 420),
      teller: 'System',
      channel: 'Bank',
    });
  }
  return base;
});

export const loanProducts: LoanProduct[] = [
  { id: 'lp1', code: 'L-PER', name: 'Personal Loan', ratePct: 12.0, maxTermMonths: 36, maxAmount: 300000, schedule: 'Reducing Balance', processingFeePct: 1.0 },
  { id: 'lp2', code: 'L-EDU', name: 'Education Loan', ratePct: 10.5, maxTermMonths: 48, maxAmount: 200000, schedule: 'Reducing Balance', processingFeePct: 0.5 },
  { id: 'lp3', code: 'L-HOU', name: 'Home Improvement Loan', ratePct: 11.0, maxTermMonths: 60, maxAmount: 500000, schedule: 'Straight-Line', processingFeePct: 1.0 },
  { id: 'lp4', code: 'L-EME', name: 'Emergency Loan', ratePct: 13.0, maxTermMonths: 12, maxAmount: 80000, schedule: 'Flat Rate', processingFeePct: 0.5 },
  { id: 'lp5', code: 'L-VEH', name: 'Vehicle Loan', ratePct: 11.5, maxTermMonths: 48, maxAmount: 900000, schedule: 'Reducing Balance', processingFeePct: 1.5 },
];

const loanDescriptions = [
  'University tuition for son', 'Home renovation', 'Emergency medical expense',
  'Toyota corolla used vehicle', 'Business capital for small shop', 'Wedding expenses',
  'Buying household furniture', 'Plot of land at Legetafo', 'Solar installation', 'Motorcycle purchase',
];
void loanDescriptions;

export const loans: Loan[] = [
  {
    id: 'l1', loanNo: 'LN-2026-001', memberId: 'm1', memberName: 'Abebe Bekele', productId: 'lp1', productName: 'Personal Loan',
    status: 'Disbursed', amount: 180000, disbursedAt: '2026-03-10', termMonths: 24, ratePct: 12, scheduleType: 'Reducing Balance',
    principalPaid: 46000, interestPaid: 16200, balance: 134000, overdueDays: 0, classification: 'Pass',
    guarantors: [{ memberId: 'm3', name: 'Dawit Tesfaye', exposure: 180000, pledgedDeposit: 60000, status: 'Active' }],
    collateralIds: ['c1'], aiScore: 78, aiPdPct: 4.2, aiGuidance: 'Approve as applied',
  },
  {
    id: 'l2', loanNo: 'LN-2026-014', memberId: 'm4', memberName: 'Hanna Girma', productId: 'lp2', productName: 'Education Loan',
    status: 'Partially Paid', amount: 95000, disbursedAt: '2025-09-20', termMonths: 36, ratePct: 10.5, scheduleType: 'Reducing Balance',
    principalPaid: 34000, interestPaid: 9800, balance: 61000, overdueDays: 12, classification: 'Special Mention',
    guarantors: [{ memberId: 'm5', name: 'Yonas Tadesse', exposure: 95000, pledgedDeposit: 30000, status: 'Active' }],
    collateralIds: [], aiScore: 55, aiPdPct: 14.6, aiGuidance: 'Reduce amount or add guarantor',
  },
  {
    id: 'l3', loanNo: 'LN-2026-027', memberId: 'm7', memberName: 'Samuel Worku', productId: 'lp3', productName: 'Home Improvement Loan',
    status: 'Disbursed', amount: 320000, disbursedAt: '2026-01-15', termMonths: 48, ratePct: 11, scheduleType: 'Straight-Line',
    principalPaid: 50000, interestPaid: 28500, balance: 270000, overdueDays: 0, classification: 'Pass',
    guarantors: [{ memberId: 'm2', name: 'Meseret Alemu', exposure: 320000, pledgedDeposit: 100000, status: 'Active' }],
    collateralIds: ['c2'], aiScore: 86, aiPdPct: 2.1, aiGuidance: 'Approve as applied',
  },
  {
    id: 'l4', loanNo: 'LN-2026-031', memberId: 'm9', memberName: 'Natnael Mekonnen', productId: 'lp4', productName: 'Emergency Loan',
    status: 'Under Appraisal', amount: 60000, disbursedAt: '', termMonths: 12, ratePct: 13, scheduleType: 'Flat Rate',
    principalPaid: 0, interestPaid: 0, balance: 0, overdueDays: 0, classification: 'Pass',
    guarantors: [], collateralIds: [], aiScore: 64, aiPdPct: 9.8, aiGuidance: 'Approve with reduced amount',
  },
  {
    id: 'l5', loanNo: 'LN-2026-038', memberId: 'm12', memberName: 'Tigist Fikre', productId: 'lp5', productName: 'Vehicle Loan',
    status: 'Disbursed', amount: 600000, disbursedAt: '2026-05-02', termMonths: 48, ratePct: 11.5, scheduleType: 'Reducing Balance',
    principalPaid: 62000, interestPaid: 29500, balance: 538000, overdueDays: 0, classification: 'Pass',
    guarantors: [{ memberId: 'm6', name: 'Selamawit Haile', exposure: 600000, pledgedDeposit: 150000, status: 'Active' }],
    collateralIds: ['c3'], aiScore: 81, aiPdPct: 3.4, aiGuidance: 'Approve as applied',
  },
  {
    id: 'l6', loanNo: 'LN-2025-088', memberId: 'm15', memberName: 'Gizachew Tulu', productId: 'lp1', productName: 'Personal Loan',
    status: 'Partially Paid', amount: 150000, disbursedAt: '2025-02-12', termMonths: 24, ratePct: 12, scheduleType: 'Reducing Balance',
    principalPaid: 92000, interestPaid: 21000, balance: 58000, overdueDays: 45, classification: 'Substandard',
    guarantors: [{ memberId: 'm8', name: 'Frehiwot Negash', exposure: 150000, pledgedDeposit: 40000, status: 'Active' }],
    collateralIds: [], aiScore: 38, aiPdPct: 27.5, aiGuidance: 'Add collateral; consider restructuring',
  },
  {
    id: 'l7', loanNo: 'LN-2026-045', memberId: 'm17', memberName: 'Mekdes Tadesse', productId: 'lp2', productName: 'Education Loan',
    status: 'Pending', amount: 120000, disbursedAt: '', termMonths: 36, ratePct: 10.5, scheduleType: 'Reducing Balance',
    principalPaid: 0, interestPaid: 0, balance: 0, overdueDays: 0, classification: 'Pass',
    guarantors: [], collateralIds: [], aiScore: 72, aiPdPct: 5.9, aiGuidance: 'Approve as applied',
  },
  {
    id: 'l8', loanNo: 'LN-2025-112', memberId: 'm19', memberName: 'Selam Teshome', productId: 'lp4', productName: 'Emergency Loan',
    status: 'Partially Paid', amount: 40000, disbursedAt: '2025-08-25', termMonths: 12, ratePct: 13, scheduleType: 'Flat Rate',
    principalPaid: 33000, interestPaid: 5200, balance: 7000, overdueDays: 90, classification: 'Doubtful',
    guarantors: [], collateralIds: [], aiScore: 22, aiPdPct: 41.0, aiGuidance: 'Refer to recovery team',
  },
  {
    id: 'l9', loanNo: 'LN-2026-050', memberId: 'm20', memberName: 'Yared Bekele', productId: 'lp1', productName: 'Personal Loan',
    status: 'Approved', amount: 85000, disbursedAt: '', termMonths: 24, ratePct: 12, scheduleType: 'Reducing Balance',
    principalPaid: 0, interestPaid: 0, balance: 0, overdueDays: 0, classification: 'Pass',
    guarantors: [{ memberId: 'm2', name: 'Meseret Alemu', exposure: 85000, pledgedDeposit: 50000, status: 'Active' }],
    collateralIds: [], aiScore: 88, aiPdPct: 1.7, aiGuidance: 'Approve as applied',
  },
];

export const glAccounts: GLAccount[] = [
  { id: 'a1', code: '1000', name: 'Cash on Hand', category: 'Asset', balance: 1245000 },
  { id: 'a2', code: '1100', name: 'Bank - CBE Current Account', category: 'Asset', balance: 8620000 },
  { id: 'a3', code: '1200', name: 'Member Savings - Mandatory', category: 'Liability', balance: -9240000 },
  { id: 'a4', code: '1201', name: 'Member Savings - Voluntary', category: 'Liability', balance: -6120000 },
  { id: 'a5', code: '1300', name: 'Member Share Capital', category: 'Equity', balance: -4820000 },
  { id: 'a6', code: '1400', name: 'Loan Portfolio - Outstanding', category: 'Asset', balance: 4860000 },
  { id: 'a7', code: '1500', name: 'Statutory Reserve', category: 'Equity', balance: -1560000 },
  { id: 'a8', code: '2000', name: 'Interest Income - Loans', category: 'Income', balance: -689000 },
  { id: 'a9', code: '2100', name: 'Processing Fees Income', category: 'Income', balance: -98000 },
  { id: 'a10', code: '3000', name: 'Staff Salaries', category: 'Expense', balance: 342000 },
  { id: 'a11', code: '3100', name: 'Office Rent', category: 'Expense', balance: 120000 },
  { id: 'a12', code: '3200', name: 'Utilities & Communication', category: 'Expense', balance: 46000 },
  { id: 'a13', code: '3300', name: 'Provision for Loan Losses', category: 'Expense', balance: 78000 },
];

export const journalEntries: JournalEntry[] = [
  { id: 'j1', date: '2026-09-05', ref: 'JRN-2026-0041', description: 'Monthly check-off collection - Ethiopian Airlines', accountCode: '1000', accountName: 'Cash on Hand', debit: 148000, credit: 0, postedBy: 'Marta Demissie' },
  { id: 'j2', date: '2026-09-05', ref: 'JRN-2026-0042', description: 'Monthly check-off collection - CBE', accountCode: '1200', accountName: 'Member Savings - Mandatory', debit: 0, credit: 118000, postedBy: 'Marta Demissie' },
  { id: 'j3', date: '2026-09-06', ref: 'JRN-2026-0043', description: 'Loan disbursement LN-2026-050', accountCode: '1400', accountName: 'Loan Portfolio - Outstanding', debit: 85000, credit: 0, postedBy: 'Marta Demissie' },
  { id: 'j4', date: '2026-09-06', ref: 'JRN-2026-0044', description: 'Loan disbursement funding', accountCode: '1000', accountName: 'Cash on Hand', debit: 0, credit: 85000, postedBy: 'Marta Demissie' },
  { id: 'j5', date: '2026-09-07', ref: 'JRN-2026-0045', description: 'Interest accrual - September', accountCode: '2000', accountName: 'Interest Income - Loans', debit: 0, credit: 24600, postedBy: 'Marta Demissie' },
  { id: 'j6', date: '2026-09-07', ref: 'JRN-2026-0046', description: 'Fixed deposit interest - Q3', accountCode: '3200', accountName: 'Utilities & Communication', debit: 12400, credit: 0, postedBy: 'Marta Demissie' },
  { id: 'j7', date: '2026-09-08', ref: 'JRN-2026-0047', description: 'Vault to bank transfer', accountCode: '1100', accountName: 'Bank - CBE Current Account', debit: 400000, credit: 0, postedBy: 'Marta Demissie' },
  { id: 'j8', date: '2026-09-08', ref: 'JRN-2026-0048', description: 'Vault to bank transfer', accountCode: '1000', accountName: 'Cash on Hand', debit: 0, credit: 400000, postedBy: 'Marta Demissie' },
];

export const checkOffBatches: CheckOffBatch[] = [
  { id: 'co1', employer: 'Ethiopian Airlines', month: 'Aug 2026', uploadedAt: '2026-09-05', rows: 148, matched: 145, unmatched: 3, expected: 148000, received: 146200, variance: -1800, status: 'Variance' },
  { id: 'co2', employer: 'Commercial Bank of Ethiopia', month: 'Aug 2026', uploadedAt: '2026-09-05', rows: 95, matched: 95, unmatched: 0, expected: 118000, received: 118000, variance: 0, status: 'Reconciled' },
  { id: 'co3', employer: 'Ethio Telecom', month: 'Aug 2026', uploadedAt: '2026-09-06', rows: 62, matched: 62, unmatched: 0, expected: 74000, received: 74000, variance: 0, status: 'Reconciled' },
  { id: 'co4', employer: 'Addis Ababa University', month: 'Aug 2026', uploadedAt: '2026-09-07', rows: 41, matched: 40, unmatched: 1, expected: 52000, received: 51000, variance: -1000, status: 'Variance' },
];

export const collateral: Collateral[] = [
  { id: 'c1', code: 'COL-001', type: 'Property Title Deed', owner: 'Abebe Bekele', description: 'Title deed - 2-bed house, Bole, 120 m²', valuation: 2400000, forcedSaleValue: 1680000, discountPct: 30, loanId: 'l1', loanRef: 'LN-2026-001', insuranceExpiry: '2027-03-10', status: 'Pledged' },
  { id: 'c2', code: 'COL-002', type: 'Property Title Deed', owner: 'Samuel Worku', description: 'Title deed - 3-bed house, Yeka, 180 m²', valuation: 3800000, forcedSaleValue: 2660000, discountPct: 30, loanId: 'l3', loanRef: 'LN-2026-027', insuranceExpiry: '2027-01-15', status: 'Pledged' },
  { id: 'c3', code: 'COL-003', type: 'Vehicle Ownership', owner: 'Tigist Fikre', description: 'Toyota Corolla 2022, Chassis TZ1234', valuation: 1450000, forcedSaleValue: 1160000, discountPct: 20, loanId: 'l5', loanRef: 'LN-2026-038', insuranceExpiry: '2027-05-02', status: 'Pledged' },
  { id: 'c4', code: 'COL-004', type: 'Share Certificate', owner: 'Meseret Alemu', description: 'Member share certificate - 2,400 shares', valuation: 240000, forcedSaleValue: 192000, discountPct: 20, loanId: 'l9', loanRef: 'LN-2026-050', status: 'Pending Release' },
  { id: 'c5', code: 'COL-005', type: 'Bank Guarantee', owner: 'Hanna Girma', description: 'Third-party guarantee - Dashen Bank', valuation: 120000, forcedSaleValue: 120000, discountPct: 0, loanId: 'l2', loanRef: 'LN-2026-014', insuranceExpiry: '2026-12-31', status: 'Pledged' },
];

export const shareTransfers: ShareTransfer[] = [
  { id: 't1', date: '2026-08-12', fromMember: 'Gizachew Tulu', toMember: 'Selam Teshome', shares: 1200, value: 120000, status: 'Approved' },
  { id: 't2', date: '2026-08-28', fromMember: 'Elias Mulugeta', toMember: 'Robel Hailemariam', shares: 800, value: 80000, status: 'Pending' },
  { id: 't3', date: '2026-09-02', fromMember: 'Bethlehem Admassu', toMember: 'Mekdes Tadesse', shares: 500, value: 50000, status: 'Pending' },
];

export const dividendRuns: DividendRun[] = [
  { id: 'd1', year: '2024', totalSurplus: 5200000, statutoryReserve: 780000, distributable: 4420000, eligibleMembers: 1250, dividendPerShare: 8.5, totalDistribution: 4410000, status: 'Credited' },
  { id: 'd2', year: '2025', totalSurplus: 5800000, statutoryReserve: 870000, distributable: 4930000, eligibleMembers: 1310, dividendPerShare: 9.0, totalDistribution: 4920000, status: 'Credited' },
  { id: 'd3', year: '2026', totalSurplus: 0, statutoryReserve: 0, distributable: 0, eligibleMembers: 0, dividendPerShare: 0, totalDistribution: 0, status: 'Proposed' },
];

export const tills: Till[] = [
  { id: 't1', teller: 'Kaleab Desta', opening: 500000, deposits: 482000, withdrawals: 296000, closing: 686000, expected: 686000, variance: 0, status: 'Open' },
  { id: 't2', teller: 'Rahel Abebe', opening: 400000, deposits: 310500, withdrawals: 245000, closing: 465500, expected: 465000, variance: 500, status: 'Discrepancy' },
];

export const cashMovements: CashMovement[] = [
  { id: 'cm1', date: '2026-09-08', from: 'Vault', to: 'Kaleab Desta (Teller 1)', amount: 200000, initiatedBy: 'Kaleab Desta', approvedBy: 'Tigist Fikre', status: 'Approved', type: 'Vault to Teller' },
  { id: 'cm2', date: '2026-09-08', from: 'Kaleab Desta (Teller 1)', to: 'Vault', amount: 86000, initiatedBy: 'Kaleab Desta', status: 'Pending', type: 'Teller to Vault' },
  { id: 'cm3', date: '2026-09-07', from: 'Vault', to: 'CBE Main Branch', amount: 400000, initiatedBy: 'Marta Demissie', approvedBy: 'Tigist Fikre', status: 'Approved', type: 'Vault to Bank' },
];

export const pettyCashEntries: PettyCashEntry[] = [
  { id: 'pc1', date: '2026-09-04', description: 'Office stationery', category: 'Office Supplies', amount: 1450, receiptNo: 'RC-8821', status: 'Open' },
  { id: 'pc2', date: '2026-09-06', description: 'Fuel for generator', category: 'Fuel', amount: 3200, receiptNo: 'RC-8830', status: 'Open' },
  { id: 'pc3', date: '2026-09-07', description: 'Coffee and refreshments', category: 'Hospitality', amount: 850, receiptNo: 'RC-8834', status: 'Reimbursed' },
];

export const approvals: ApprovalItem[] = [
  { id: 'ap1', type: 'Loan Approval', ref: 'LN-2026-050', summary: 'Personal Loan - Yared Bekele', amount: 85000, initiatedBy: 'Biruk Kebede', requestedAt: '2026-09-06T10:15:00', status: 'Pending' },
  { id: 'ap2', type: 'Loan Disbursement', ref: 'LN-2026-050', summary: 'Treasury disbursement authorization', amount: 85000, initiatedBy: 'Biruk Kebede', requestedAt: '2026-09-07T09:30:00', status: 'Pending' },
  { id: 'ap3', type: 'Collateral Release', ref: 'COL-004', summary: 'Release share certificate - Meseret Alemu', amount: 240000, initiatedBy: 'Biruk Kebede', requestedAt: '2026-09-07T14:05:00', status: 'Pending' },
  { id: 'ap4', type: 'Large Withdrawal', ref: 'WT-2026-118', summary: 'Voluntary savings withdrawal - Hanna Girma', amount: 45000, initiatedBy: 'Rahel Abebe', requestedAt: '2026-09-08T08:50:00', status: 'Pending' },
  { id: 'ap5', type: 'Journal Adjustment', ref: 'JRN-2026-0049', summary: 'Correction - mis-posted fixed deposit interest', amount: 12400, initiatedBy: 'Marta Demissie', requestedAt: '2026-09-08T09:10:00', status: 'Pending' },
  { id: 'ap6', type: 'Cash Movement', ref: 'CM-2026-023', summary: 'Teller to Vault transfer - Kaleab Desta', amount: 86000, initiatedBy: 'Kaleab Desta', requestedAt: '2026-09-08T11:20:00', status: 'Pending' },
];

export const notifications: Notification[] = [
  { id: 'n1', memberId: 'm1', memberName: 'Abebe Bekele', channel: 'SMS', type: 'Deposit', message: 'Your mandatory savings deposit of ETB 1,200 has been received.', sentAt: '2026-09-05T10:12:00' },
  { id: 'n2', memberId: 'm4', memberName: 'Hanna Girma', channel: 'SMS', type: 'Loan Repayment', message: 'Your loan repayment of ETB 3,540 is due in 3 days (LN-2026-014).', sentAt: '2026-09-05T09:00:00' },
  { id: 'n3', memberId: 'm7', memberName: 'Samuel Worku', channel: 'SMS', type: 'Deposit', message: 'Your voluntary savings deposit of ETB 5,000 has been received.', sentAt: '2026-09-06T13:40:00' },
  { id: 'n4', memberId: 'm9', memberName: 'Natnael Mekonnen', channel: 'SMS', type: 'Loan Approval', message: 'Your loan application LN-2026-031 is under appraisal by the credit committee.', sentAt: '2026-09-07T15:22:00' },
  { id: 'n5', memberId: 'm15', memberName: 'Gizachew Tulu', channel: 'SMS', type: 'Overdue Alert', message: 'Your loan LN-2025-088 has an overdue balance of ETB 8,400. Please contact the branch.', sentAt: '2026-09-08T08:00:00' },
  { id: 'n6', memberId: 'm20', memberName: 'Yared Bekele', channel: 'SMS', type: 'Check-Off', message: 'Your salary deduction of ETB 2,900 was received from your employer.', sentAt: '2026-09-05T11:05:00' },
];

export const kpi: Kpi = {
  totalMembers: 1428,
  activeMembers: 1305,
  newMembersThisMonth: 18,
  totalSavings: 15360000,
  totalDepositsThisMonth: 684000,
  loanPortfolio: 4860000,
  loanDisbursedThisMonth: 465000,
  overdueLoans: 36,
  parPct: 5.2,
  cashOnHand: 1245000,
  cashAtBank: 8620000,
  incomeThisMonth: 289000,
  expenseThisMonth: 176000,
  surplusThisMonth: 113000,
  membersGrowthPct: 8.4,
  savingsGrowthPct: 12.1,
  dividendPerShare: 9.0,
  approvalsPending: 6,
};

export const portfolioAtRisk = [
  { label: 'Pass', value: 92, color: '#52c41a' },
  { label: 'Special Mention', value: 3.4, color: '#faad14' },
  { label: 'Substandard', value: 2.6, color: '#fa8c16' },
  { label: 'Doubtful', value: 1.4, color: '#eb2f96' },
  { label: 'Loss', value: 0.6, color: '#f5222d' },
];

export const monthlySavingsTrend = [
  { month: 'Apr', deposits: 720, withdrawals: 410 },
  { month: 'May', deposits: 750, withdrawals: 385 },
  { month: 'Jun', deposits: 698, withdrawals: 428 },
  { month: 'Jul', deposits: 764, withdrawals: 402 },
  { month: 'Aug', deposits: 812, withdrawals: 465 },
  { month: 'Sep', deposits: 684, withdrawals: 388 },
];

export const loanProductMix = [
  { name: 'Personal', value: 38 },
  { name: 'Education', value: 21 },
  { name: 'Home Improvement', value: 19 },
  { name: 'Vehicle', value: 14 },
  { name: 'Emergency', value: 8 },
];