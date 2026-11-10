import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DownloadOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import dayjs from 'dayjs';
import { FaydaIdInput, faydaValueFromEvent } from '../components/FaydaIdInput';
import { useMembers } from '../context/MembersContext';
import { api } from '../api/client';
import type { Member, OtpSendResult, OtpVerifyResult } from '../types';
import { fmtETB, fmtDate } from '../utils/format';

const statusColor: Record<Member['status'], string> = {
  Active: 'green',
  Dormant: 'orange',
  Suspended: 'red',
  Deceased: 'default',
  Withdrawn: 'default',
};

export default function Members() {
  const navigate = useNavigate();
  const { members, setMembers, search, setSearch, statusFilter, setStatusFilter } = useMembers();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [otpRequired, setOtpRequired] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const resetOtp = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setOtpDevCode(null);
  };

  const memberPhone = () => String(form.getFieldValue('phone') ?? '');

  const sendOtp = async () => {
    const phone = memberPhone();
    if (!phone.trim()) {
      message.warning('Enter the member phone number first');
      return;
    }
    setSendingOtp(true);
    try {
      const result = await api<OtpSendResult>('/api/sms/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone, purpose: 'Member registration' }),
      });
      setOtpSent(true);
      setOtpVerified(false);
      setOtpDevCode(result.devOtp ?? null);
      message.success(`Verification code sent to ${result.phone}`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    const phone = memberPhone();
    if (!otpCode.trim()) {
      message.warning('Enter the code sent to the phone');
      return;
    }
    setVerifyingOtp(true);
    try {
      await api<OtpVerifyResult>('/api/sms/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code: otpCode.trim() }),
      });
      setOtpVerified(true);
      message.success('Phone number verified');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  interface KycRow { id: string | number; memberNo: string; fullName: string; gender: string; phone?: string; status: string; hasPhoto: boolean; hasSignature: boolean; kycStatus: string }
  const [kycFilter, setKycFilter] = useState('pending');
  const [kycRows, setKycRows] = useState<KycRow[]>([]);
  const [kycSummary, setKycSummary] = useState<{ total: number; pending: number; verified: number; emptyPhoto: number; withoutSignature: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('[{"fullName":"New Member","gender":"F","phone":"+251 91 000 0000"}]');

  const loadKyc = async (filter: string) => {
    setKycRows(await api<KycRow[]>(`/api/members/kyc?filter=${filter}`).catch(() => []));
    setKycSummary(await api('/api/members/kyc/summary').catch(() => null) as typeof kycSummary);
  };

  useEffect(() => { loadKyc(kycFilter); /* eslint-disable-line */ }, [kycFilter]);

  const doImport = async () => {
    try {
      const rows = JSON.parse(importJson);
      const res = await api<{ created: number; total: number }>('/api/members/import', { method: 'POST', body: JSON.stringify({ rows }) });
      message.success(`Imported ${res.created} of ${res.total} members`);
      setImportOpen(false);
      await loadKyc(kycFilter);
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const createMember = async () => {
    if (otpRequired && !otpVerified) {
      message.warning('Verify the member phone number before registering');
      return;
    }
    const values = await form.validateFields();
    setSaving(true);
    try {
      const created = await api<Member>('/api/members', {
        method: 'POST',
        body: JSON.stringify({ ...values, birthDate: values.birthDate?.format('YYYY-MM-DD'), joinDate: values.joinDate?.format('YYYY-MM-DD') }),
      });
      setMembers((prev) => [created, ...prev]);
      setCreateOpen(false);
      form.resetFields();
      resetOtp();
      message.success(`Member ${created.fullName} registered as ${created.memberNo}`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(
    () =>
      members.filter(
        (m) =>
          (!search ||
            m.fullName.toLowerCase().includes(search.toLowerCase()) ||
            m.memberNo.toLowerCase().includes(search.toLowerCase()) ||
            m.faydaId.toLowerCase().includes(search.toLowerCase())) &&
          (!statusFilter || m.status === statusFilter),
      ),
    [members, search, statusFilter],
  );

  const openProfile = (m: Member) => {
    navigate(`/members/${m.id}`);
  };

  const summary = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.status === 'Active').length,
      dormant: members.filter((m) => m.status === 'Dormant').length,
      suspended: members.filter((m) => m.status === 'Suspended').length,
      shares: members.reduce((s, m) => s + m.shareBalance, 0),
      savings: members.reduce((s, m) => s + m.savingsBalance, 0),
    }),
    [members],
  );

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Members"
        subtitle="Member registry, statuses and balances across all branches"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { resetOtp(); setCreateOpen(true); }}>
              New Member
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Members"
            value={summary.total}
            icon={<TeamOutlined style={{ color: '#0e7a5f' }} />}
            delta={8.4}
            caption="Compared to last month"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Active Members"
            value={summary.active}
            icon={<CheckCircleOutlined style={{ color: '#12b76a' }} />}
            delta={5.1}
            caption="Compared to last month"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Dormant"
            value={summary.dormant}
            icon={<ClockCircleOutlined style={{ color: '#f79009' }} />}
            caption={`${summary.suspended} suspended`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Savings"
            value={fmtETB(summary.savings)}
            icon={<DollarOutlined style={{ color: '#2e90fa' }} />}
            caption={`${fmtETB(summary.shares)} shares`}
          />
        </Col>
      </Row>

      <Card
        title="KYC Review"
        extra={
          <Space wrap>
            <Segmented
              size="small"
              value={kycFilter}
              onChange={(v) => setKycFilter(String(v))}
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Verified', value: 'verified' },
                { label: 'Empty Photo', value: 'empty-photo' },
                { label: 'No Signature', value: 'without-signature' },
                { label: 'KYC Waiting', value: 'kyc-waiting' },
                { label: 'All', value: 'all' },
              ]}
            />
            <Button icon={<PlusOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 12 }}>
          <Tag color="gold">Pending {kycSummary?.pending ?? 0}</Tag>
          <Tag color="green">Verified {kycSummary?.verified ?? 0}</Tag>
          <Tag color="red">Empty Photo {kycSummary?.emptyPhoto ?? 0}</Tag>
          <Tag color="red">No Signature {kycSummary?.withoutSignature ?? 0}</Tag>
        </Space>
        <Table
          rowKey="id"
          size="small"
          dataSource={kycRows}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          columns={[
            { title: 'Member No', dataIndex: 'memberNo', width: 120 },
            { title: 'Name', dataIndex: 'fullName' },
            { title: 'Phone', dataIndex: 'phone', width: 160 },
            { title: 'Photo', dataIndex: 'hasPhoto', width: 90, render: (v: boolean) => (v ? <Tag color="green">Yes</Tag> : <Tag color="red">Missing</Tag>) },
            { title: 'Signature', dataIndex: 'hasSignature', width: 100, render: (v: boolean) => (v ? <Tag color="green">Yes</Tag> : <Tag color="red">Missing</Tag>) },
            { title: 'KYC', dataIndex: 'kycStatus', width: 120, render: (s: string) => <Tag color={s === 'Verified' ? 'green' : 'gold'}>{s}</Tag> },
          ]}
        />
      </Card>

      <Card
        title="Member Registry"
        extra={
          <Space>
            <Input
              placeholder="Search name, member no, or Fayda ID"
              allowClear
              prefix={<UserOutlined />}
              style={{ width: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={['Active', 'Dormant', 'Suspended', 'Deceased', 'Withdrawn'].map((s) => ({
                label: s,
                value: s,
              }))}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={filtered}
          onRow={(r) => ({ onClick: () => openProfile(r), style: { cursor: 'pointer' } })}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: 'Member',
              dataIndex: 'fullName',
              render: (v, r) => (
                <Space>
                  <Avatar style={{ background: r.photoColor }} icon={<UserOutlined />} />
                  <div>
                    <Typography.Text strong>{v}</Typography.Text>
                    <div style={{ fontSize: 11, color: '#999' }}>{r.memberNo}</div>
                  </div>
                </Space>
              ),
            },
            { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={statusColor[s as Member["status"]]}>{String(s)}</Tag> },
            { title: 'Fayda ID', dataIndex: 'faydaId' },
            { title: 'Occupation', dataIndex: 'occupation' },
            { title: 'Employer', dataIndex: 'employer', ellipsis: true },
            { title: 'Joined', dataIndex: 'joinDate', render: fmtDate },
            {
              title: 'Shares',
              dataIndex: 'shareBalance',
              align: 'right',
              render: (v) => fmtETB(v),
            },
            {
              title: 'Savings',
              dataIndex: 'savingsBalance',
              align: 'right',
              render: (v) => fmtETB(v),
            },
            {
              title: 'Loan O/S',
              dataIndex: 'loanOutstanding',
              align: 'right',
              render: (v) => (v ? <Typography.Text strong type="danger">{fmtETB(v)}</Typography.Text> : '—'),
            },
          ]}
        />
      </Card>

      <Modal
        title="Register New Member"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); resetOtp(); }}
        onOk={createMember}
        okText="Register Member"
        okButtonProps={{ disabled: otpRequired && !otpVerified }}
        confirmLoading={saving}
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Full name required' }]}>
                <Input placeholder="e.g. Almaz Tesfaye" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Gender" name="gender" rules={[{ required: true }]} initialValue="M">
                <Select options={[{ label: 'Male', value: 'M' }, { label: 'Female', value: 'F' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Birth Date" name="birthDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Join Date" name="joinDate" rules={[{ required: true }]} initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+251 9x xxx xxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="name@email.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Fayda ID Number" name="faydaId" getValueFromEvent={faydaValueFromEvent}>
                <FaydaIdInput style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kebele" name="kebele">
                <Input placeholder="e.g. Bole 01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Woreda" name="woreda">
                <Input placeholder="e.g. Woreda 3" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="City" name="city" initialValue="Addis Ababa">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Occupation" name="occupation">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Employer" name="employer">
                <Input placeholder="e.g. Ethio Telecom" />
              </Form.Item>
            </Col>
          </Row>

          <div className="soft-panel" style={{ marginBottom: 14 }}>
            <Space style={{ marginBottom: otpRequired ? 10 : 0 }} wrap>
              <Switch
                size="small"
                checked={otpRequired}
                onChange={(checked) => {
                  setOtpRequired(checked);
                  setOtpVerified(checked ? false : true);
                  if (!checked) setOtpDevCode(null);
                }}
              />
              <Typography.Text strong>SMS phone verification</Typography.Text>
              {otpVerified && <Tag color="green">Verified</Tag>}
            </Space>
            {otpRequired && (
              <>
                <Space wrap>
                  <Button
                    icon={<SafetyCertificateOutlined />}
                    loading={sendingOtp}
                    disabled={otpVerified}
                    onClick={sendOtp}
                  >
                    {otpSent ? 'Resend code' : 'Send code'}
                  </Button>
                  <Input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    maxLength={6}
                    style={{ width: 150 }}
                    disabled={!otpSent || otpVerified}
                  />
                  <Button
                    type="primary"
                    loading={verifyingOtp}
                    disabled={!otpSent || otpVerified}
                    onClick={verifyOtp}
                  >
                    Verify
                  </Button>
                </Space>
                {otpDevCode && !otpVerified && (
                  <Alert
                    style={{ marginTop: 10 }}
                    type="info"
                    showIcon
                    message={`Demo code: ${otpDevCode}`}
                    description="Afro SMS is simulated in this demo. In production the code is sent to the phone and never shown here."
                  />
                )}
              </>
            )}
          </div>

          <Typography.Text type="secondary">
            Registering a member sets an Active status with zero balances; shares and savings are
            posted through their own workflows.
          </Typography.Text>
        </Form>
      </Modal>

      <Modal title="Import Members" open={importOpen} onCancel={() => setImportOpen(false)} onOk={doImport} okText="Import">
        <Typography.Paragraph type="secondary">
          Paste a JSON array of member objects: <code>{'{fullName, gender, phone}'}</code>.
        </Typography.Paragraph>
        <Input.TextArea rows={6} value={importJson} onChange={(e) => setImportJson(e.target.value)} />
      </Modal>
    </ProCard>
  );
}