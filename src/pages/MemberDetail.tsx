import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FundOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useMembers } from '../context/MembersContext';
import { api } from '../api/client';
import type { Member, SavingsAccount, SavingsProduct, SavingsTransaction } from '../types';
import { fmtETB, fmtDate } from '../utils/format';
import { StatCard } from '../components/StatCard';

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
};

const typeTag: Record<SavingsTransaction['type'], string> = {
  Deposit: 'green',
  Withdrawal: 'red',
  'Transfer In': 'blue',
  'Transfer Out': 'orange',
  Interest: 'purple',
  Dividend: 'gold',
};

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { members } = useMembers();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [products, setProducts] = useState<SavingsProduct[]>([]);

  const member = members.find((m) => m.id === id) ?? null;

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
  }, [member]);

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
      <Card style={{ borderRadius: 12 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space size={16}>
              <Avatar size={56} style={{ background: member.photoColor || '#0e7a5f' }} icon={<UserOutlined />} />
              <div>
                <Space>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {member.fullName}
                  </Typography.Title>
                  <Tag color={statusColor[member.status]}>{member.status}</Tag>
                </Space>
                <Space size={12} style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary">
                    {member.memberNo} · Joined {fmtDate(member.joinDate)}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    <EnvironmentOutlined /> {member.city}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    <PhoneOutlined /> {member.phone}
                  </Typography.Text>
                </Space>
              </div>
            </Space>
          </Col>
          <Col>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/members')}>
              Back to Members
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Share Balance" value={fmtETB(member.shareBalance)} icon={<FundOutlined style={{ color: '#722ed1' }} />} footer={`${member.occupation}`} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Savings Balance" value={fmtETB(member.savingsBalance)} icon={<DollarOutlined style={{ color: '#0e7a5f' }} />} footer={member.savingsBalance >= 0 ? 'Active savings account' : '—'} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Loan Outstanding"
            value={member.loanOutstanding ? fmtETB(member.loanOutstanding) : 'None'}
            icon={<BankOutlined style={{ color: member.loanOutstanding ? '#f5222d' : '#52c41a' }} />}
            footer="Net of collateral & guarantors"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Fayda ID" value={member.faydaId || '—'} icon={<IdcardOutlined style={{ color: '#1890ff' }} />} footer="National digital ID" />
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
                <Row gutter={[16, 16]}>
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
                  <Row gutter={[16, 16]}>
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
          ]}
        />
      </Card>
    </Space>
  );
}