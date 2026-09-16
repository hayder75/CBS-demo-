import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown, Input, Layout, Menu, Space, Tag, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  CalculatorOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  FileProtectOutlined,
  FundOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoneyCollectOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  SolutionOutlined,
  SwapOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserSwitchOutlined,
  AuditOutlined,
  CloudUploadOutlined,
  CrownOutlined,
  EuroCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { users } from '../mocks/data';

interface MenuItem {
  path: string;
  name: string;
  icon?: React.ReactNode;
  roles: Role[];
  group: string;
}

const menu: MenuItem[] = [
  { path: '/', name: 'Dashboard', icon: <AppstoreOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },
  { path: '/members', name: 'Members', icon: <TeamOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },
  { path: '/savings', name: 'Savings & Deposits', icon: <DollarOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },
  { path: '/loans', name: 'Loans', icon: <TransactionOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },
  { path: '/accounting', name: 'Accounting & GL', icon: <CalculatorOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },
  { path: '/checkoff', name: 'Employer Check-Off', icon: <SwapOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },
  { path: '/collateral', name: 'Collateral & Assets', icon: <FileProtectOutlined />, roles: ['ADMIN', 'MANAGER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },
  { path: '/shares', name: 'Shares & Dividends', icon: <FundOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },
  { path: '/cashops', name: 'Cash & Branch Ops', icon: <BankOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT', 'AUDITOR'], group: 'Main Menu' },

  { path: '/approvals', name: 'Approvals', icon: <CheckSquareOutlined />, roles: ['ADMIN', 'MANAGER'], group: 'Operations' },
  { path: '/registration', name: 'Registration', icon: <SolutionOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT'], group: 'Operations' },
  { path: '/payments', name: 'Payments', icon: <TransactionOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT'], group: 'Operations' },
  { path: '/products', name: 'Products', icon: <EuroCircleOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'], group: 'Operations' },
  { path: '/loan-admin', name: 'Loan Ops Admin', icon: <CrownOutlined />, roles: ['ADMIN', 'MANAGER', 'CREDIT_OFFICER'], group: 'Operations' },
  { path: '/data-migration', name: 'Data Migration', icon: <CloudUploadOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'], group: 'Operations' },

  { path: '/reports', name: 'Reports', icon: <BarChartOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'], group: 'Governance' },
  { path: '/finance', name: 'Finance', icon: <CalculatorOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'], group: 'Governance' },
  { path: '/auditing', name: 'Auditing', icon: <AuditOutlined />, roles: ['ADMIN', 'AUDITOR'], group: 'Governance' },
  { path: '/admin', name: 'Admin', icon: <SettingOutlined />, roles: ['ADMIN', 'MANAGER'], group: 'Governance' },
];

const groupOrder = ['Main Menu', 'Operations', 'Governance'];

const roleTagColor: Record<Role, string> = {
  ADMIN: 'purple',
  MANAGER: 'geekblue',
  TELLER: 'cyan',
  CREDIT_OFFICER: 'gold',
  ACCOUNTANT: 'green',
  AUDITOR: 'red',
};

export default function AppLayout() {
  const { user, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = useMemo<MenuProps['items']>(() => {
    const visible = menu.filter((m) => user && m.roles.includes(user.role));
    return groupOrder
      .map((group) => ({
        key: group,
        type: 'group' as const,
        label: group,
        children: visible
          .filter((m) => m.group === group)
          .map((m) => ({ key: m.path, icon: m.icon, label: m.name })),
      }))
      .filter((g) => g.children.length > 0);
  }, [user]);

  const selectedKeys = useMemo(() => {
    const paths = menu.map((m) => m.path).sort((a, b) => b.length - a.length);
    const match = paths.find(
      (p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p + '/')),
    );
    return match ? [match] : ['/'];
  }, [location.pathname]);

  if (!user) return null;

  const userDropdown: MenuProps = {
    items: [
      {
        key: 'role:current',
        label: (
          <Space>
            <Tag color={roleTagColor[user.role]}>{user.role}</Tag>
            {user.title}
          </Space>
        ),
        disabled: true,
      },
      { type: 'divider', key: 'divider-0' },
      ...users
        .filter((u) => u.id !== user.id)
        .map((u) => ({
          key: `role:${u.role}`,
          label: (
            <Space>
              <UserSwitchOutlined />
              Switch to {u.title}
              <Tag color={roleTagColor[u.role]} style={{ marginLeft: 4 }}>
                {u.role}
              </Tag>
            </Space>
          ),
        })),
      { type: 'divider', key: 'divider-1' },
      {
        key: 'logout',
        label: (
          <Space>
            <LogoutOutlined />
            Sign out
          </Space>
        ),
        danger: true,
      },
    ],
    onClick: async ({ key }: { key: string }) => {
      if (key === 'logout') {
        logout();
        navigate('/login');
        return;
      }
      if (key.startsWith('role:')) {
        const role = key.split(':')[1] as Role;
        await switchRole(role);
        message.success(`Switched to ${role} view`);
        navigate('/');
      }
    },
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--cbs-bg)' }}>
      <Layout.Sider
        width={248}
        collapsedWidth={0}
        collapsed={collapsed}
        trigger={null}
        theme="light"
        className="cbs-sider"
      >
        <div className="cbs-sider-inner">
          <div className="cbs-brand">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0e7a5f 0%, #0a5f4a 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flex: '0 0 auto',
                boxShadow: '0 4px 10px rgba(14,122,95,0.28)',
              }}
            >
              <MoneyCollectOutlined />
            </div>
            <span className="cbs-brand-title">CBS General</span>
          </div>

          <div className="cbs-menu-wrap">
            <Menu
              mode="inline"
              className="cbs-menu"
              items={menuItems}
              selectedKeys={selectedKeys}
              onClick={({ key }) => navigate(key)}
            />
          </div>

          <div style={{ padding: '0 12px 16px', flex: '0 0 auto' }}>
            <div
              style={{
                background: 'linear-gradient(140deg, #0e7a5f 0%, #0a5f4a 100%)',
                borderRadius: 14,
                padding: 18,
                color: '#fff',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <QuestionCircleOutlined style={{ fontSize: 16 }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
                Need help with your SACCO?
              </div>
              <div style={{ fontSize: 11, opacity: 0.78, marginTop: 4, lineHeight: 1.5 }}>
                Browse the operator guide or reach support.
              </div>
              <button
                type="button"
                onClick={() => navigate('/reports')}
                style={{
                  marginTop: 14,
                  width: '100%',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 0',
                  background: '#fff',
                  color: '#0a5f4a',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Open guide
              </button>
            </div>
          </div>
        </div>
      </Layout.Sider>

      <Layout
        style={{
          marginInlineStart: collapsed ? 0 : 248,
          transition: 'margin 0.2s ease',
          background: 'var(--cbs-bg)',
        }}
      >
        <div className="cbs-header">
          <Button
            type="text"
            aria-label="Toggle navigation"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((v) => !v)}
          />
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#98a2b3' }} />}
            placeholder="Search anything here..."
            style={{ width: 320, borderRadius: 10, background: '#f8fafc' }}
            onPressEnter={(e) => {
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) message.info(`Search: ${q}`);
            }}
          />
          <div className="cbs-header-spacer" />
          <QuestionCircleOutlined className="cbs-header-icon" />
          <Badge dot offset={[-1, 2]}>
            <BellOutlined className="cbs-header-icon" />
          </Badge>
          <SettingOutlined className="cbs-header-icon" />
          <Dropdown menu={userDropdown} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ background: roleTagColor[user.role], fontWeight: 600 }}>
                {user.name.charAt(0)}
              </Avatar>
              <Space direction="vertical" size={0} style={{ lineHeight: 1.25 }}>
                <Typography.Text strong style={{ fontSize: 13 }}>
                  {user.name}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {user.title}
                </Typography.Text>
              </Space>
            </Space>
          </Dropdown>
        </div>

        <Layout.Content className="cbs-content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
