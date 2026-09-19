import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { FormInstance } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TransactionOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { CurrencyInput } from '../components/CurrencyInput';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type {
  Loan,
  LoanAutoDebitRow,
  LoanRecovery,
  LoanRestructure,
  LoanWriteOff,
  ProvisionPolicyRow,
  ProvisionRun,
} from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

const restructureColor: Record<LoanRestructure['status'], string> = {
  Pending: 'gold',
  Approved: 'cyan',
  Executed: 'green',
  Rejected: 'red',
};

const writeOffColor: Record<LoanWriteOff['status'], string> = {
  Pending: 'gold',
  Approved: 'green',
  Rejected: 'red',
};

const classifyColor: Record<ProvisionPolicyRow['classification'], string> = {
  Pass: 'green',
  'Special Mention': 'gold',
  Substandard: 'orange',
  Doubtful: 'volcano',
  Loss: 'red',
};

const autoDebitColor: Record<LoanAutoDebitRow['status'], string> = {
  Scheduled: 'default',
  Debited: 'green',
  Insufficient: 'red',
  Skipped: 'default',
};

const ELIGIBLE: Loan['status'][] = ['Disbursed', 'Partially Paid', 'Restructured'];

export default function LoanLifecycle() {
  const [loanList, setLoanList] = useState<Loan[]>([]);
  const [restructures, setRestructures] = useState<LoanRestructure[]>([]);
  const [writeOffs, setWriteOffs] = useState<LoanWriteOff[]>([]);
  const [recoveries, setRecoveries] = useState<LoanRecovery[]>([]);
  const [policy, setPolicy] = useState<ProvisionPolicyRow[]>([]);
  const [runs, setRuns] = useState<ProvisionRun[]>([]);
  const [autoDebit, setAutoDebit] = useState<LoanAutoDebitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [modal, setModal] = useState<'restructure' | 'writeoff' | 'recovery' | null>(null);
  const [rsForm] = Form.useForm();
  const [woForm] = Form.useForm();
  const [recForm] = Form.useForm();

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('cbs-user');
      if (!raw) return 'Kaleab Desta';
      const parsed = JSON.parse(raw) as { name?: string };
      return parsed.name ?? 'Kaleab Desta';
    } catch {
      return 'Kaleab Desta';
    }
  }, []);

  const load = async () => {
    setLoading(true);
    const [ls, rs, wo, rec, pol, rn, ad] = await Promise.all([
      api<Loan[]>('/api/loans').catch(() => []),
      api<LoanRestructure[]>('/api/loan-restructures').catch(() => []),
      api<LoanWriteOff[]>('/api/loan-writeoffs').catch(() => []),
      api<LoanRecovery[]>('/api/loan-recoveries').catch(() => []),
      api<ProvisionPolicyRow[]>('/api/provision-policy').catch(() => []),
      api<ProvisionRun[]>('/api/provisioning/runs').catch(() => []),
      api<LoanAutoDebitRow[]>('/api/loan-auto-debit').catch(() => []),
    ]);
    setLoanList(ls);
    setRestructures(rs);
    setWriteOffs(wo);
    setRecoveries(rec);
    setPolicy(pol);
    setRuns(rn);
    setAutoDebit(ad);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (path: string, successMsg: string) => {
    setActing(path);
    try {
      await api(path, { method: 'POST' });
      message.success(successMsg);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setActing(null);
    }
  };

  const submit = async (
    path: string,
    form: FormInstance,
    successMsg: string,
    extra?: Record<string, unknown>,
  ) => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      await api(path, { method: 'POST', body: JSON.stringify({ ...values, ...extra }) });
      message.success(successMsg);
      form.resetFields();
      setModal(null);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const savePolicy = async () => {
    setSaving(true);
    try {
      const updated = await api<ProvisionPolicyRow[]>('/api/provision-policy', {
        method: 'POST',
        body: JSON.stringify({ rows: policy }),
      });
      setPolicy(updated);
      message.success('Provision policy saved');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const changePolicyPct = (id: string, pct: number | null) =>
    setPolicy((prev) => prev.map((p) => (p.id === id ? { ...p, provisionPct: pct ?? 0 } : p)));

  const restructurableLoans = useMemo(
    () => loanList.filter((l) => ELIGIBLE.includes(l.status) && l.balance > 0),
    [loanList],
  );

  const loanOptions = useMemo(
    () =>
      restructurableLoans.map((l) => ({
        label: `${l.loanNo} — ${l.memberName} (${fmtETB(l.balance)})`,
        value: l.id,
      })),
    [restructurableLoans],
  );

  const writeOffOptions = useMemo(
    () =>
      loanList
        .filter((l) => l.balance > 0)
        .map((l) => ({ label: `${l.loanNo} — ${l.memberName} (${fmtETB(l.balance)})`, value: l.id })),
    [loanList],
  );

  const recoveryOptions = useMemo(
    () => loanList.map((l) => ({ label: `${l.loanNo} — ${l.memberName}`, value: l.id })),
    [loanList],
  );

  const stats = useMemo(
    () => ({
      pending: restructures.filter((r) => r.status === 'Pending').length,
      approved: restructures.filter((r) => r.status === 'Approved').length,
      executed: restructures.filter((r) => r.status === 'Executed').length,
      exposure: restructures.filter((r) => r.status !== 'Rejected').reduce((s, r) => s + r.outstanding, 0),
    }),
    [restructures],
  );

  const policyTotal = useMemo(() => policy.reduce((s, p) => s + p.provisionPct, 0), [policy]);

  const onRestructureLoan = (loanId: string) => {
    const loan = loanList.find((l) => l.id === loanId);
    if (loan) rsForm.setFieldsValue({ newTermMonths: loan.termMonths, newRatePct: loan.ratePct });
  };

  const onWriteOffLoan = (loanId: string) => {
    const loan = loanList.find((l) => l.id === loanId);
    woForm.setFieldsValue({ amount: loan?.balance ?? 0 });
  };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Loan Lifecycle"
        subtitle="Restructuring, write-offs, recoveries, provisioning and automated repayment collection"
        extra={
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <Tabs
        items={[
          {
            key: 'restructures',
            label: 'Restructures',
            children: (
              <ProCard ghost direction="column" gutter={[20, 20]}>
                <Row gutter={[20, 20]}>
                  <Col xs={24} sm={12} xl={6}>
                    <StatCard
                      title="Pending Restructures"
                      value={stats.pending}
                      icon={<SafetyCertificateOutlined style={{ color: colors.accent }} />}
                      caption="Awaiting checker approval"
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <StatCard
                      title="Approved"
                      value={stats.approved}
                      icon={<CheckCircleOutlined style={{ color: colors.info }} />}
                      caption="Ready to execute"
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <StatCard
                      title="Executed"
                      value={stats.executed}
                      icon={<TransactionOutlined style={{ color: colors.success }} />}
                      caption="Loan terms updated"
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <StatCard
                      title="Exposure Under Review"
                      value={fmtETB(stats.exposure)}
                      icon={<WalletOutlined style={{ color: colors.primary }} />}
                      caption="Outstanding on active requests"
                    />
                  </Col>
                </Row>

                <Card
                  title="Restructuring Requests"
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal('restructure')}>
                      New Restructure
                    </Button>
                  }
                >
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={restructures}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    columns={[
                      { title: 'Loan No', dataIndex: 'loanNo', width: 120 },
                      { title: 'Member', dataIndex: 'memberName', ellipsis: true },
                      { title: 'Old Term', dataIndex: 'oldTermMonths', align: 'right', render: (v: number) => `${v} mo` },
                      { title: 'New Term', dataIndex: 'newTermMonths', align: 'right', render: (v: number) => `${v} mo` },
                      {
                        title: 'Rate',
                        key: 'rate',
                        align: 'right',
                        render: (_: unknown, r: LoanRestructure) => `${r.oldRatePct}% → ${r.newRatePct}%`,
                      },
                      { title: 'Outstanding', dataIndex: 'outstanding', align: 'right', render: (v: number) => fmtETB(v) },
                      { title: 'Fee', dataIndex: 'fee', align: 'right', render: (v: number) => fmtETB(v) },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        width: 110,
                        render: (s: LoanRestructure['status']) => <Tag color={restructureColor[s]}>{s}</Tag>,
                      },
                      {
                        title: 'Action',
                        width: 210,
                        render: (_: unknown, r: LoanRestructure) => {
                          if (r.status === 'Pending') {
                            return (
                              <Space>
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  loading={acting === `/api/loan-restructures/${r.id}/approve`}
                                  onClick={() => act(`/api/loan-restructures/${r.id}/approve`, 'Restructure approved')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  icon={<CloseCircleOutlined />}
                                  loading={acting === `/api/loan-restructures/${r.id}/reject`}
                                  onClick={() => act(`/api/loan-restructures/${r.id}/reject`, 'Restructure rejected')}
                                >
                                  Reject
                                </Button>
                              </Space>
                            );
                          }
                          if (r.status === 'Approved') {
                            return (
                              <Button
                                size="small"
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                loading={acting === `/api/loan-restructures/${r.id}/execute`}
                                onClick={() => act(`/api/loan-restructures/${r.id}/execute`, 'Restructure executed')}
                              >
                                Execute
                              </Button>
                            );
                          }
                          return <Typography.Text type="secondary">—</Typography.Text>;
                        },
                      },
                    ]}
                  />
                </Card>
              </ProCard>
            ),
          },
          {
            key: 'writeoffs',
            label: 'Write-Offs',
            children: (
              <Card
                title="Loan Write-Off Requests"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal('writeoff')}>
                    New Write-Off
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={writeOffs}
                  pagination={{ pageSize: 8, showSizeChanger: false }}
                  columns={[
                    { title: 'Loan No', dataIndex: 'loanNo', width: 120 },
                    { title: 'Member', dataIndex: 'memberName', ellipsis: true },
                    { title: 'Type', dataIndex: 'type', width: 100, render: (t: LoanWriteOff['type']) => <Tag color={t === 'Full' ? 'red' : 'orange'}>{t}</Tag> },
                    { title: 'Balance', dataIndex: 'balance', align: 'right', render: (v: number) => fmtETB(v) },
                    { title: 'Reason', dataIndex: 'reason', ellipsis: true },
                    { title: 'Requested By', dataIndex: 'requestedBy', width: 130 },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      width: 110,
                      render: (s: LoanWriteOff['status']) => <Tag color={writeOffColor[s]}>{s}</Tag>,
                    },
                    {
                      title: 'Action',
                      width: 190,
                      render: (_: unknown, r: LoanWriteOff) =>
                        r.status === 'Pending' ? (
                          <Space>
                            <Button
                              size="small"
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              loading={acting === `/api/loan-writeoffs/${r.id}/approve`}
                              onClick={() => act(`/api/loan-writeoffs/${r.id}/approve`, 'Write-off approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              danger
                              icon={<CloseCircleOutlined />}
                              loading={acting === `/api/loan-writeoffs/${r.id}/reject`}
                              onClick={() => act(`/api/loan-writeoffs/${r.id}/reject`, 'Write-off rejected')}
                            >
                              Reject
                            </Button>
                          </Space>
                        ) : (
                          <Typography.Text type="secondary">—</Typography.Text>
                        ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'recoveries',
            label: 'Recoveries',
            children: (
              <Card
                title="Recoveries"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal('recovery')}>
                    Record Recovery
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={recoveries}
                  pagination={{ pageSize: 8, showSizeChanger: false }}
                  columns={[
                    { title: 'Loan No', dataIndex: 'loanNo', width: 120 },
                    { title: 'Member', dataIndex: 'memberName', ellipsis: true },
                    { title: 'Date', dataIndex: 'date', width: 120 },
                    {
                      title: 'Source',
                      dataIndex: 'source',
                      width: 110,
                      render: (s: LoanRecovery['source']) => (
                        <Tag color={s === 'Cash' ? 'green' : 'blue'}>{s}</Tag>
                      ),
                    },
                    { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v: number) => fmtETB(v) },
                    { title: 'Recorded By', dataIndex: 'recordedBy', width: 140 },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'provisions',
            label: 'Provisions',
            children: (
              <ProCard ghost direction="column" gutter={[20, 20]}>
                <Card
                  title="Provision Policy"
                  extra={
                    <Space>
                      <Tag color={policyTotal > 0 ? 'blue' : 'red'}>Aggregate {policyTotal}%</Tag>
                      <Button loading={saving} onClick={() => void savePolicy()}>
                        Save Policy
                      </Button>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        loading={acting === '/api/provisioning/run'}
                        onClick={() => act('/api/provisioning/run', 'Provisioning run completed')}
                      >
                        Run Provisioning
                      </Button>
                    </Space>
                  }
                >
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={policy}
                    pagination={false}
                    columns={[
                      {
                        title: 'Classification',
                        dataIndex: 'classification',
                        render: (c: ProvisionPolicyRow['classification']) => <Tag color={classifyColor[c]}>{c}</Tag>,
                      },
                      {
                        title: 'Provision %',
                        dataIndex: 'provisionPct',
                        width: 220,
                        render: (v: number, r: ProvisionPolicyRow) => (
                          <InputNumber
                            min={0}
                            max={100}
                            step={1}
                            value={v}
                            addonAfter="%"
                            style={{ width: 160 }}
                            onChange={(next) => changePolicyPct(r.id, next)}
                          />
                        ),
                      },
                    ]}
                  />
                </Card>

                <Card title="Provisioning Runs">
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={runs}
                    pagination={false}
                    columns={[
                      { title: 'Business Date', dataIndex: 'businessDate', width: 140 },
                      { title: 'Loans Processed', dataIndex: 'loansProcessed', align: 'right' },
                      { title: 'Total Provision', dataIndex: 'totalProvision', align: 'right', render: (v: number) => fmtETB(v) },
                      { title: 'Run At', dataIndex: 'runAt', width: 190, render: (v: string) => new Date(v).toLocaleString() },
                      { title: 'Run By', dataIndex: 'runBy', width: 150 },
                    ]}
                  />
                </Card>
              </ProCard>
            ),
          },
          {
            key: 'autodebit',
            label: 'Auto-Debit',
            children: (
              <Card
                title="Loan Auto-Debit"
                extra={
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={acting === '/api/loan-auto-debit/run'}
                    onClick={() => act('/api/loan-auto-debit/run', 'Auto-debit run completed')}
                  >
                    Run Auto-Debit
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={autoDebit}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  columns={[
                    { title: 'Loan No', dataIndex: 'loanNo', width: 120 },
                    { title: 'Member', dataIndex: 'memberName', ellipsis: true },
                    { title: 'Installment', dataIndex: 'installment', align: 'right', render: (v: number) => fmtETB(v) },
                    { title: 'Savings Balance', dataIndex: 'savingsBalance', align: 'right', render: (v: number) => fmtETB(v) },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      width: 130,
                      render: (s: LoanAutoDebitRow['status']) => <Tag color={autoDebitColor[s]}>{s}</Tag>,
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="New Restructure Request"
        open={modal === 'restructure'}
        onCancel={() => setModal(null)}
        onOk={() => void submit('/api/loan-restructures', rsForm, 'Restructure request created', { requestedBy: currentUser })}
        okText="Submit Request"
        confirmLoading={saving}
      >
        <Form form={rsForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="loanId" label="Loan" rules={[{ required: true, message: 'Loan is required' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Select an active loan" options={loanOptions} onChange={onRestructureLoan} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="newTermMonths" label="New Term (months)" rules={[{ required: true, message: 'Term is required' }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={120} step={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="newRatePct" label="New Rate (% p.a.)" rules={[{ required: true, message: 'Rate is required' }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="fee" label="Restructuring Fee (ETB)" initialValue={0}>
            <CurrencyInput style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Reason is required' }]}>
            <Input.TextArea rows={3} placeholder="Justification for restructuring" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="New Write-Off Request"
        open={modal === 'writeoff'}
        onCancel={() => setModal(null)}
        onOk={() => void submit('/api/loan-writeoffs', woForm, 'Write-off request created', { requestedBy: currentUser })}
        okText="Submit Request"
        confirmLoading={saving}
      >
        <Form form={woForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="loanId" label="Loan" rules={[{ required: true, message: 'Loan is required' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Select a loan with balance" options={writeOffOptions} onChange={onWriteOffLoan} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Type" initialValue="Full" rules={[{ required: true }]}>
                <Select options={[{ label: 'Full', value: 'Full' }, { label: 'Partial', value: 'Partial' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="Amount (ETB)" rules={[{ required: true, message: 'Amount is required' }]}>
                <CurrencyInput style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: 'Reason is required' }]}>
            <Input.TextArea rows={3} placeholder="Justification for write-off" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Record Recovery"
        open={modal === 'recovery'}
        onCancel={() => setModal(null)}
        onOk={() => void submit('/api/loan-recoveries', recForm, 'Recovery recorded', { recordedBy: currentUser })}
        okText="Record"
        confirmLoading={saving}
      >
        <Form form={recForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="loanId" label="Loan" rules={[{ required: true, message: 'Loan is required' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Select a loan" options={recoveryOptions} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Amount (ETB)" rules={[{ required: true, message: 'Amount is required' }]}>
                <CurrencyInput style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="Source" initialValue="Cash" rules={[{ required: true }]}>
                <Select options={[{ label: 'Cash', value: 'Cash' }, { label: 'Savings', value: 'Savings' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="date" label="Date" initialValue={new Date().toISOString().slice(0, 10)}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>
    </ProCard>
  );
}
