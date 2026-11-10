import type { ReactNode } from 'react';
import {
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  CheckSquareOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  CrownOutlined,
  DollarOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FundOutlined,
  GiftOutlined,
  IdcardOutlined,
  PartitionOutlined,
  PercentageOutlined,
  PrinterOutlined,
  ReconciliationOutlined,
  RobotOutlined,
  SearchOutlined,
  SettingOutlined,
  SlidersOutlined,
  SolutionOutlined,
  SwapOutlined,
  TeamOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import type { Role } from './types';

const ALL: Role[] = ['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'];
const OPS: Role[] = ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT'];
const CREDIT: Role[] = ['ADMIN', 'MANAGER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'];

export interface NavItem {
  path: string;
  key: string;
  icon: ReactNode;
  roles: Role[];
}

export interface NavModule {
  id: string;
  key: string;
  icon: ReactNode;
  roles: Role[];
  items: NavItem[];
}

export const navModules: NavModule[] = [
  {
    id: 'dashboard',
    key: 'nav.module.dashboard',
    icon: <AppstoreOutlined />,
    roles: ALL,
    items: [{ path: '/', key: 'nav.dashboard', icon: <AppstoreOutlined />, roles: ALL }],
  },
  {
    id: 'membership',
    key: 'nav.module.membership',
    icon: <TeamOutlined />,
    roles: ALL,
    items: [
      { path: '/members', key: 'nav.members', icon: <TeamOutlined />, roles: ALL },
      { path: '/membership-applications', key: 'nav.membership', icon: <IdcardOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER'] },
      { path: '/referrals', key: 'nav.referral', icon: <GiftOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER'] },
    ],
  },
  {
    id: 'accounts',
    key: 'nav.module.accounts',
    icon: <DollarOutlined />,
    roles: OPS,
    items: [
      { path: '/savings', key: 'nav.savings', icon: <DollarOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/term-deposits', key: 'nav.termDeposits', icon: <BankOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/cashops', key: 'nav.cashops', icon: <BankOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/registration', key: 'nav.registration', icon: <SolutionOutlined />, roles: OPS },
    ],
  },
  {
    id: 'shares',
    key: 'nav.module.shares',
    icon: <FundOutlined />,
    roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'],
    items: [{ path: '/shares', key: 'nav.shares', icon: <FundOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] }],
  },
  {
    id: 'loans',
    key: 'nav.module.loans',
    icon: <TransactionOutlined />,
    roles: ALL,
    items: [
      { path: '/loans', key: 'nav.loans', icon: <TransactionOutlined />, roles: ALL },
      { path: '/loan-decision', key: 'nav.loanDecision', icon: <RobotOutlined />, roles: CREDIT },
      { path: '/loan-lifecycle', key: 'nav.loanLifecycle', icon: <ClusterOutlined />, roles: CREDIT },
      { path: '/collateral', key: 'nav.collateral', icon: <FileProtectOutlined />, roles: CREDIT },
      { path: '/loan-admin', key: 'nav.loanAdmin', icon: <CrownOutlined />, roles: ['ADMIN', 'MANAGER', 'CREDIT_OFFICER'] },
      { path: '/loan-scoring-config', key: 'nav.loanScoringConfig', icon: <SlidersOutlined />, roles: ['ADMIN', 'MANAGER', 'CREDIT_OFFICER'] },
      { path: '/checkoff', key: 'nav.checkoff', icon: <SwapOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
    ],
  },
  {
    id: 'products',
    key: 'nav.module.products',
    icon: <PercentageOutlined />,
    roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
    items: [
      { path: '/products', key: 'nav.products', icon: <PercentageOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { path: '/fee-waivers', key: 'nav.feeWaivers', icon: <PercentageOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    id: 'finance',
    key: 'nav.module.finance',
    icon: <CalculatorOutlined />,
    roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'],
    items: [
      { path: '/accounting', key: 'nav.accounting', icon: <CalculatorOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/finance', key: 'nav.finance', icon: <CalculatorOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/expenses', key: 'nav.expenses', icon: <DollarOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/bank-reconciliation', key: 'nav.bankRecon', icon: <ReconciliationOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/gl-rules', key: 'nav.glRules', icon: <PartitionOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { path: '/general-assembly', key: 'nav.generalAssembly', icon: <FundOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    id: 'payments',
    key: 'nav.module.payments',
    icon: <SwapOutlined />,
    roles: OPS,
    items: [
      { path: '/payments', key: 'nav.payments', icon: <SwapOutlined />, roles: OPS },
      { path: '/approvals', key: 'nav.approvals', icon: <CheckSquareOutlined />, roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    id: 'auditing',
    key: 'nav.module.auditing',
    icon: <AuditOutlined />,
    roles: ['ADMIN', 'AUDITOR'],
    items: [
      { path: '/auditing', key: 'nav.auditing', icon: <AuditOutlined />, roles: ['ADMIN', 'AUDITOR'] },
      { path: '/compliance', key: 'nav.compliance', icon: <FileTextOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
    ],
  },
  {
    id: 'reports',
    key: 'nav.module.reports',
    icon: <BarChartOutlined />,
    roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'],
    items: [
      { path: '/reports', key: 'nav.reports', icon: <BarChartOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/printables', key: 'nav.printables', icon: <PrinterOutlined />, roles: ALL },
    ],
  },
  {
    id: 'admin',
    key: 'nav.module.admin',
    icon: <SettingOutlined />,
    roles: ['ADMIN', 'MANAGER'],
    items: [
      { path: '/admin', key: 'nav.admin', icon: <SettingOutlined />, roles: ['ADMIN', 'MANAGER'] },
      { path: '/day-control', key: 'nav.dayControl', icon: <CalculatorOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { path: '/notification-templates', key: 'nav.notificationTemplates', icon: <FileTextOutlined />, roles: ['ADMIN', 'MANAGER'] },
      { path: '/data-migration', key: 'nav.dataMigration', icon: <CloudServerOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'] },
      { path: '/system-ops', key: 'nav.systemOps', icon: <CloudServerOutlined />, roles: ['ADMIN'] },
    ],
  },
  {
    id: 'search',
    key: 'nav.module.search',
    icon: <SearchOutlined />,
    roles: ALL,
    items: [{ path: '/search', key: 'nav.search', icon: <SearchOutlined />, roles: ALL }],
  },
];

export const allNavItems: NavItem[] = navModules.flatMap((m) => m.items);

export function moduleForPath(pathname: string): NavModule | undefined {
  const items = [...allNavItems].sort((a, b) => b.path.length - a.path.length);
  const match = items.find(
    (p) => pathname === p.path || (p.path !== '/' && pathname.startsWith(p.path + '/')),
  );
  if (!match) return navModules[0];
  return navModules.find((m) => m.items.some((i) => i.path === match.path));
}
