import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './context/AuthContext';
import AppLayout from './layout/AppLayout';
import { MembersProvider } from './context/MembersContext';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const MemberDetail = lazy(() => import('./pages/MemberDetail'));
const Savings = lazy(() => import('./pages/Savings'));
const Loans = lazy(() => import('./pages/Loans'));
const Accounting = lazy(() => import('./pages/Accounting'));
const CheckOff = lazy(() => import('./pages/CheckOff'));
const Collateral = lazy(() => import('./pages/Collateral'));
const Shares = lazy(() => import('./pages/Shares'));
const CashOps = lazy(() => import('./pages/CashOps'));
const Reports = lazy(() => import('./pages/Reports'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Products = lazy(() => import('./pages/Products'));
const Registration = lazy(() => import('./pages/Registration'));
const Payments = lazy(() => import('./pages/Payments'));
const Admin = lazy(() => import('./pages/Admin'));
const Auditing = lazy(() => import('./pages/Auditing'));
const Finance = lazy(() => import('./pages/Finance'));
const DataMigration = lazy(() => import('./pages/DataMigration'));
const LoanAdmin = lazy(() => import('./pages/LoanAdmin'));
const DayControl = lazy(() => import('./pages/DayControl'));
const TermDeposits = lazy(() => import('./pages/TermDeposits'));
const MembershipApplications = lazy(() => import('./pages/MembershipApplications'));
const GeneralAssembly = lazy(() => import('./pages/GeneralAssembly'));
const Expenses = lazy(() => import('./pages/Expenses'));
const BankReconciliation = lazy(() => import('./pages/BankReconciliation'));
const GlPostingRules = lazy(() => import('./pages/GlPostingRules'));
const FeeWaivers = lazy(() => import('./pages/FeeWaivers'));
const NotificationTemplates = lazy(() => import('./pages/NotificationTemplates'));
const LoanLifecycle = lazy(() => import('./pages/LoanLifecycle'));
const Compliance = lazy(() => import('./pages/Compliance'));
const Printables = lazy(() => import('./pages/Printables'));
const SystemOps = lazy(() => import('./pages/SystemOps'));
const Referrals = lazy(() => import('./pages/Referrals'));
const MemberLifecycle = lazy(() => import('./pages/MemberLifecycle'));
const AuditTrail = lazy(() => import('./pages/AuditTrail'));
const Search = lazy(() => import('./pages/Search'));
const LoanDecision = lazy(() => import('./pages/LoanDecision'));
const LoanScoringConfig = lazy(() => import('./pages/LoanScoringConfig'));

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 200 }}>
        <Spin size="large" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RouteFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 160 }}>
      <Spin size="large" />
    </div>
  );
}

export default function App() {
  return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Protected>
                <MembersProvider>
                  <AppLayout />
                </MembersProvider>
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<MemberDetail />} />
            <Route path="savings" element={<Savings />} />
            <Route path="loans" element={<Loans />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="checkoff" element={<CheckOff />} />
            <Route path="collateral" element={<Collateral />} />
            <Route path="shares" element={<Shares />} />
            <Route path="cashops" element={<CashOps />} />
            <Route path="reports" element={<Reports />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="products" element={<Products />} />
            <Route path="registration" element={<Registration />} />
            <Route path="payments" element={<Payments />} />
            <Route path="admin" element={<Admin />} />
            <Route path="auditing" element={<Auditing />} />
            <Route path="finance" element={<Finance />} />
            <Route path="data-migration" element={<DataMigration />} />
            <Route path="loan-admin" element={<LoanAdmin />} />
            <Route path="day-control" element={<DayControl />} />
            <Route path="term-deposits" element={<TermDeposits />} />
            <Route path="membership-applications" element={<MembershipApplications />} />
            <Route path="general-assembly" element={<GeneralAssembly />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="bank-reconciliation" element={<BankReconciliation />} />
            <Route path="gl-rules" element={<GlPostingRules />} />
            <Route path="fee-waivers" element={<FeeWaivers />} />
            <Route path="notification-templates" element={<NotificationTemplates />} />
            <Route path="loan-lifecycle" element={<LoanLifecycle />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="printables" element={<Printables />} />
            <Route path="system-ops" element={<SystemOps />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="member-lifecycle" element={<MemberLifecycle />} />
          <Route path="audit-trail" element={<AuditTrail />} />
            <Route path="search" element={<Search />} />
            <Route path="loan-decision" element={<LoanDecision />} />
            <Route path="loan-scoring-config" element={<LoanScoringConfig />} />
          </Route>
        </Routes>
      </Suspense>
  );
}
