import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Dropdown, Input, Layout, Menu, Space, Tag, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { users } from '../mocks/data';
import { useI18n } from '../i18n/I18nContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { navModules, moduleForPath } from '../navConfig';

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
  const { t } = useI18n();
  const demoMode =
    import.meta.env.VITE_USE_MOCK === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false');

  const visibleModules = useMemo(
    () => navModules.filter((m) => user && m.roles.includes(user.role)),
    [user],
  );

  const currentModule = useMemo(
    () => moduleForPath(location.pathname) ?? visibleModules[0] ?? navModules[0],
    [location.pathname, visibleModules],
  );

  const sidebarItems = useMemo(
    () => currentModule.items.filter((i) => user && i.roles.includes(user.role)),
    [currentModule, user],
  );

  const selectedKey = useMemo(() => {
    const paths = sidebarItems.map((i) => i.path).sort((a, b) => b.length - a.length);
    return (
      paths.find((p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p + '/'))) ?? '/'
    );
  }, [location.pathname, sidebarItems]);

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
      ...(demoMode ? users.filter((u) => u.id !== user.id) : [])
        .map((u) => ({
          key: `role:${u.role}`,
          label: (
            <Space>
              <UserSwitchOutlined />
              {t('common.switchRole')} {u.title}
              <Tag color={roleTagColor[u.role]} style={{ marginLeft: 4 }}>{u.role}</Tag>
            </Space>
          ),
        })),
      { type: 'divider', key: 'divider-1' },
      {
        key: 'logout',
        label: (
          <Space>
            <LogoutOutlined />
            {t('common.signOut')}
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
      {/* Top module bar */}
      <Layout.Header className="cbs-topnav">
        <div className="cbs-topnav-brand" onClick={() => navigate('/')}>
          <div className="cbs-topnav-logo">A</div>
          <span className="cbs-topnav-name">Anchor Financials</span>
        </div>

        <nav className="cbs-topnav-modules">
          {visibleModules.map((m) => {
            const first = m.items.find((i) => i.roles.includes(user.role)) ?? m.items[0];
            const active = currentModule.id === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`cbs-topnav-btn${active ? ' active' : ''}`}
                onClick={() => navigate(first.path)}
                title={t(m.key)}
              >
                {m.icon}
                <span>{t(m.key)}</span>
              </button>
            );
          })}
        </nav>

        <div className="cbs-topnav-right">
          <Input
            className="cbs-topnav-search"
            allowClear
            prefix={<SearchOutlined style={{ color: '#98a2b3' }} />}
            placeholder={t('common.searchPlaceholder')}
            onPressEnter={(e) => {
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
            }}
          />
          <LanguageSwitcher />
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
              <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }} className="cbs-topnav-user">
                <Typography.Text strong style={{ fontSize: 12, color: '#fff' }}>{user.name}</Typography.Text>
                <Typography.Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{user.title}</Typography.Text>
              </Space>
            </Space>
          </Dropdown>
        </div>
      </Layout.Header>

      <Layout>
        <Layout.Sider
          width={232}
          collapsedWidth={0}
          collapsed={collapsed}
          trigger={null}
          theme="light"
          className="cbs-sider"
        >
          <div className="cbs-sider-inner">
            <div className="cbs-sider-title">{t(currentModule.key)}</div>
            <div className="cbs-menu-wrap">
              <Menu
                mode="inline"
                className="cbs-menu"
                items={sidebarItems.map((i) => ({ key: i.path, icon: i.icon, label: t(i.key) }))}
                selectedKeys={[selectedKey]}
                onClick={({ key }) => navigate(key)}
              />
            </div>
          </div>
        </Layout.Sider>

        <Layout style={{ background: 'var(--cbs-bg)' }}>
          <div className="cbs-header">
            <Button
              type="text"
              aria-label="Toggle navigation"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((v) => !v)}
            />
            <Typography.Text strong style={{ fontSize: 15 }}>
              {t(currentModule.key)}
            </Typography.Text>
            <div className="cbs-header-spacer" />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Anchor Financials
            </Typography.Text>
          </div>

          <Layout.Content className="cbs-content">
            <Outlet />
          </Layout.Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
