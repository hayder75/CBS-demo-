import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FundOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useMembers } from '../context/MembersContext';
import { api } from '../api/client';
import type {
  Member,
  MemberCustomField,
  MemberCustomValue,
  MemberExitRequest,
  SavingsAccount,
  SavingsProduct,
  SavingsTransaction,
} from '../types';
import { fmtETB, fmtDate } from '../utils/format';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';

const statusColor: Record<Member['status'], string> = {
  Active: 'green',
  Dormant: 'orange',
  Suspended: 'red',
  Deceased: 'default',
  Withdrawn: 'default',
};

const accountStatusColor: Record<SavingsAccount['status'], string> = {
  Active: 'green',
  Pending: 'gold',
  Dormant: 'orange',
  Closed: 'default',
  Inactive: 'default',
  CreditSuspension: 'red',
  DebitSuspension: 'red',
  UnderSuspension: 'red',
};

const typeTag: Record<SavingsTransaction['type'], string> = {
  Deposit: 'green',
  Withdrawal: 'red',
  'Transfer In': 'blue',
  'Transfer Out': 'orange',
  Interest: 'purple',
  Dividend: 'gold',
};

const formValuesFromCustom = (
  definitions: MemberCustomField[],
  values: MemberCustomValue[],
): Record<string, unknown> => {
  const byField = new Map(values.map((value) => [String(value.fieldId), value.value]));
  const result: Record<string, unknown> = {};
  definitions
    .filter((field) => field.status === 'Active')
    .forEach((field) => {
      const raw = byField.get(String(field.id));
      if (raw === undefined) {
        result[String(field.id)] = field.type === 'Boolean' ? false : undefined;
      } else if (field.type === 'Boolean') {
        result[String(field.id)] = raw === 'true';
      } else if (field.type === 'Date') {
        result[String(field.id)] = raw ? dayjs(raw) : undefined;
      } else if (field.type === 'Number') {
        result[String(field.id)] = raw === '' ? undefined : Number(raw);
      } else {
        result[String(field.id)] = raw;
      }
    });
  return result;
};

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { members, setMembers } = useMembers();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [customFields, setCustomFields] = useState<MemberCustomField[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customSaving, setCustomSaving] = useState(false);
  const [customForm] = Form.useForm();
  const [memberExits, setMemberExits] = useState<MemberExitRequest[]>([]);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitForm] = Form.useForm();
  const [exitSaving, setExitSaving] = useState(false);
  const [exitBusy, setExitBusy] = useState<string | null>(null);

  const member = members.find((m) => m.id === id) ?? null;

  const loadMemberExits = async (memberId: string) => {
    const rows = await api<MemberExitRequest[]>('/api/member-exits').catch(() => []);
    setMemberExits(rows.filter((row) => String(row.memberId) === String(memberId)));
  };

  useEffect(() => {
    if (!member) return;
    setTxLoading(true);
    setAccountsLoading(true);
    api<SavingsTransaction[]>(`/api/savings/transactions/${member.id}`)
      .then(setTransactions)
      .finally(() => setTxLoading(false));
    api<SavingsAccount[]>(`/api/accounts/member/${member.id}`)
      .then(setAccounts)
      .finally(() => setAccountsLoading(false));
    api<SavingsProduct[]>('/api/savings/products')
      .then(setProducts)
      .catch(() => {});
    setCustomLoading(true);
    Promise.all([
      api<MemberCustomField[]>('/api/member-custom-fields').catch(() => []),
      api<MemberCustomValue[]>(`/api/members/${member.id}/custom-values`).catch(() => []),
    ])
      .then(([definitions, values]) => {
        setCustomFields(definitions);
        customForm.resetFields();
        customForm.setFieldsValue(formValuesFromCustom(definitions, values));
      })
      .finally(() => setCustomLoading(false));
    loadMemberExits(member.id);
  }, [member]);

  const activeCustomFields = customFields.filter((field) => field.status === 'Active');
  const openExit =
    memberExits.find((exit) => exit.status === 'Pending' || exit.status === 'Approved') ?? null;

  const saveCustomValues = async () => {
    if (!member) return;
    const values = customForm.getFieldsValue();
    setCustomSaving(true);
    try {
      const payload = activeCustomFields.map((field) => {
        const raw = values[String(field.id)];
        let value = '';
        if (field.type === 'Boolean') {
          value = raw ? 'true' : 'false';
        } else if (field.type === 'Date') {
          value = raw ? dayjs(raw).format('YYYY-MM-DD') : '';
        } else if (raw !== undefined && raw !== null) {
          value = String(raw);
        }
        return { fieldId: field.id, value };
      });
      const saved = await api<MemberCustomValue[]>(`/api/members/${member.id}/custom-values`, {
        method: 'POST',
        body: JSON.stringify({ values: payload }),
      });
      customForm.setFieldsValue(formValuesFromCustom(customFields, saved));
      message.success('Custom fields saved');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setCustomSaving(false);
    }
  };

  const requestExit = async () => {
    if (!member) return;
    const values = await exitForm.validateFields();
    setExitSaving(true);
    try {
      const created = await api<MemberExitRequest>('/api/member-exits', {
        method: 'POST',
        body: JSON.stringify({ memberId: member.id, reason: values.reason }),
      });
      setMemberExits((prev) => [created, ...prev.filter((row) => row.id !== created.id)]);
      exitForm.resetFields();
      message.success('Exit request submitted');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setExitSaving(false);
    }
  };

  const applyMemberExit = (updated: MemberExitRequest) => {
    setMemberExits((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  };

  const toggleExitItem = async (exit: MemberExitRequest, key: string, done: boolean) => {
    setExitBusy(exit.id);
    try {
      const updated = await api<MemberExitRequest>(`/api/member-exits/${exit.id}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ key, done }),
      });
      applyMemberExit(updated);
      message.success(done ? 'Checklist item completed' : 'Checklist item reopened');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setExitBusy(null);
    }
  };

  const actOnExit = async (exit: MemberExitRequest, action: 'approve' | 'complete' | 'reject') => {
    setExitBusy(exit.id);
    try {
      const updated = await api<MemberExitRequest>(`/api/member-exits/${exit.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      applyMemberExit(updated);
      if (action === 'complete' && member) {
        setMembers((prev) =>
          prev.map((row) => (row.id === member.id ? { ...row, status: 'Withdrawn' } : row)),
        );
      }
      message.success(
        action === 'approve'
          ? 'Exit request approved'
          : action === 'complete'
            ? 'Exit completed and member withdrawn'
            : 'Exit request rejected',
      );
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setExitBusy(null);
    }
  };

  const exitAllDone = openExit ? openExit.checklist.every((item) => item.done) : false;
  const exitCompleteDisabled = !openExit || openExit.status !== 'Approved' || !exitAllDone;
  const exitCompleteTooltip =
    openExit && openExit.status !== 'Approved'
      ? 'Approve the request before completing'
      : openExit && !exitAllDone
        ? 'All checklist items must be completed first'
        : '';

  const productOf = (v: string) =>
    products.find((p) => String(p.id) === String(v))?.name ?? String(v);

  const txSummary = useMemo(
    () => ({
      deposits: transactions.filter((t) => t.type === 'Deposit').reduce((s, t) => s + t.amount, 0),
      withdrawals: transactions.filter((t) => t.type === 'Withdrawal').reduce((s, t) => s + t.amount, 0),
      interest: transactions.filter((t) => t.type === 'Interest').reduce((s, t) => s + t.amount, 0),
    }),
    [transactions],
  );

  if (!member) {
    return (
      <Card>
        <Space direction="vertical" size={12}>
          <Typography.Text>Member not found.</Typography.Text>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/members')}>
            Back to Members
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title={member.fullName}
        subtitle={`${member.memberNo} · Joined ${fmtDate(member.joinDate)}`}
        tags={
          <>
            <Avatar
              size={32}
              style={{ background: member.photoColor || '#0e7a5f' }}
              icon={<UserOutlined />}
            />
            <Tag color={statusColor[member.status]}>{member.status}</Tag>
            <Typography.Text type="secondary">
              <EnvironmentOutlined /> {member.city}
            </Typography.Text>
            <Typography.Text type="secondary">
              <PhoneOutlined /> {member.phone}
            </Typography.Text>
          </>
        }
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/members')}>
              Back to Members
            </Button>
            <Button
              danger
              icon={<LogoutOutlined />}
              disabled={member.status === 'Withdrawn'}
              onClick={() => {
                exitForm.resetFields();
                setExitOpen(true);
              }}
            >
              Exit
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Share Balance"
            value={fmtETB(member.shareBalance)}
            icon={<FundOutlined style={{ color: '#7a5af8' }} />}
            delta={6.4}
            caption={member.occupation}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Savings Balance"
            value={fmtETB(member.savingsBalance)}
            icon={<DollarOutlined style={{ color: '#0e7a5f' }} />}
            delta={member.savingsBalance >= 0 ? 4.8 : -2.1}
            caption={member.savingsBalance >= 0 ? 'Active savings account' : 'Dormant account'}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Loan Outstanding"
            value={member.loanOutstanding ? fmtETB(member.loanOutstanding) : 'None'}
            icon={<BankOutlined style={{ color: member.loanOutstanding ? '#f04438' : '#12b76a' }} />}
            delta={member.loanOutstanding ? -3.5 : undefined}
            caption="Net of collateral & guarantors"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Fayda ID"
            value={member.faydaId || '—'}
            icon={<IdcardOutlined style={{ color: '#2e90fa' }} />}
            caption="National digital ID"
          />
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="profile"
          items={[
            {
              key: 'profile',
              label: 'Profile',
              children: (
                <>
                  <Descriptions title="Personal Information" bordered size="small" column={2}>
                    <Descriptions.Item label="Member No">{member.memberNo}</Descriptions.Item>
                    <Descriptions.Item label="Gender">{member.gender}</Descriptions.Item>
                    <Descriptions.Item label="Birth Date">{fmtDate(member.birthDate)}</Descriptions.Item>
                    <Descriptions.Item label="Joined">{fmtDate(member.joinDate)}</Descriptions.Item>
                    <Descriptions.Item label="Fayda ID">{member.faydaId}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={statusColor[member.status]}>{member.status}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                  <Descriptions title="Contact & Address" bordered size="small" column={2} style={{ marginTop: 16 }}>
                    <Descriptions.Item label="Phone">
                      <PhoneOutlined /> {member.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <MailOutlined /> {member.email || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      <EnvironmentOutlined /> {member.city}, {member.kebele}, Woreda {member.woreda}
                    </Descriptions.Item>
                  </Descriptions>
                  <Descriptions title="Employment" bordered size="small" column={2} style={{ marginTop: 16 }}>
                    <Descriptions.Item label="Occupation">{member.occupation}</Descriptions.Item>
                    <Descriptions.Item label="Employer">{member.employer || '—'}</Descriptions.Item>
                  </Descriptions>
                </>
              ),
            },
            {
              key: 'accounts',
              label: `Accounts (${accounts.length})`,
              children: (
                <Table
                  size="small"
                  loading={accountsLoading}
                  rowKey="id"
                  dataSource={accounts}
                  pagination={false}
                  columns={[
                    { title: 'Account No', dataIndex: 'accountNo' },
                    { title: 'Product', dataIndex: 'productId', render: productOf },
                    { title: 'Type', dataIndex: 'accountType' },
                    { title: 'Opened', dataIndex: 'openedDate', width: 120, render: fmtDate },
                    { title: 'Balance', dataIndex: 'balance', align: 'right', render: (v) => fmtETB(v) },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      width: 110,
                      render: (s) => <Tag color={accountStatusColor[s as SavingsAccount['status']]}>{s}</Tag>,
                    },
                  ]}
                />
              ),
            },
            {
              key: 'nok',
              label: 'Next of Kin & Beneficiaries',
              children: (
                <Row gutter={[20, 20]}>
                  <Col xs={24} lg={12}>
                    <Card size="small" title="Next of Kin" style={{ height: '100%' }}>
                      {member.nextOfKin.map((n, i) => (
                        <Descriptions key={i} column={1} size="small">
                          <Descriptions.Item label="Name">{n.name}</Descriptions.Item>
                          <Descriptions.Item label="Relation">{n.relation}</Descriptions.Item>
                          <Descriptions.Item label="Phone">
                            <PhoneOutlined /> {n.phone}
                          </Descriptions.Item>
                        </Descriptions>
                      ))}
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card size="small" title="Beneficiaries" style={{ height: '100%' }}>
                      {member.beneficiaries.map((b, i) => (
                        <Descriptions key={i} column={1} size="small">
                          <Descriptions.Item label="Name">{b.name}</Descriptions.Item>
                          <Descriptions.Item label="Relation">{b.relation}</Descriptions.Item>
                          <Descriptions.Item label="Allocation">
                            <Tag color="green">{b.percent}%</Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      ))}
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'statement',
              label: 'Statement',
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Row gutter={[20, 20]}>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic title="Total Deposits" value={fmtETB(txSummary.deposits)} valueStyle={{ color: '#0e7a5f' }} prefix={<DollarOutlined />} />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic title="Total Withdrawals" value={fmtETB(txSummary.withdrawals)} valueStyle={{ color: '#f5222d' }} prefix={<BankOutlined />} />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic title="Interest Earned" value={fmtETB(txSummary.interest)} valueStyle={{ color: '#722ed1' }} prefix={<ClockCircleOutlined />} />
                      </Card>
                    </Col>
                  </Row>
                  <Table
                    size="small"
                    loading={txLoading}
                    rowKey="id"
                    dataSource={transactions}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    columns={[
                      { title: 'Date', dataIndex: 'date', width: 120, render: fmtDate },
                      { title: 'Product', dataIndex: 'productId', render: productOf },
                      { title: 'Type', dataIndex: 'type', render: (t) => <Tag color={typeTag[t as SavingsTransaction['type']]}>{t}</Tag> },
                      { title: 'Channel', dataIndex: 'channel' },
                      { title: 'Teller', dataIndex: 'teller' },
                      { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => fmtETB(v) },
                    ]}
                  />
                </Space>
              ),
            },
            {
              key: 'custom',
              label: 'Custom Fields',
              children: (
                <Card
                  size="small"
                  title="Member Custom Fields"
                  loading={customLoading}
                  extra={
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={customSaving}
                      disabled={activeCustomFields.length === 0}
                      onClick={saveCustomValues}
                    >
                      Save Custom Fields
                    </Button>
                  }
                >
                  {activeCustomFields.length === 0 ? (
                    <Empty description="No custom fields configured for this member" />
                  ) : (
                    <Form form={customForm} layout="vertical">
                      <Row gutter={16}>
                        {activeCustomFields.map((field) => (
                          <Col xs={24} md={12} key={field.id}>
                            <Form.Item
                              label={field.label}
                              name={String(field.id)}
                              valuePropName={field.type === 'Boolean' ? 'checked' : 'value'}
                              rules={
                                field.required && field.type !== 'Boolean'
                                  ? [{ required: true, message: `${field.label} is required` }]
                                  : undefined
                              }
                            >
                              {field.type === 'Number' ? (
                                <InputNumber style={{ width: '100%' }} />
                              ) : field.type === 'Date' ? (
                                <DatePicker style={{ width: '100%' }} />
                              ) : field.type === 'Select' ? (
                                <Select
                                  allowClear
                                  options={(field.options ?? []).map((option) => ({
                                    label: option,
                                    value: option,
                                  }))}
                                />
                              ) : field.type === 'Boolean' ? (
                                <Switch />
                              ) : (
                                <Input />
                              )}
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                    </Form>
                  )}
                </Card>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Member Exit"
        open={exitOpen}
        onCancel={() => setExitOpen(false)}
        footer={null}
        width={600}
      >
        {openExit ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space wrap>
              <Tag
                color={
                  openExit.status === 'Pending'
                    ? 'gold'
                    : openExit.status === 'Approved'
                      ? 'blue'
                      : openExit.status === 'Completed'
                        ? 'green'
                        : 'red'
                }
              >
                {openExit.status}
              </Tag>
              <Typography.Text type="secondary">
                Requested {fmtDate(openExit.requestedAt)}
              </Typography.Text>
            </Space>
            <div>
              <Typography.Text strong>Reason</Typography.Text>
              <Typography.Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                {openExit.reason}
              </Typography.Paragraph>
            </div>
            <div>
              <Typography.Text strong>Exit Checklist</Typography.Text>
              <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 10 }}>
                {openExit.checklist.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <Space>
                      <Switch
                        size="small"
                        checked={item.done}
                        disabled={openExit.status !== 'Pending' || exitBusy === openExit.id}
                        onChange={(checked) => toggleExitItem(openExit, item.key, checked)}
                      />
                      <Typography.Text>{item.label}</Typography.Text>
                    </Space>
                    <Tag color={item.done ? 'green' : 'default'}>
                      {item.done ? 'Done' : 'Pending'}
                    </Tag>
                  </div>
                ))}
              </Space>
            </div>
            <Space wrap>
              <Button
                type="primary"
                disabled={openExit.status !== 'Pending'}
                loading={exitBusy === openExit.id}
                onClick={() => actOnExit(openExit, 'approve')}
              >
                Approve
              </Button>
              <Tooltip title={exitCompleteTooltip}>
                <span>
                  <Button
                    type="primary"
                    disabled={exitCompleteDisabled}
                    loading={exitBusy === openExit.id}
                    onClick={() => actOnExit(openExit, 'complete')}
                  >
                    Complete Exit
                  </Button>
                </span>
              </Tooltip>
              <Button
                danger
                disabled={openExit.status !== 'Pending' && openExit.status !== 'Approved'}
                loading={exitBusy === openExit.id}
                onClick={() => actOnExit(openExit, 'reject')}
              >
                Reject
              </Button>
              <Button onClick={() => setExitOpen(false)}>Close</Button>
            </Space>
          </Space>
        ) : (
          <Form form={exitForm} layout="vertical" style={{ marginTop: 8 }}>
            <Typography.Paragraph type="secondary">
              Requesting an exit opens a checklist covering savings, loans, shares, collateral,
              guarantor exposure and KYC retention.
            </Typography.Paragraph>
            <Form.Item
              label="Reason"
              name="reason"
              rules={[{ required: true, message: 'Reason is required' }]}
            >
              <Input.TextArea rows={4} placeholder="Reason for exiting the SACCO" />
            </Form.Item>
            <Space>
              <Button onClick={() => setExitOpen(false)}>Cancel</Button>
              <Button type="primary" loading={exitSaving} onClick={requestExit}>
                Submit Exit Request
              </Button>
            </Space>
          </Form>
        )}
      </Modal>
    </Space>
  );
}