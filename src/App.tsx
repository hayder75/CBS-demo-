import { Navigate, Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './context/AuthContext';
import AppLayout from './layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Savings from './pages/Savings';
import Loans from './pages/Loans';
import Accounting from './pages/Accounting';
import CheckOff from './pages/CheckOff';
import Collateral from './pages/Collateral';
import Shares from './pages/Shares';
import CashOps from './pages/CashOps';
import Reports from './pages/Reports';
import Approvals from './pages/Approvals';

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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="savings" element={<Savings />} />
        <Route path="loans" element={<Loans />} />
        <Route path="accounting" element={<Accounting />} />
        <Route path="checkoff" element={<CheckOff />} />
        <Route path="collateral" element={<Collateral />} />
        <Route path="shares" element={<Shares />} />
        <Route path="cashops" element={<CashOps />} />
        <Route path="reports" element={<Reports />} />
        <Route path="approvals" element={<Approvals />} />
      </Route>
    </Routes>
  );
}