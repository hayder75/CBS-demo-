import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { CurrencyInput } from '../components/CurrencyInput';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { api } from '../api/client';
import type { BankAccount, BankReconSession, BankTransaction, BankTxnReconStatus } from '../types';
import { fmtETB, fmtDate } from '../utils/format';
import { colors } from '../theme';

const reconColor: Record<BankTxnReconStatus, string> = {
  Unmatched: 'gold',
  Matched: 'green',
  Excluded: 'default',
};

export default function BankReconciliation() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [sessions, setSessions] = useState<BankReconSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');
  const [accountOpen, setAccountOpen] = useState(false);
  const [txnOpen, setTxnOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>();
  const [accountForm] = Form.useForm();
  const [txnForm] = Form.useForm();
  const [sessionForm] = Form.useForm();

  const load = useCallback(async () => {
    const [a, t, r] = await Promise.all([
      api<BankAccount[]>('/api/bank/accounts'),
      api<BankTransaction[]>('/api/bank/transactions'),
      api<BankReconSession[]>('/api/bank/recon'),
    ]);
    setAccounts(a);
    setTransactions(t);
    setSessions(r);
    return a;
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    load()
      .catch((e) => message.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) setSelectedAccountId(accounts[0].id);
  }, [accounts, selectedAccountId]);

  const accountById = useMemo(() => {
    const map = new Map<string, BankAccount>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const totalBook = useMemo(() => accounts.reduce((s, a) => s + a.bookBalance, 0), [accounts]);

  const openSession = useMemo(
    () => sessions.find((s) => s.bankAccountId === selectedAccountId && s.status === 'Open'),
    [sessions, selectedAccountId],
  );

  const historySessions = useMemo(
    () => sessions.filter((s) => s.bankAccountId === selectedAccountId),
    [sessions, selectedAccountId],
  );

  const unmatched = useMemo(
    () =>
      transactions.filter(
        (t) => t.bankAccountId === selectedAccountId && t.reconStatus === 'Unmatched',
      ),
    [transactions, selectedAccountId],
  );

  const createAccount = async () => {
    const values = await accountForm.validateFields();
    setSaving(true);
    try {
      await api('/api/bank/accounts', { method: 'POST', body: JSON.stringify(values) });
      setAccountOpen(false);
      accountForm.resetFields();
      message.success('Bank account added');
      refresh();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const createTransaction = async () => {
    const values = await txnForm.validateFields();
    setSaving(true);
    try {
      await api('/api/bank/transactions', {
        method: 'POST',
        body: JSON.stringify({ ...values, date: values.date?.format('YYYY-MM-DD') }),
      });
      setTxnOpen(false);
      txnForm.resetFields();
      message.success('Bank transaction recorded');
      refresh();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const startSession = async () => {
    const values = await sessionForm.validateFields();
    setSaving(true);
    try {
      await api('/api/bank/recon/start', {
        method: 'POST',
        body: JSON.stringify({ ...values, statementDate: values.statementDate?.format('YYYY-MM-DD') }),
      });
      setSessionOpen(false);
      sessionForm.resetFields();
      message.success('Reconciliation session started');
      refresh();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (key: string, path: string, success: string) => {
    setBusy(key);
    try {
      await api(path, { method: 'POST' });
      message.success(success);
      refresh();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const openStartSession = () => {
    sessionForm.setFieldsValue({
      bankAccountId: selectedAccountId,
      statementDate: dayjs(),
      statementBalance: selectedAccountId ? accountById.get(selectedAccountId)?.bookBalance : 0,
    });
    setSessionOpen(true);
  };

  const accountsTab = (
    <>
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Bank Accounts"
            value={accounts.length}
            icon={<BankOutlined style={{ color: colors.primary }} />}
            caption="Active banking relationships"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Book Balance"
            value={fmtETB(totalBook)}
            icon={<DollarOutlined style={{ color: colors.info }} />}
            caption="Across all bank accounts"
          />
        </Col>
      </Row>

      <Card
        title="Bank Accounts"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAccountOpen(true)}>
            Add Account
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={accounts}
          pagination={false}
          locale={{ emptyText: <Empty description="No bank accounts" /> }}
          columns={[
            { title: 'Code', dataIndex: 'code', width: 110 },
            { title: 'Bank', dataIndex: 'bankName', ellipsis: true },
            { title: 'Account No.', dataIndex: 'accountNo' },
            { title: 'Branch', dataIndex: 'branch', ellipsis: true },
            { title: 'Currency', dataIndex: 'currencyCode', width: 90 },
            {
              title: 'Book Balance',
              dataIndex: 'bookBalance',
              align: 'right',
              render: (v) => <strong>{fmtETB(v)}</strong>,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (s) => <Tag color={s === 'Active' ? 'green' : 'default'}>{s}</Tag>,
            },
          ]}
        />
      </Card>
    </>
  );

  const transactionsTab = (
    <Card
      title="Bank Transactions"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setTxnOpen(true)}>
          Add Transaction
        </Button>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        dataSource={transactions}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{ emptyText: <Empty description="No bank transactions" /> }}
        columns={[
          { title: 'Date', dataIndex: 'date', width: 110, render: fmtDate },
          {
            title: 'Account',
            dataIndex: 'bankAccountId',
            render: (id) => accountById.get(id)?.bankName ?? '—',
          },
          { title: 'Ref', dataIndex: 'ref', width: 150 },
          { title: 'Description', dataIndex: 'description', ellipsis: true },
          {
            title: 'Type',
            dataIndex: 'type',
            render: (t) => <Tag color={t === 'Deposit' ? 'green' : 'red'}>{t}</Tag>,
          },
          {
            title: 'Amount',
            dataIndex: 'amount',
            align: 'right',
            render: (v, r) => (
              <Typography.Text type={r.type === 'Deposit' ? 'success' : 'danger'}>
                {r.type === 'Deposit' ? '+' : '-'}
                {fmtETB(v)}
              </Typography.Text>
            ),
          },
          {
            title: 'Reconciliation',
            dataIndex: 'reconStatus',
            render: (s) => <Tag color={reconColor[s as BankTxnReconStatus]}>{s}</Tag>,
          },
        ]}
      />
    </Card>
  );

  const reconciliationTab = (
    <>
      <Card
        title="Reconciliation"
        extra={
          openSession ? (
            <Tooltip
              title={
                unmatched.length > 0
                  ? `${unmatched.length} unmatched transaction(s) must be resolved first`
                  : undefined
              }
            >
              <span>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled={unmatched.length > 0}
                  loading={busy === 'complete'}
                  onClick={() =>
                    runAction(
                      'complete',
                      `/api/bank/recon/${openSession.id}/complete`,
                      'Reconciliation session completed',
                    )
                  }
                >
                  Complete Session
                </Button>
              </span>
            </Tooltip>
          ) : null
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Select
              placeholder="Select bank account"
              style={{ width: 300 }}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              options={accounts.map((a) => ({
                label: `${a.bankName} • ${a.accountNo}`,
                value: a.id,
              }))}
            />
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              Refresh
            </Button>
          </Space>

          {accounts.length === 0 ? (
            <Empty description="Add a bank account to begin reconciliation" />
          ) : !selectedAccountId ? (
            <Empty description="Select a bank account to reconcile" />
          ) : openSession ? (
            <Row gutter={[20, 20]}>
              <Col xs={24} sm={12} xl={8}>
                <StatCard
                  title="Statement Balance"
                  value={fmtETB(openSession.statementBalance)}
                  icon={<BankOutlined style={{ color: colors.info }} />}
                  caption={`As at ${fmtDate(openSession.statementDate)}`}
                />
              </Col>
              <Col xs={24} sm={12} xl={8}>
                <StatCard
                  title="Book Balance"
                  value={fmtETB(openSession.bookBalance)}
                  icon={<DollarOutlined style={{ color: colors.primary }} />}
                  caption={`Started by ${openSession.startedBy}`}
                />
              </Col>
              <Col xs={24} sm={12} xl={8}>
                <StatCard
                  title="Difference"
                  value={fmtETB(openSession.difference)}
                  color={openSession.difference === 0 ? colors.success : colors.danger}
                  caption={`${openSession.matchedCount} matched · ${openSession.unmatchedCount} unmatched`}
                />
              </Col>
            </Row>
          ) : (
            <div className="soft-panel">
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Typography.Text type="secondary">
                  No open reconciliation session for this account.
                </Typography.Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={openStartSession}>
                  Start Session
                </Button>
              </Space>
            </div>
          )}
        </Space>
      </Card>

      {selectedAccountId && (
        <Card
          title="Unmatched Transactions"
          extra={<Tag color={unmatched.length > 0 ? 'gold' : 'green'}>{unmatched.length}</Tag>}
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={unmatched}
            pagination={false}
            size="small"
            locale={{ emptyText: <Empty description="All transactions reconciled" /> }}
            columns={[
              { title: 'Date', dataIndex: 'date', width: 110, render: fmtDate },
              { title: 'Ref', dataIndex: 'ref', width: 150 },
              { title: 'Description', dataIndex: 'description', ellipsis: true },
              {
                title: 'Type',
                dataIndex: 'type',
                render: (t) => <Tag color={t === 'Deposit' ? 'green' : 'red'}>{t}</Tag>,
              },
              { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => fmtETB(v) },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, r) => (
                  <Space>
                    <Button
                      size="small"
                      type="primary"
                      loading={busy === `match-${r.id}`}
                      onClick={() =>
                        runAction(`match-${r.id}`, `/api/bank/recon/${r.id}/match`, 'Transaction matched')
                      }
                    >
                      Match
                    </Button>
                    <Button
                      size="small"
                      loading={busy === `exclude-${r.id}`}
                      onClick={() =>
                        runAction(
                          `exclude-${r.id}`,
                          `/api/bank/recon/${r.id}/exclude`,
                          'Transaction excluded',
                        )
                      }
                    >
                      Exclude
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}

      {selectedAccountId && historySessions.length > 0 && (
        <Card title="Session History">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={historySessions}
            pagination={false}
            size="small"
            columns={[
              { title: 'Statement Date', dataIndex: 'statementDate', width: 140, render: fmtDate },
              { title: 'Statement', dataIndex: 'statementBalance', align: 'right', render: (v) => fmtETB(v) },
              { title: 'Book', dataIndex: 'bookBalance', align: 'right', render: (v) => fmtETB(v) },
              {
                title: 'Difference',
                dataIndex: 'difference',
                align: 'right',
                render: (v) => (
                  <Typography.Text type={v === 0 ? 'success' : 'danger'}>{fmtETB(v)}</Typography.Text>
                ),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                render: (s) => <Tag color={s === 'Open' ? 'blue' : 'green'}>{s}</Tag>,
              },
              { title: 'Completed', dataIndex: 'completedAt', render: (v) => (v ? fmtDate(v) : '—') },
            ]}
          />
        </Card>
      )}
    </>
  );

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Bank accounts, transaction matching and statement reconciliation"
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            Refresh
          </Button>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'accounts', label: 'Bank Accounts', children: accountsTab },
          { key: 'transactions', label: 'Transactions', children: transactionsTab },
          { key: 'recon', label: 'Reconciliation', children: reconciliationTab },
        ]}
      />

      <Modal
        title="Add Bank Account"
        open={accountOpen}
        onCancel={() => setAccountOpen(false)}
        onOk={createAccount}
        okText="Add Account"
        confirmLoading={saving}
        width={640}
      >
        <Form form={accountForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Code required' }]}>
                <Input placeholder="e.g. BNK-004" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Bank Name"
                name="bankName"
                rules={[{ required: true, message: 'Bank name required' }]}
              >
                <Input placeholder="e.g. Awash Bank" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Account No."
                name="accountNo"
                rules={[{ required: true, message: 'Account number required' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Branch" name="branch">
                <Input placeholder="e.g. Bole" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Currency" name="currencyCode" initialValue="ETB">
                <Select options={['ETB', 'USD', 'EUR'].map((c) => ({ label: c, value: c }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Book Balance"
                name="bookBalance"
                initialValue={0}
                rules={[{ required: true, message: 'Book balance required' }]}
              >
                <CurrencyInput style={{ width: '100%' }} min={0} step={1000} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Add Bank Transaction"
        open={txnOpen}
        onCancel={() => setTxnOpen(false)}
        onOk={createTransaction}
        okText="Add Transaction"
        confirmLoading={saving}
        width={640}
      >
        <Form form={txnForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Bank Account"
            name="bankAccountId"
            rules={[{ required: true, message: 'Bank account required' }]}
          >
            <Select
              options={accounts.map((a) => ({
                label: `${a.bankName} • ${a.accountNo}`,
                value: a.id,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Reference" name="ref" rules={[{ required: true, message: 'Reference required' }]}>
                <Input placeholder="e.g. DEP-2026-0916" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Date" name="date" initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="type" initialValue="Deposit" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Deposit', value: 'Deposit' },
                    { label: 'Withdrawal', value: 'Withdrawal' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Amount"
                name="amount"
                rules={[{ required: true, message: 'Amount required' }]}
              >
                <CurrencyInput style={{ width: '100%' }} min={1} step={1000} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Description" name="description">
            <Input placeholder="e.g. Member deposits batch" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Start Reconciliation Session"
        open={sessionOpen}
        onCancel={() => setSessionOpen(false)}
        onOk={startSession}
        okText="Start Session"
        confirmLoading={saving}
      >
        <Form form={sessionForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Bank Account"
            name="bankAccountId"
            rules={[{ required: true, message: 'Bank account required' }]}
          >
            <Select
              disabled
              options={accounts.map((a) => ({
                label: `${a.bankName} • ${a.accountNo}`,
                value: a.id,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Statement Date"
                name="statementDate"
                rules={[{ required: true, message: 'Statement date required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Statement Balance"
                name="statementBalance"
                rules={[{ required: true, message: 'Statement balance required' }]}
              >
                <CurrencyInput style={{ width: '100%' }} step={1000} />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            The difference is calculated as the statement balance less the book balance on the bank
            account.
          </Typography.Text>
        </Form>
      </Modal>
    </ProCard>
  );
}
