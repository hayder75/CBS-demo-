import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  Form,
  InputNumber,
  message,
  Input,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  PlusOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { CurrencyInput } from '../components/CurrencyInput';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { colors } from '../theme';
import { api } from '../api/client';
import type { Collateral, Loan, LoanProduct, LoanScheduleRow, Member, SavingsAccount } from '../types';
import { fmtETB } from '../utils/format';

const statusColor: Record<Loan['status'], string> = {
  Pending: 'default',
  'Under Appraisal': 'blue',
  Approved: 'cyan',
  Disbursed: 'geekblue',
  'Partially Paid': 'purple',
  'Fully Paid': 'green',
  Restructured: 'gold',
  'Write-Off': 'red',
};

const classifyColor: Record<string, string> = {
  Pass: 'green',
  'Special Mention': 'gold',
  Substandard: 'orange',
  Doubtful: 'volcano',
  Loss: 'red',
};

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberAccounts, setMemberAccounts] = useState<SavingsAccount[]>([]);
  const [collaterals, setCollaterals] = useState<Collateral[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selected, setSelected] = useState<Loan | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [form] = Form.useForm();
  const [schedule, setSchedule] = useState<LoanScheduleRow[] | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    api<Loan[]>('/api/loans').then(setLoans);
    api<LoanProduct[]>('/api/loans/products').then(setProducts);
    api<Member[]>('/api/members').then(setMembers);
    api<Collateral[]>('/api/collateral').then(setCollaterals);
  }, []);

  const viewSchedule = async (loan: Loan) => {
    setSelected(loan);
    try {
      const rows = await api<LoanScheduleRow[]>('/api/loans/' + loan.id + '/amortization');
      setSchedule(rows);
    } catch {
      setSchedule(null);
    }
  };

  const disburse = async () => {
    if (!selected) return;
    await api(`/api/loans/${selected.id}/disburse`, { method: 'POST' });
    message.success('Loan disbursed');
    const fresh = await api<Loan[]>('/api/loans');
    setLoans(fresh);
    const updated = fresh.find((l) => l.id === selected.id);
    setSelected(updated ?? null);
  };

  const decide = async (approve: boolean) => {
    if (!selected) return;
    await api(`/api/loans/${selected.id}/decide`, { method: 'POST', body: JSON.stringify({ approve, note }) });
    message.success(approve ? 'Approved' : 'Rejected');
    setDecisionOpen(false);
    setNote('');
    const fresh = await api<Loan[]>('/api/loans');
    setLoans(fresh);
    setSelected(fresh.find((l) => l.id === selected.id) ?? null);
  };

  const filtered = useMemo(
    () => loans.filter((l) => !statusFilter || l.status === statusFilter),
    [loans, statusFilter],
  );

  const portfolio = useMemo(
    () => ({
      outstanding: loans.reduce((s, l) => s + l.balance, 0),
      disbursed: loans.filter((l) => l.disbursedAt).reduce((s, l) => s + l.amount, 0),
      overdue: loans.filter((l) => l.overdueDays > 0),
      par: loans.filter((l) => l.overdueDays > 30).reduce((s, l) => s + l.balance, 0),
    }),
    [loans],
  );

  const submitApplication = async () => {
    const values = await form.validateFields();
    await api('/api/loans', { method: 'POST', body: JSON.stringify(values) });
    setApplyOpen(false);
    form.resetFields();
    const fresh = await api<Loan[]>('/api/loans');
    setLoans(fresh);
  };

  const onMemberChange = async (memberId?: string) => {
    form.setFieldsValue({
      repaymentAccountId: undefined,
      reserveAccountId: undefined,
      collateralIds: undefined,
    });
    if (!memberId) {
      setMemberAccounts([]);
      return;
    }
    const accounts = await api<SavingsAccount[]>(`/api/accounts/member/${memberId}`).catch(() => []);
    setMemberAccounts(accounts);
  };

  const watchedMemberId = Form.useWatch('memberId', form);
  const memberCollaterals = useMemo(
    () => {
      const selectedMember = members.find((m) => m.id === watchedMemberId);
      return selectedMember
        ? collaterals.filter((c) => c.owner === selectedMember.fullName && c.status !== 'Released')
        : [];
    },
    [collaterals, members, watchedMemberId],
  );

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Loans"
        subtitle="Loan portfolio, appraisal pipeline and portfolio-at-risk monitoring"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setApplyOpen(true)}>
              New Loan Application
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Outstanding Portfolio"
            value={fmtETB(portfolio.outstanding)}
            icon={<WalletOutlined style={{ color: colors.primary }} />}
            delta={4.2}
            caption={`${fmtETB(portfolio.disbursed)} disbursed to date`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Overdue Loans"
            value={`${portfolio.overdue.length} loans`}
            icon={<ExclamationCircleOutlined style={{ color: colors.danger }} />}
            delta={-1.3}
            caption={`PAR > 30d: ${fmtETB(portfolio.par)}`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Loans in Pipeline"
            value={loans.filter((l) => ['Pending', 'Under Appraisal', 'Approved'].includes(l.status)).length}
            icon={<ClockCircleOutlined style={{ color: colors.info }} />}
            caption="Pending, appraisal and approved"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Active Loans"
            value={loans.filter((l) => l.status === 'Disbursed' || l.status === 'Partially Paid').length}
            icon={<CheckCircleOutlined style={{ color: colors.success }} />}
            caption={`${loans.length} total applications`}
          />
        </Col>
      </Row>

      <Card
        title="Loan Portfolio"
        extra={
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 170 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={['Pending', 'Under Appraisal', 'Approved', 'Disbursed', 'Partially Paid', 'Restructured'].map((s) => ({ label: s, value: s }))}
          />
        }
      >
        <Table
          rowKey="id"
          dataSource={filtered}
          onRow={(r) => ({ onClick: () => setSelected(r), style: { cursor: 'pointer' } })}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            { title: 'Loan No', dataIndex: 'loanNo', width: 110 },
            { title: 'Member', dataIndex: 'memberName', ellipsis: true },
            { title: 'Product', dataIndex: 'productName', ellipsis: true },
            { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={statusColor[s as Loan["status"]]}>{String(s)}</Tag> },
            {
              title: 'Amount',
              dataIndex: 'amount',
              align: 'right',
              render: (v) => fmtETB(v),
            },
            {
              title: 'Balance',
              dataIndex: 'balance',
              align: 'right',
              render: (v) => (v ? <Typography.Text strong>{fmtETB(v)}</Typography.Text> : '—'),
            },
            {
              title: 'Overdue',
              dataIndex: 'overdueDays',
              align: 'right',
              render: (v) =>
                v > 0 ? <Tag color={v > 30 ? 'red' : 'orange'}>{v} days</Tag> : '—',
            },
            {
              title: 'Class',
              dataIndex: 'classification',
              render: (c) => <Tag color={classifyColor[c]}>{c}</Tag>,
            },
            {
              title: 'AI Score',
              dataIndex: 'aiScore',
              align: 'right',
              render: (v) =>
                v !== undefined ? (
                  <Space>
                    <Progress
                      type="circle"
                      size={28}
                      percent={v}
                      strokeColor={v >= 70 ? colors.success : v >= 45 ? colors.warning : colors.danger}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      PD {selected === undefined ? '' : ''}
                    </Typography.Text>
                  </Space>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </Card>

      <Drawer title="Loan Details" width={720} open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Steps
              size="small"
              current={
                selected.status === 'Pending' ? 0 : selected.status === 'Under Appraisal' ? 1 : selected.status === 'Approved' ? 2 : selected.status === 'Disbursed' ? 3 : 4
              }
              items={[
                { title: 'Application', icon: <FileSearchOutlined /> },
                { title: 'Appraisal', icon: <SafetyCertificateOutlined /> },
                { title: 'Approval', icon: <CheckCircleOutlined /> },
                { title: 'Disbursement', icon: <WalletOutlined /> },
                { title: 'Repayment', icon: <ClockCircleOutlined /> },
              ]}
            />

            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Loan No">{selected.loanNo}</Descriptions.Item>
              <Descriptions.Item label="Member">{selected.memberName}</Descriptions.Item>
              <Descriptions.Item label="Product">{selected.productName}</Descriptions.Item>
              <Descriptions.Item label="Schedule">{selected.scheduleType}</Descriptions.Item>
              <Descriptions.Item label="Principal">{fmtETB(selected.amount)}</Descriptions.Item>
              <Descriptions.Item label="Term">{selected.termMonths} months</Descriptions.Item>
              <Descriptions.Item label="Rate">{selected.ratePct}% p.a.</Descriptions.Item>
              <Descriptions.Item label="Disbursed">{selected.disbursedAt || 'Not yet'}</Descriptions.Item>
              <Descriptions.Item label="Principal Paid">{fmtETB(selected.principalPaid)}</Descriptions.Item>
              <Descriptions.Item label="Interest Paid">{fmtETB(selected.interestPaid)}</Descriptions.Item>
              <Descriptions.Item label="Balance O/S" span={2}>
                <Typography.Text strong>{fmtETB(selected.balance)}</Typography.Text>
              </Descriptions.Item>
            </Descriptions>

            {selected.aiScore !== undefined && (
              <Card size="small" style={{ background: '#f0faf6' }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Typography.Text strong>
                    <RobotOutlined /> AI-Assisted Credit Assessment (§12)
                  </Typography.Text>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Progress
                        type="dashboard"
                        percent={selected.aiScore}
                        strokeColor={selected.aiScore >= 70 ? colors.success : selected.aiScore >= 45 ? colors.warning : colors.danger}
                        format={(p) => `${p}/100`}
                      />
                    </Col>
                    <Col span={18}>
                      <Space direction="vertical" size={4}>
                        <div>
                          <Tag color="purple">PD {selected.aiPdPct}%</Tag>
                          <Tag color="blue">{selected.aiGuidance}</Tag>
                        </div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          Decision-support only. Final approval rests with the credit committee and
                          authorized SACCO personnel.
                        </Typography.Text>
                      </Space>
                    </Col>
                  </Row>
                </Space>
              </Card>
            )}

            <Descriptions bordered size="small" column={1} title="Guarantors">
              {selected.guarantors.length === 0 && (
                <Descriptions.Item>No guarantors recorded</Descriptions.Item>
              )}
              {selected.guarantors.map((g) => (
                <Descriptions.Item label={g.name} key={g.name}>
                  <Space>
                    <Tag color={g.status === 'Active' ? 'green' : 'default'}>{g.status}</Tag>
                    <span>Exposure {fmtETB(g.exposure)} · Pledged deposit {fmtETB(g.pledgedDeposit)}</span>
                  </Space>
                </Descriptions.Item>
              ))}
            </Descriptions>

            <Descriptions bordered size="small" column={1} title="Collateral">
              {(!selected.collateralIds || selected.collateralIds.length === 0) && (
                <Descriptions.Item>No collateral linked</Descriptions.Item>
              )}
              {(selected.collateralIds ?? []).map((cid) => {
                const c = collaterals.find((x) => x.id === cid);
                return c ? (
                  <Descriptions.Item label={c.code} key={cid}>
                    <Space direction="vertical" size={4}>
                      <span>
                        {c.type} — {c.owner}
                      </span>
                      <Tag color={c.status === 'Pledged' ? 'blue' : 'default'}>{c.status}</Tag>
                      <span>FSV {fmtETB(c.forcedSaleValue)} · Doc {c.documentNo ?? '—'}</span>
                    </Space>
                  </Descriptions.Item>
                ) : null;
              })}
            </Descriptions>

            <Space wrap>
              {selected.status === 'Pending' && (
                <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => setDecisionOpen(true)}>
                  Committee Decision
                </Button>
              )}
              {selected.status === 'Approved' && (
                <Button type="primary" icon={<WalletOutlined />} onClick={disburse}>
                  Disburse
                </Button>
              )}
              <Button icon={<FileSearchOutlined />} disabled={!selected.disbursedAt} onClick={() => viewSchedule(selected)}>
                View Amortization
              </Button>
            </Space>

            {schedule && (
              <Card size="small" title="Amortization Schedule">
                <Table
                  size="small"
                  rowKey="period"
                  dataSource={schedule}
                  pagination={false}
                  columns={[
                    { title: 'Period', dataIndex: 'period', width: 70 },
                    { title: 'Due', dataIndex: 'dueDate', width: 110 },
                    { title: 'Principal', dataIndex: 'principal', align: 'right', render: (v: number) => fmtETB(v) },
                    { title: 'Interest', dataIndex: 'interest', align: 'right', render: (v: number) => fmtETB(v) },
                    { title: 'Total', dataIndex: 'total', align: 'right', render: (v: number) => fmtETB(v) },
                    { title: 'Paid', dataIndex: 'paid', align: 'right', render: (v: number) => fmtETB(v) },
                    { title: 'Balance', dataIndex: 'balance', align: 'right', render: (v: number) => fmtETB(v) },
                  ]}
                />
              </Card>
            )}
          </Space>
        )}
      </Drawer>

      <Modal
        title="Committee Decision"
        open={decisionOpen}
        onCancel={() => setDecisionOpen(false)}
        footer={
          <Space>
            <Button danger onClick={() => decide(false)}>Reject</Button>
            <Button type="primary" onClick={() => decide(true)}>Approve</Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Typography.Text type="secondary">
            {selected && selected.loanNo} · Committee applies auto-approval thresholds, then votes are
            aggregated. Decision recorded to the audit trail.
          </Typography.Text>
          <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Decision note / conditions" />
        </Space>
      </Modal>

      <Modal
        title="New Loan Application"
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        onOk={submitApplication}
        okText="Submit for Appraisal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Member" name="memberId" rules={[{ required: true, message: 'Member required' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select member"
              onChange={onMemberChange}
              options={members.map((m) => ({ label: `${m.fullName} (${m.memberNo})`, value: m.id }))}
            />
          </Form.Item>
          <Form.Item label="Loan Product" name="productId" rules={[{ required: true }]}>
            <Select
              placeholder="Select product"
              options={products.map((p) => ({
                label: `${p.code} — ${p.name} (${p.ratePct}%, max ${fmtETB(p.maxAmount)})`,
                value: p.id,
              }))}
            />
          </Form.Item>
          <Form.Item label="Repayment Account" name="repaymentAccountId" rules={[{ required: true, message: 'Repayment account required' }]}>
            <Select
              placeholder="Select savings account"
              disabled={!memberAccounts.length}
              options={memberAccounts
                .filter((a) => a.status === 'Active')
                .map((a) => ({ label: `${a.accountNo} — balance ${fmtETB(a.balance)}`, value: Number(a.id) }))}
            />
          </Form.Item>
          <Form.Item label="Reserve Account (optional)" name="reserveAccountId">
            <Select
              placeholder="Select savings account"
              disabled={!memberAccounts.length}
              options={memberAccounts
                .filter((a) => a.status === 'Active')
                .map((a) => ({ label: `${a.accountNo} — balance ${fmtETB(a.balance)}`, value: Number(a.id) }))}
            />
          </Form.Item>
          <Form.Item label="Collateral" name="collateralIds">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select collateral registered by this member"
              disabled={!memberCollaterals.length}
              options={memberCollaterals.map((c) => ({
                label: `${c.code} — ${c.type} (${fmtETB(c.forcedSaleValue)})`,
                value: c.id,
              }))}
            />
          </Form.Item>
          <Form.Item label="Amount (ETB)" name="amount" rules={[{ required: true }]}>
            <CurrencyInput style={{ width: '100%' }} min={1000} step={1000} />
          </Form.Item>
          <Form.Item label="Term (months)" name="termMonths" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={3} max={60} step={3} />
          </Form.Item>
          <Typography.Text type="secondary">
            Submitting creates a pending application that a credit officer appraises with AI
            assistance, then routes through committee approval and treasury authorization
            (maker-checker).
          </Typography.Text>
        </Form>
      </Modal>
    </ProCard>
  );
}