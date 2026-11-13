import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Checkbox, Col, Form, Input, Row, Switch, Tag, Typography, message } from 'antd';
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
import { api } from '../api/client';
import { MfaRequiredError, useAuth } from '../context/AuthContext';
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

const apiStatus = (error: unknown): number | undefined => {
  const text = error instanceof Error ? error.message : '';
  const match = text.match(/API error (\d+)/);
  return match ? Number(match[1]) : undefined;
};

export default function Login() {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>('MANAGER');
  const [loading, setLoading] = useState(false);
  const [autoRole, setAutoRole] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [twoFactor, setTwoFactor] = useState(false);
  const [captcha, setCaptcha] = useState(false);
  const [challengeId, setChallengeId] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [pendingUsername, setPendingUsername] = useState('');
  const [mfaUser, setMfaUser] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState('');
  const demoMode =
    import.meta.env.VITE_USE_MOCK === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false');

  const doLogin = async (username: string, password?: string) => {
    setLoading(true);
    const resolved = username || (autoRole ? 'demo' : 'manager');
    const secret = (password ?? '').trim() || (demoMode ? 'demo123' : '');
    if (!secret) {
      message.warning('Enter your password');
      setLoading(false);
      return;
    }
    try {
      await login(resolved, selectedRole, secret);
      message.success(`Logged in as ${roles.find((r) => r.role === selectedRole)?.label}`);
      navigate('/');
    } catch (error) {
      if (error instanceof MfaRequiredError) {
        setMfaUser(error.username ?? resolved);
        setPendingPassword(secret);
        setStep('otp');
        message.info('Enter the verification code sent to your phone');
        return;
      }
      message.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onCredentials = async ({ username, password }: { username?: string; password?: string }) => {
    if (demoMode && !captcha) {
      message.warning("Please confirm you're not a robot");
      return;
    }
    const resolved = (username ?? '').trim() || (autoRole ? 'demo' : 'manager');
    if (!twoFactor) {
      await doLogin(resolved, password);
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ challengeId: string; devOtp: string }>('/api/auth/2fa/start', {
        method: 'POST',
        body: JSON.stringify({ username: resolved }),
      });
      setChallengeId(res.challengeId);
      setDevOtp(res.devOtp);
      setPendingUsername(resolved);
      setStep('otp');
      message.success('Verification code sent to your email');
    } catch {
      message.error('Could not start two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async ({ otp }: { otp?: string }) => {
    const code = (otp ?? '').trim();
    if (!/^\d{6}$/.test(code)) {
      message.warning('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      if (mfaUser) {
        await verifyMfa(mfaUser, code);
        setMfaUser(null);
        message.success('Signed in with multi-factor authentication');
        navigate('/');
        return;
      }
      await api('/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeId, otp: code }),
      });
      await doLogin(pendingUsername);
    } catch (error) {
      const status = apiStatus(error);
      if (status === 429) {
        message.error('Too many attempts. Please resend a new code.');
      } else if (status === 400) {
        message.error('That code is incorrect or has expired. Please try again.');
      } else {
        message.error('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setLoading(true);
    try {
      if (mfaUser) {
        try {
          await login(mfaUser, selectedRole, pendingPassword);
        } catch (error) {
          if (!(error instanceof MfaRequiredError)) throw error;
        }
        message.success('A new verification code was sent');
        return;
      }
      const res = await api<{ devOtp: string }>('/api/auth/2fa/resend', {
        method: 'POST',
        body: JSON.stringify({ challengeId }),
      });
      setDevOtp(res.devOtp);
      message.success('A new code has been sent to your email');
    } catch {
      message.error('Could not resend the code');
    } finally {
      setLoading(false);
    }
  };

  const backToCredentials = () => {
    setStep('credentials');
    setChallengeId('');
    setDevOtp('');
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
                Anchor Financials
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
            {demoMode ? 'Demo Build — v6 · PRP-ETH-SACCO-2026' : 'Production · Anchor Financials'}
          </Tag>
        </div>

        <div style={{ padding: '44px 44px' }}>
          {step === 'credentials' ? (
            <>
              <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Sign in to your workspace
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {demoMode
                  ? "Pick a role to explore that user's permissions and menus."
                  : 'Enter your username and password to continue.'}
              </Typography.Text>

              <Form
                layout="vertical"
                onFinish={(values: { username?: string; password?: string }) => onCredentials(values)}
                style={{ marginTop: 24 }}
              >
                <Row gutter={[10, 10]} style={{ display: demoMode ? undefined : 'none' }}>
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
                    placeholder={demoMode ? 'Username (or leave empty for demo)' : 'Username'}
                    size="large"
                  />
                </Form.Item>

                <Form.Item name="password" style={{ marginBottom: 12 }}>
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#98a2b3' }} />}
                    placeholder={demoMode ? 'Password (demo: demo123)' : 'Password'}
                    size="large"
                  />
                </Form.Item>

                <div
                  style={{
                    display: demoMode ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SafetyCertificateOutlined
                      style={{ color: twoFactor ? colors.primary : '#98a2b3', fontSize: 16 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                        Enable email 2FA (demo)
                      </div>
                      <div style={{ fontSize: 11, color: '#98a2b3' }}>
                        Adds a one-time code step before sign in
                      </div>
                    </div>
                  </div>
                  <Switch checked={twoFactor} onChange={setTwoFactor} />
                </div>

                <div
                  style={{
                    display: demoMode ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: captcha ? colors.primarySoft : '#fafbfc',
                    border: `1px solid ${captcha ? colors.primary : colors.border}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Checkbox checked={captcha} onChange={(e) => setCaptcha(e.target.checked)}>
                    <span style={{ fontSize: 13, color: colors.text2 }}>I'm not a robot</span>
                  </Checkbox>
                  <div style={{ textAlign: 'center' }}>
                    <SafetyCertificateOutlined
                      style={{ fontSize: 20, color: captcha ? colors.primary : '#98a2b3' }}
                    />
                    <div style={{ fontSize: 9, color: '#98a2b3' }}>reCAPTCHA (demo)</div>
                  </div>
                </div>

                <div style={{ minHeight: 18, marginBottom: 6 }}>
                  {demoMode && !captcha && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      Tick the checkbox to enable sign in.
                    </Typography.Text>
                  )}
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  disabled={demoMode && !captcha}
                  icon={<LockOutlined />}
                  block
                >
                  Sign in
                </Button>

                <div style={{ textAlign: 'center', marginTop: 14, display: demoMode ? 'block' : 'none' }}>
                  <Button type="link" size="small" onClick={() => setAutoRole((v) => !v)}>
                    {autoRole ? '✓ Auto role selected' : 'Quick demo: one-click sign in'}
                  </Button>
                </div>
              </Form>
            </>
          ) : (
            <>
              <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Verify it's you
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {mfaUser
                  ? 'Enter the 6-digit code sent to your phone.'
                  : 'Enter the 6-digit code sent to your email address.'}
              </Typography.Text>

              {!mfaUser && devOtp && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginTop: 18 }}
                  message="Demo mode"
                  description={`Your email 2FA code is ${devOtp}. It expires in 5 minutes.`}
                />
              )}

              <Form
                layout="vertical"
                onFinish={(values: { otp?: string }) => onVerify(values)}
                style={{ marginTop: 20 }}
              >
                <Form.Item
                  name="otp"
                  rules={[
                    { required: true, message: 'Please enter the 6-digit code' },
                    { pattern: /^\d{6}$/, message: 'The code must be 6 digits' },
                  ]}
                >
                  <Input.OTP length={6} size="large" />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={<LockOutlined />}
                  block
                >
                  Verify & sign in
                </Button>
              </Form>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <Button type="link" size="small" onClick={backToCredentials} disabled={loading}>
                  ← Back
                </Button>
                <Button type="link" size="small" onClick={onResend} disabled={loading}>
                  Resend code
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
