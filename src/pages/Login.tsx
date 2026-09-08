import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  AuditOutlined,
  BankOutlined,
  CalculatorOutlined,
  DollarOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

const roles: { role: Role; label: string; icon: React.ReactNode; desc: string }[] = [
  { role: 'TELLER', label: 'Teller / Cashier', icon: <DollarOutlined />, desc: 'Deposits, withdrawals, till' },
  { role: 'CREDIT_OFFICER', label: 'Credit Officer', icon: <TeamOutlined />, desc: 'Appraisals, guarantors, recovery' },
  { role: 'ACCOUNTANT', label: 'Accountant', icon: <CalculatorOutlined />, desc: 'Journals, reconciliation, closings' },
  { role: 'MANAGER', label: 'Manager', icon: <BankOutlined />, desc: 'Approvals, oversight, reporting' },
  { role: 'AUDITOR', label: 'Auditor', icon: <AuditOutlined />, desc: 'Read-only review' },
  { role: 'ADMIN', label: 'System Admin', icon: <SafetyCertificateOutlined />, desc: 'Users, security, parameters' },
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
        background: 'linear-gradient(135deg, #0e7a5f 0%, #062c22 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card style={{ width: 880, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10}>
            <Space direction="vertical" size={16}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: '#0e7a5f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 28,
                }}
              >
                <BankOutlined />
              </div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                CBS General
              </Typography.Title>
              <Typography.Text type="secondary">
                Web-Based SACCO Management System
              </Typography.Text>
              <Tag color="green">Demo Build — v6 · PRP-ETH-SACCO-2026</Tag>
              <Alert
                type="info"
                showIcon
                message="Role-based demo"
                description="Pick a role to see that user's view. Each role exposes different menus and actions, per proposal §15."
              />
            </Space>
          </Col>
          <Col xs={24} md={14}>
            <Form
              layout="vertical"
              onFinish={({ username }: { username: string }) => doLogin(username)}
            >
              <Typography.Title level={5}>Select your role</Typography.Title>
              <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                {roles.map((r) => (
                  <Col xs={12} sm={8} key={r.role}>
                    <div
                      onClick={() => setSelectedRole(r.role)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1.5px solid ${selectedRole === r.role ? '#0e7a5f' : '#e5e5e5'}`,
                        background: selectedRole === r.role ? '#f0faf6' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 18, color: selectedRole === r.role ? '#0e7a5f' : '#999' }}>
                        {r.icon}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{r.label}</div>
                      <div style={{ fontSize: 10, color: '#999' }}>{r.desc}</div>
                    </div>
                  </Col>
                ))}
              </Row>

              <Row gutter={8} align="middle">
                <Col flex="auto">
                  <Form.Item name="username" style={{ marginBottom: 0 }}>
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Username (or leave empty for demo)"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      icon={<LockOutlined />}
                    >
                      Sign in
                    </Button>
                  </Form.Item>
                </Col>
              </Row>

              <Space style={{ marginTop: 16 }}>
                <Button type="link" size="small" onClick={() => setAutoRole((v) => !v)}>
                  {autoRole ? '✓ Auto role selected' : 'Quick demo: one-click sign in'}
                </Button>
              </Space>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
}