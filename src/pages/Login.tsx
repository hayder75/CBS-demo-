import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Col, Form, Input, Row, Tag, Typography, message } from 'antd';
import {
  AuditOutlined,
  BankOutlined,
  CalculatorOutlined,
  CheckCircleFilled,
  DollarOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { colors } from '../theme';

const roles: { role: Role; label: string; icon: React.ReactNode; desc: string }[] = [
  { role: 'TELLER', label: 'Teller / Cashier', icon: <DollarOutlined />, desc: 'Deposits, withdrawals, till' },
  { role: 'CREDIT_OFFICER', label: 'Credit Officer', icon: <TeamOutlined />, desc: 'Appraisals, guarantors, recovery' },
  { role: 'ACCOUNTANT', label: 'Accountant', icon: <CalculatorOutlined />, desc: 'Journals, reconciliation, closings' },
  { role: 'MANAGER', label: 'Manager', icon: <BankOutlined />, desc: 'Approvals, oversight, reporting' },
  { role: 'AUDITOR', label: 'Auditor', icon: <AuditOutlined />, desc: 'Read-only review' },
  { role: 'ADMIN', label: 'System Admin', icon: <SafetyCertificateOutlined />, desc: 'Users, security, parameters' },
];

const highlights = [
  'Unified member, savings, credit & share ledgers',
  'Maker-checker approvals and full audit trail',
  'Real-time branch, cash and portfolio analytics',
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>('MANAGER');
  const [loading, setLoading] = useState(false);
  const [autoRole, setAutoRole] = useState(false);

  const doLogin = async (username: string) => {
    setLoading(true);
    try {
      await login(username || (autoRole ? 'demo' : 'manager'), selectedRole);
      message.success(`Logged in as ${roles.find((r) => r.role === selectedRole)?.label}`);
      navigate('/');
    } catch {
      message.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#eef1f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 1020,
          maxWidth: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(16,24,40,0.14)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(150deg, #0e7a5f 0%, #0a5f4a 60%, #063b2e 100%)',
            color: '#fff',
            padding: '44px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <BankOutlined />
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                CBS General
              </span>
            </div>
            <Typography.Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
              Web-Based SACCO Management System
            </Typography.Title>
            <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.72)', marginTop: 12, fontSize: 13 }}>
              One platform for members, savings, credit, shares and branch operations.
            </Typography.Paragraph>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {highlights.map((h) => (
                <div key={h} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <CheckCircleFilled style={{ color: '#7ee2b8', marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
          <Tag
            style={{
              background: 'rgba(255,255,255,0.14)',
              color: '#fff',
              padding: '4px 12px',
              width: 'fit-content',
            }}
          >
            Demo Build — v6 · PRP-ETH-SACCO-2026
          </Tag>
        </div>

        <div style={{ padding: '44px 44px' }}>
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Sign in to your workspace
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Pick a role to explore that user's permissions and menus.
          </Typography.Text>

          <Form layout="vertical" onFinish={({ username }: { username: string }) => doLogin(username)} style={{ marginTop: 24 }}>
            <Row gutter={[10, 10]}>
              {roles.map((r) => {
                const active = selectedRole === r.role;
                return (
                  <Col xs={12} sm={8} key={r.role}>
                    <div
                      onClick={() => setSelectedRole(r.role)}
                      style={{
                        padding: '12px 10px',
                        borderRadius: 12,
                        border: `1.5px solid ${active ? colors.primary : '#eaecf0'}`,
                        background: active ? colors.primarySoft : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                        height: '100%',
                      }}
                    >
                      <div style={{ fontSize: 18, color: active ? colors.primary : '#98a2b3' }}>
                        {r.icon}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: colors.text }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: 10, color: '#98a2b3', marginTop: 2, lineHeight: 1.35 }}>
                        {r.desc}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>

            <Form.Item name="username" style={{ marginTop: 20, marginBottom: 12 }}>
              <Input
                prefix={<UserOutlined style={{ color: '#98a2b3' }} />}
                placeholder="Username (or leave empty for demo)"
                size="large"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<LockOutlined />}
              block
            >
              Sign in
            </Button>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Button type="link" size="small" onClick={() => setAutoRole((v) => !v)}>
                {autoRole ? '✓ Auto role selected' : 'Quick demo: one-click sign in'}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
