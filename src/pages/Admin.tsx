import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ApartmentOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  LaptopOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { CurrencyInput } from '../components/CurrencyInput';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type {
  AuditLogEntry,
  Branch,
  DeviceAccess,
  Holiday,
  OrgProfile,
  TransactionLimit,
  UserGroup,
} from '../types';
import { PERMISSION_GROUPS } from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

interface AdminUser {
  id: string | number;
  username: string;
  name: string;
  role: string;
  title?: string;
  branch?: string;
  lastLogin?: string | null;
}

const statusColor = (s: string) =>
  ['Verified', 'Active', 'Authorized', 'Ok'].includes(s)
    ? 'green'
    : s === 'Pending'
      ? 'gold'
      : ['Blocked', 'Failed', 'Inactive'].includes(s)
        ? 'red'
        : 'default';

export default function Admin() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [limits, setLimits] = useState<TransactionLimit[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [devices, setDevices] = useState<DeviceAccess[]>([]);
  const [messages, setMessages] = useState<{ id: string | number; title: string; body?: string; category: string; audience: string; channel: string; status: string; createdBy?: string; createdAt?: string; sentAt?: string | null }[]>([]);
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [permTarget, setPermTarget] = useState<UserGroup | null>(null);

  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [orgForm] = Form.useForm();

  const load = async () => {
    setBranches(await api<Branch[]>('/api/branches').catch(() => []));
    setLimits(await api<TransactionLimit[]>('/api/transaction-limits').catch(() => []));
    setLogs(await api<AuditLogEntry[]>('/api/audit/logs').catch(() => []));
    setHolidays(await api<Holiday[]>('/api/holidays').catch(() => []));
    setGroups(await api<UserGroup[]>('/api/user-groups').catch(() => []));
    setDevices(await api<DeviceAccess[]>('/api/device-accesses').catch(() => []));
    setMessages(await api<{ id: string | number; title: string; body?: string; category: string; audience: string; channel: string; status: string; createdBy?: string; createdAt?: string; sentAt?: string | null }[]>('/api/messages').catch(() => []));
    setUsers(await api<AdminUser[]>('/api/auth/users').catch(() => []));
    const profile = await api<OrgProfile>('/api/org-profile').catch(() => null);
    setOrg(profile);
    if (profile) orgForm.setFieldsValue(profile);
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const submit = async (path: string, method = 'POST') => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api(path, { method, body: JSON.stringify(values) });
      setOpen(null);
      form.resetFields();
      message.success('Saved');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const act = async (path: string, msg: string, method = 'POST') => {
    await api(path, { method });
    message.success(msg);
    await load();
  };

  const saveOrg = async () => {
    const values = await orgForm.validateFields();
    setSaving(true);
    try {
      await api('/api/org-profile', { method: 'PUT', body: JSON.stringify(values) });
      message.success('Organisation profile saved');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const verifiedBranches = branches.filter((b) => b.status === 'Verified').length;
  const pendingBranches = branches.filter((b) => b.status === 'Pending').length;
  const permissions = useMemo(() => permTarget?.permissions.split(',').filter(Boolean) ?? [], [permTarget]);

  const savePermissions = async (selected: string[]) => {
    if (!permTarget) return;
    await api(`/api/user-groups/${permTarget.id}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: selected }),
    });
    message.success(`Permissions updated for ${permTarget.name}`);
    setPermTarget(null);
    await load();
  };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Administration"
        subtitle="Organisation, branch network, users & access, configuration and audit"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('branch')}>New Branch</Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Branches" value={branches.length} icon={<BankOutlined style={{ color: colors.primary }} />} caption={`${verifiedBranches} verified · ${pendingBranches} pending`} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Users" value={users.length} icon={<TeamOutlined style={{ color: colors.info }} />} caption={`${groups.length} user groups`} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Holidays" value={holidays.length} icon={<CalendarOutlined style={{ color: colors.accent }} />} caption="Calendar & closures" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Audit Events" value={logs.length} icon={<FileTextOutlined style={{ color: colors.success }} />} caption="Recorded in the audit trail" />
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'org',
            label: <span><ApartmentOutlined /> My Organisation</span>,
            children: (
              <Card title="My Organisation" extra={<Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveOrg}>Save</Button>}>
                <Form form={orgForm} layout="vertical">
                  <Row gutter={16}>
                    <Col xs={24} md={8}><Form.Item label="Trading Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Legal Name" name="legalName"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Registration No." name="registrationNo"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="TIN" name="tin"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Phone" name="phone"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Email" name="email"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Address" name="address"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="City" name="city"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Country" name="country"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Currency" name="currencyCode"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Fiscal Year Start" name="fiscalYearStart"><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item label="Brand Colour" name="logoColor"><Input type="color" /></Form.Item></Col>
                  </Row>
                </Form>
                {org && (
                  <Descriptions size="small" column={3} style={{ marginTop: 8 }}>
                    <Descriptions.Item label="Status"><Tag color={statusColor(org.status)}>{org.status}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Currency">{org.currencyCode}</Descriptions.Item>
                    <Descriptions.Item label="FY Start">{org.fiscalYearStart}</Descriptions.Item>
                  </Descriptions>
                )}
              </Card>
            ),
          },
          {
            key: 'branches',
            label: <span><BankOutlined /> Branches</span>,
            children: (
              <Card title="Branch Management" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('branch')}>New Branch</Button>}>
                <Table
                  rowKey="id"
                  dataSource={branches}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 90 },
                    { title: 'Branch', dataIndex: 'name' },
                    { title: 'Address', dataIndex: 'address', ellipsis: true },
                    { title: 'Phone', dataIndex: 'phone', width: 140 },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag> },
                    {
                      title: 'Actions',
                      width: 160,
                      render: (_: unknown, r: Branch) => (
                        <Space>
                          {r.status === 'Pending' && <Button size="small" type="primary" onClick={() => act(`/api/branches/${r.id}/verify`, 'Branch verified')}>Verify</Button>}
                          {r.status === 'Verified' && <Button size="small" onClick={() => act(`/api/branches/${r.id}`, 'Closure requested', 'PUT')}>Close</Button>}
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'holidays',
            label: <span><CalendarOutlined /> Holidays</span>,
            children: (
              <Card title="Holiday Calendar" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('holiday')}>New Holiday</Button>}>
                <Table
                  rowKey="id"
                  dataSource={holidays}
                  pagination={{ pageSize: 12, showSizeChanger: false }}
                  columns={[
                    { title: 'Date', dataIndex: 'holidayDate', width: 130 },
                    { title: 'Holiday', dataIndex: 'name' },
                    { title: 'Type', dataIndex: 'holidayType', width: 110, render: (t: string) => <Tag>{t}</Tag> },
                    { title: 'Recurring', dataIndex: 'recurring', width: 100, render: (r: boolean) => (r ? <Tag color="blue">Annual</Tag> : '—') },
                    { title: 'Description', dataIndex: 'description', ellipsis: true },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag> },
                    { title: '', width: 80, render: (_: unknown, r: Holiday) => <Button size="small" danger onClick={() => act(`/api/holidays/${r.id}`, 'Holiday removed', 'DELETE')}>Delete</Button> },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'users',
            label: <span><UserOutlined /> Users</span>,
            children: (
              <Card title={`Users (${users.length})`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('user')}>New User</Button>}>
                <Table
                  rowKey="id"
                  dataSource={users}
                  pagination={{ pageSize: 12, showSizeChanger: false }}
                  columns={[
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Username', dataIndex: 'username', width: 160 },
                    { title: 'Role', dataIndex: 'role', width: 150, render: (r: string) => <Tag color="geekblue">{r}</Tag> },
                    { title: 'Title', dataIndex: 'title', width: 180 },
                    { title: 'Branch', dataIndex: 'branch', width: 160 },
                    { title: 'Last Login', dataIndex: 'lastLogin', width: 180, render: (v: string | null) => (v ? new Date(v).toLocaleString() : '—') },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'groups',
            label: <span><TeamOutlined /> User Groups</span>,
            children: (
              <Card title="User Groups & Permissions" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('group')}>Create Group</Button>}>
                <Table
                  rowKey="id"
                  dataSource={groups}
                  pagination={{ pageSize: 12, showSizeChanger: false }}
                  columns={[
                    { title: 'Group', dataIndex: 'name' },
                    { title: 'Code', dataIndex: 'code', width: 150, render: (c: string) => <Tag>{c}</Tag> },
                    { title: 'Max Attempts', dataIndex: 'maxLoginAttempts', width: 120, align: 'right' as const },
                    { title: 'Branch', dataIndex: 'branchSpecific', width: 90, render: (b: boolean) => (b ? 'Yes' : 'No') },
                    { title: 'Multi Device', dataIndex: 'multipleMachineLogins', width: 110, render: (b: boolean) => (b ? 'Yes' : 'No') },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag> },
                    {
                      title: 'Permissions',
                      render: (_: unknown, r: UserGroup) => (
                        <Button size="small" onClick={() => setPermTarget(r)}>{r.permissions.split(',').filter(Boolean).length} permissions</Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'config',
            label: <span><ClockCircleOutlined /> Transaction Config</span>,
            children: (
              <Card title="Role-Based Transaction Limits" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('limit')}>New Limit</Button>}>
                <Table
                  rowKey="id"
                  dataSource={limits}
                  pagination={false}
                  columns={[
                    { title: 'Role', dataIndex: 'roleCode', width: 150, render: (r: string) => <Tag>{r}</Tag> },
                    { title: 'Type', dataIndex: 'txnType', width: 140 },
                    { title: 'Max Amount', dataIndex: 'maxAmount', align: 'right' as const, render: (v: number) => fmtETB(v) },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'devices',
            label: <span><LaptopOutlined /> Device Access</span>,
            children: (
              <Card title="Device Access">
                <Table
                  rowKey="id"
                  dataSource={devices}
                  pagination={false}
                  columns={[
                    { title: 'User', dataIndex: 'username', width: 150 },
                    { title: 'Device', dataIndex: 'deviceName' },
                    { title: 'Device ID', dataIndex: 'deviceId', width: 140 },
                    { title: 'IP', dataIndex: 'ipAddress', width: 140 },
                    { title: 'Location', dataIndex: 'location', width: 150 },
                    { title: 'Status', dataIndex: 'status', width: 110, render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag> },
                    {
                      title: 'Actions',
                      width: 200,
                      render: (_: unknown, r: DeviceAccess) => (
                        <Space>
                          {!r.authorized && <Button size="small" type="primary" onClick={() => act(`/api/device-accesses/${r.id}/authorize`, 'Device authorized')}>Authorize</Button>}
                          {r.authorized && <Button size="small" danger onClick={() => act(`/api/device-accesses/${r.id}/block`, 'Device blocked')}>Block</Button>}
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'message',
            label: <span><MailOutlined /> Message</span>,
            children: (
              <Card title="Messages & Broadcasts" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('message')}>New Message</Button>}>
                <Table
                  rowKey="id"
                  dataSource={messages}
                  pagination={false}
                  columns={[
                    { title: 'Title', dataIndex: 'title' },
                    { title: 'Category', dataIndex: 'category', width: 120, render: (c: string) => <Tag>{c}</Tag> },
                    { title: 'Audience', dataIndex: 'audience', width: 130, render: (a: string) => <Tag color="geekblue">{a}</Tag> },
                    { title: 'Channel', dataIndex: 'channel', width: 110 },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={s === 'Sent' ? 'green' : 'gold'}>{s}</Tag> },
                    {
                      title: 'Actions',
                      width: 170,
                      render: (_: unknown, r: { id: string | number; status: string }) => (
                        <Space>
                          {r.status !== 'Sent' && <Button size="small" type="primary" onClick={() => act(`/api/messages/${r.id}/send`, 'Message sent')}>Send</Button>}
                          <Button size="small" danger onClick={() => act(`/api/messages/${r.id}`, 'Message deleted', 'DELETE')}>Delete</Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'logs',
            label: <span><FileTextOutlined /> Audit Logs</span>,
            children: (
              <Card title="Audit Logs">
                <Table
                  rowKey="id"
                  dataSource={logs}
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  columns={[
                    { title: 'When', dataIndex: 'occurredAt', width: 180, render: (v: string) => new Date(v).toLocaleString() },
                    { title: 'User', dataIndex: 'username', width: 120 },
                    { title: 'Action', dataIndex: 'action', width: 170, render: (a: string) => <Tag>{a}</Tag> },
                    { title: 'Entity', dataIndex: 'entity', width: 100 },
                    { title: 'Ref', dataIndex: 'entityId', width: 90 },
                    { title: 'Detail', dataIndex: 'detail', ellipsis: true },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'kpi',
            label: <span><CloudServerOutlined /> KPI</span>,
            children: (
              <Card title="Key Performance Indicators">
                <Space size={16} wrap>
                  <StatCard title="Verified Branches" value={verifiedBranches} icon={<CheckCircleOutlined style={{ color: colors.success }} />} caption="of the network" />
                  <StatCard title="User Groups" value={groups.length} icon={<TeamOutlined style={{ color: colors.info }} />} caption="Role definitions" />
                  <StatCard title="Managed Devices" value={devices.length} icon={<LaptopOutlined style={{ color: colors.primary }} />} caption={`${devices.filter((d) => d.authorized).length} authorized`} />
                  <StatCard title="Audit Events" value={logs.length} icon={<FileTextOutlined style={{ color: colors.accent }} />} caption="This period" />
                </Space>
              </Card>
            ),
          },
        ]}
      />

      <Modal title="New Branch" open={open === 'branch'} onCancel={() => setOpen(null)} onOk={() => submit('/api/branches')} okText="Create Branch" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Address" name="address"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Phone" name="phone"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="New Holiday" open={open === 'holiday'} onCancel={() => setOpen(null)} onOk={() => submit('/api/holidays')} okText="Create Holiday" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Date" name="holidayDate" rules={[{ required: true }]}><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
            <Col span={12}>
              <Form.Item label="Type" name="holidayType" initialValue="Public">
                <Select options={['Public', 'Internal', 'Bank'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Recurring annually" name="recurring" valuePropName="checked" initialValue={false}><Switch /></Form.Item>
          <Form.Item label="Description" name="description"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="New User" open={open === 'user'} onCancel={() => setOpen(null)} onOk={() => submit('/api/auth/users')} okText="Create User" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Full Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Username" name="username" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                <Select options={['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'].map((r) => ({ label: r, value: r }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item label="Title" name="title"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Branch" name="branch"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Password" name="password"><Input.Password placeholder="demo123" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="New User Group" open={open === 'group'} onCancel={() => setOpen(null)} onOk={() => submit('/api/user-groups')} okText="Create" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="User Group Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Group Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Max Login Attempts" name="maxLoginAttempts" initialValue={5}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item label="Multiple Machine Logins" name="multipleMachineLogins" valuePropName="checked" initialValue={false}><Switch /></Form.Item>
          <Form.Item label="Branch Specific" name="branchSpecific" valuePropName="checked" initialValue={false}><Switch /></Form.Item>
          <Form.Item label="Multiple Users" name="multipleUsers" valuePropName="checked" initialValue><Switch /></Form.Item>
          <Form.Item label="Permissions" name="permissions">
            <Checkbox.Group
              options={PERMISSION_GROUPS.flatMap((g) => g.permissions).map((p) => ({ label: p, value: p }))}
            />
          </Form.Item>
          <Form.Item label="Description" name="description"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="New Transaction Limit" open={open === 'limit'} onCancel={() => setOpen(null)} onOk={() => submit('/api/transaction-limits')} okText="Create Limit" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Role" name="roleCode" rules={[{ required: true }]}>
                <Select options={['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'].map((r) => ({ label: r, value: r }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Transaction Type" name="txnType" rules={[{ required: true }]}>
                <Select options={['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Max Amount (ETB)" name="maxAmount" rules={[{ required: true }]}>
                <CurrencyInput style={{ width: '100%' }} min={0} step={1000} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="New Message" open={open === 'message'} onCancel={() => setOpen(null)} onOk={() => submit('/api/messages')} okText="Create Message" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Body" name="body"><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Category" name="category" initialValue="General">
                <Select options={['General', 'Operations', 'Risk', 'Credit'].map((c) => ({ label: c, value: c }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Audience" name="audience" initialValue="All">
                <Select options={['All', 'MANAGER', 'TELLER', 'LOAN_OFFICER', 'ADMIN'].map((a) => ({ label: a, value: a }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Channel" name="channel" initialValue="In-App">
                <Select options={['In-App', 'Email', 'SMS'].map((c) => ({ label: c, value: c }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Send immediately" name="send" valuePropName="checked" initialValue={false}><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={permTarget ? `Permissions — ${permTarget.name}` : 'Permissions'}
        open={!!permTarget}
        onCancel={() => setPermTarget(null)}
        footer={null}
      >
        {permTarget && (
          <PermissionsEditor
            initial={permissions}
            onSave={savePermissions}
          />
        )}
      </Modal>
    </ProCard>
  );
}

function PermissionsEditor({ initial, onSave }: { initial: string[]; onSave: (p: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(initial);
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {PERMISSION_GROUPS.map((g) => (
        <div key={g.group}>
          <Typography.Text strong>{g.group}</Typography.Text>
          <div style={{ marginTop: 6 }}>
            <Checkbox.Group
              value={selected.filter((s) => g.permissions.includes(s))}
              options={g.permissions.map((p) => ({ label: p, value: p }))}
              onChange={(vals) => {
                const others = selected.filter((s) => !g.permissions.includes(s));
                setSelected([...others, ...(vals as string[])]);
              }}
            />
          </div>
        </div>
      ))}
      <Button type="primary" icon={<SaveOutlined />} onClick={() => onSave(selected)}>Save Permissions</Button>
    </Space>
  );
}
