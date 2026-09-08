import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  FileProtectOutlined,
  FundOutlined,
  LogoutOutlined,
  MoneyCollectOutlined,
  SwapOutlined,
  TeamOutlined,
  TransactionOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Space, Tag, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { users } from '../mocks/data';

interface MenuItem {
  path: string;
  name: string;
  icon?: React.ReactNode;
  roles: Role[];
}

const menu: MenuItem[] = [
  { path: '/', name: 'Dashboard', icon: <AppstoreOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/members', name: 'Members', icon: <TeamOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/savings', name: 'Savings & Deposits', icon: <DollarOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/loans', name: 'Loans', icon: <TransactionOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/accounting', name: 'Accounting & GL', icon: <CalculatorOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/checkoff', name: 'Employer Check-Off', icon: <SwapOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/collateral', name: 'Collateral & Assets', icon: <FileProtectOutlined />, roles: ['ADMIN', 'MANAGER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/shares', name: 'Shares & Dividends', icon: <FundOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/cashops', name: 'Cash & Branch Ops', icon: <BankOutlined />, roles: ['ADMIN', 'MANAGER', 'TELLER', 'ACCOUNTANT', 'AUDITOR'] },
  { path: '/approvals', name: 'Approvals', icon: <CheckSquareOutlined />, roles: ['ADMIN', 'MANAGER'] },
  { path: '/reports', name: 'Reports', icon: <BarChartOutlined />, roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'] },
];

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

  const visibleMenu = useMemo(
    () =>
      menu
        .filter((m) => user && m.roles.includes(user.role))
        .map((m) => ({
          path: m.path,
          name: m.name,
          icon: m.icon,
        })),
    [user],
  );

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
    <ProLayout
      title="CBS General"
      logo={
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#0e7a5f',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          <MoneyCollectOutlined />
        </div>
      }
      layout="mix"
      fixSiderbar
      fixedHeader
      route={{ path: '/', routes: visibleMenu }}
      location={{ pathname: location.pathname }}
      menuItemRender={(item, dom) => (
        <div onClick={() => navigate(item.path || '/')} style={{ cursor: 'pointer' }}>
          {dom}
        </div>
      )}
      actionsRender={() => [
        <Dropdown key="user" menu={userDropdown} placement="bottomRight">
          <Space style={{ cursor: 'pointer', paddingRight: 16 }}>
            <Avatar style={{ background: roleTagColor[user.role] }}>{user.name.charAt(0)}</Avatar>
            <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                {user.name}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {user.title}
              </Typography.Text>
            </Space>
          </Space>
        </Dropdown>,
      ]}
      avatarProps={{ src: undefined, size: 'small' }}
      token={{ header: { colorBgHeader: '#fff' } }}
    >
      <Outlet />
    </ProLayout>
  );
}