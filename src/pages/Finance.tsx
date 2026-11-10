import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  FundOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { CurrencyInput } from '../components/CurrencyInput';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { FixedAsset, GLAccount, GlClass } from '../types';
import { fmtETB } from '../utils/format';

const catColor: Record<string, string> = {
  Asset: 'blue', Liability: 'green', Equity: 'purple', Income: 'cyan', Expense: 'red',
};

export default function Finance() {
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [classes, setClasses] = useState<GlClass[]>([]);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [cash, setCash] = useState<{ total: number; accounts: { code: string; account: string; balance: number; currency: string }[] } | null>(null);
  const [daily, setDaily] = useState<{ rows: { code: string; name: string; debit: number; credit: number }[]; totalDebit: number; totalCredit: number } | null>(null);
  const [incomeStmt, setIncomeStmt] = useState<{ income: { code: string; name: string; amount: number }[]; expense: { code: string; name: string; amount: number }[]; totalIncome: number; totalExpense: number; netSurplus: number } | null>(null);
  const [opening, setOpening] = useState<{ code: string; name: string; balance: number; category: string }[]>([]);
  const [obOpen, setObOpen] = useState<string | null>(null);
  const [importJson, setImportJson] = useState('[{"code":"1000","balance":1245000}]');
  const [assetOpen, setAssetOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [cForm] = Form.useForm();
  const [obForm] = Form.useForm();

  const load = async () => {
    setAccounts(await api<GLAccount[]>('/api/accounting/accounts').catch(() => []));
    setClasses(await api<GlClass[]>('/api/coa/classes').catch(() => []));
    setAssets(await api<FixedAsset[]>('/api/assets').catch(() => []));
    setCash(await api<{ total: number; accounts: { code: string; account: string; balance: number; currency: string }[] }>('/api/finance/cash-position').catch(() => null));
    setDaily(await api<{ rows: { code: string; name: string; debit: number; credit: number }[]; totalDebit: number; totalCredit: number }>('/api/finance/daily-trial-balance').catch(() => null));
    setIncomeStmt(await api<{ income: { code: string; name: string; amount: number }[]; expense: { code: string; name: string; amount: number }[]; totalIncome: number; totalExpense: number; netSurplus: number }>('/api/finance/income-statement').catch(() => null));
    setOpening(await api<{ code: string; name: string; balance: number; category: string }[]>('/api/finance/opening-balance').catch(() => []));
  };

  useEffect(() => { load(); }, []);

  const trialRows = accounts.map((a) => ({
    ...a,
    debit: a.balance > 0 ? a.balance : 0,
    credit: a.balance < 0 ? Math.abs(a.balance) : 0,
  }));
  const trialTotals = trialRows.reduce(
    (s, r) => ({ debit: s.debit + r.debit, credit: s.credit + r.credit }),
    { debit: 0, credit: 0 },
  );

  const income = accounts.filter((a) => a.category === 'Income').reduce((s, a) => s + Math.abs(a.balance), 0);
  const expense = accounts.filter((a) => a.category === 'Expense').reduce((s, a) => s + a.balance, 0);

  const submitAsset = async () => {    const values = await form.validateFields();
    setSaving(true);
    try {
      await api('/api/assets', { method: 'POST', body: JSON.stringify(values) });
      setAssetOpen(false);
      form.resetFields();
      message.success('Asset registered');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const submitClass = async () => {
    const values = await cForm.validateFields();
    setSaving(true);
    try {
      await api('/api/coa/classes', { method: 'POST', body: JSON.stringify(values) });
      setClassOpen(false);
      cForm.resetFields();
      message.success('Class created (Pending)');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const doImport = async () => {
    try {
      const rows = JSON.parse(importJson);
      const res = await api<{ updated: number; total: number }>('/api/coa/import-gl-balance', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
      message.success(`Imported ${res.updated} of ${res.total} balances`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const submitOpening = async () => {    const values = await obForm.validateFields();
    setSaving(true);
    try {
      await api('/api/finance/opening-balance', { method: 'POST', body: JSON.stringify(values) });
      setObOpen(null);
      obForm.resetFields();
      message.success('Opening balance saved');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Finance"
        subtitle="General ledger, financial statements and fixed asset register"
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setClassOpen(true)}>
              New Class
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssetOpen(true)}>
              New Asset
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Debits"
            value={fmtETB(trialTotals.debit)}
            icon={<BankOutlined style={{ color: '#0e7a5f' }} />}
            caption={`Credits ${fmtETB(trialTotals.credit)}`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Income"
            value={fmtETB(income)}
            icon={<ArrowUpOutlined style={{ color: '#12b76a' }} />}
            delta={5.8}
            caption="Period to date"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Expenses"
            value={fmtETB(expense)}
            icon={<ArrowDownOutlined style={{ color: '#f04438' }} />}
            delta={-2.1}
            caption="Period to date"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Net Surplus"
            value={fmtETB(income - expense)}
            icon={<FundOutlined style={{ color: '#2e90fa' }} />}
            caption={`${assets.length} fixed assets`}
          />
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'trial',
            label: 'Trial Balance',
            children: (
              <Card title="Trial Balance">
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={trialRows}
                  pagination={false}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}><Typography.Text strong>Totals</Typography.Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right"><Typography.Text strong>{fmtETB(trialTotals.debit)}</Typography.Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={5} align="right"><Typography.Text strong>{fmtETB(trialTotals.credit)}</Typography.Text></Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 80 },
                    { title: 'Account', dataIndex: 'name' },
                    { title: 'Category', dataIndex: 'category', render: (c: string) => <Tag color={catColor[c]}>{c}</Tag> },
                    { title: 'Balance', dataIndex: 'balance', align: 'right' as const, render: (v: number) => fmtETB(Math.abs(v)) },
                    { title: 'Debit', dataIndex: 'debit', align: 'right' as const, render: (v: number) => (v ? fmtETB(v) : '—') },
                    { title: 'Credit', dataIndex: 'credit', align: 'right' as const, render: (v: number) => (v ? fmtETB(v) : '—') },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'pl',
            label: 'Profit & Loss',
            children: (
              <Card title="Profit & Loss Statement">
                <Row gutter={[20, 20]}>
                  <Col span={8}><Card size="small"><Typography.Text type="secondary">Income</Typography.Text><Typography.Title level={3} style={{ color: '#52c41a', margin: 0 }}>{fmtETB(income)}</Typography.Title></Card></Col>
                  <Col span={8}><Card size="small"><Typography.Text type="secondary">Expenses</Typography.Text><Typography.Title level={3} style={{ color: '#f5222d', margin: 0 }}>{fmtETB(expense)}</Typography.Title></Card></Col>
                  <Col span={8}><Card size="small"><Typography.Text type="secondary">Net Surplus</Typography.Text><Typography.Title level={3} style={{ color: '#0e7a5f', margin: 0 }}>{fmtETB(income - expense)}</Typography.Title></Card></Col>
                </Row>
                <Table
                  size="small"
                  rowKey="id"
                  style={{ marginTop: 16 }}
                  dataSource={accounts.filter((a) => ['Income', 'Expense'].includes(a.category))}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 80 },
                    { title: 'Account', dataIndex: 'name' },
                    { title: 'Category', dataIndex: 'category', render: (c: string) => <Tag color={catColor[c]}>{c}</Tag> },
                    { title: 'Amount', dataIndex: 'balance', align: 'right' as const, render: (v: number) => fmtETB(Math.abs(v)) },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'glreport',
            label: 'GL Reports',
            children: (
              <Card title="General Ledger Report">
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={accounts}
                  pagination={{ pageSize: 12, showSizeChanger: false }}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 90 },
                    { title: 'Account', dataIndex: 'name' },
                    { title: 'Class', dataIndex: 'classId', width: 100, render: (v) => classes.find((c) => String(c.id) === String(v))?.name ?? String(v) },
                    { title: 'Side', dataIndex: 'side', width: 80 },
                    { title: 'Category', dataIndex: 'category', render: (c: string) => <Tag color={catColor[c]}>{c}</Tag> },
                    { title: 'Balance', dataIndex: 'balance', align: 'right' as const, render: (v: number) => fmtETB(v) },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'daily-tb',
            label: 'Daily Trial Balance',
            children: (
              <Card title="Daily Trial Balance">
                <Table
                  size="small"
                  rowKey="code"
                  dataSource={daily?.rows ?? []}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 90 },
                    { title: 'Account', dataIndex: 'name' },
                    { title: 'Debit', dataIndex: 'debit', align: 'right' as const, render: (v: number) => (v ? fmtETB(v) : '—') },
                    { title: 'Credit', dataIndex: 'credit', align: 'right' as const, render: (v: number) => (v ? fmtETB(v) : '—') },
                  ]}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}><Typography.Text strong>Totals</Typography.Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right"><Typography.Text strong>{fmtETB(daily?.totalDebit ?? 0)}</Typography.Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right"><Typography.Text strong>{fmtETB(daily?.totalCredit ?? 0)}</Typography.Text></Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </Card>
            ),
          },
          {
            key: 'income',
            label: 'Income Statement',
            children: (
              <Card title="Income Statement">
                <Row gutter={[20, 20]}>
                  <Col span={8}><Card size="small"><Typography.Text type="secondary">Total Income</Typography.Text><Typography.Title level={3} style={{ color: '#52c41a', margin: 0 }}>{fmtETB(incomeStmt?.totalIncome ?? 0)}</Typography.Title></Card></Col>
                  <Col span={8}><Card size="small"><Typography.Text type="secondary">Total Expenses</Typography.Text><Typography.Title level={3} style={{ color: '#f5222d', margin: 0 }}>{fmtETB(incomeStmt?.totalExpense ?? 0)}</Typography.Title></Card></Col>
                  <Col span={8}><Card size="small"><Typography.Text type="secondary">Net Surplus</Typography.Text><Typography.Title level={3} style={{ color: '#0e7a5f', margin: 0 }}>{fmtETB(incomeStmt?.netSurplus ?? 0)}</Typography.Title></Card></Col>
                </Row>
                <Table
                  size="small"
                  rowKey="code"
                  style={{ marginTop: 16 }}
                  dataSource={[
                    ...(incomeStmt?.income ?? []).map((r) => ({ ...r, group: 'Income' })),
                    ...(incomeStmt?.expense ?? []).map((r) => ({ ...r, group: 'Expense' })),
                  ]}
                  pagination={false}
                  columns={[
                    { title: 'Group', dataIndex: 'group', width: 110, render: (g: string) => <Tag color={g === 'Income' ? 'cyan' : 'red'}>{g}</Tag> },
                    { title: 'Code', dataIndex: 'code', width: 90 },
                    { title: 'Account', dataIndex: 'name' },
                    { title: 'Amount', dataIndex: 'amount', align: 'right' as const, render: (v: number) => fmtETB(Math.abs(v)) },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'cash',
            label: 'Cash Position',
            children: (
              <Card title={`Cash Position — ${fmtETB(cash?.total ?? 0)}`}>
                <Table
                  size="small"
                  rowKey="code"
                  dataSource={cash?.accounts ?? []}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 90 },
                    { title: 'Account', dataIndex: 'account' },
                    { title: 'Currency', dataIndex: 'currency', width: 100 },
                    { title: 'Balance', dataIndex: 'balance', align: 'right' as const, render: (v: number) => fmtETB(v) },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'opening',
            label: 'Opening Balance',
            children: (
              <Card title="Opening Balances">
                <Table
                  size="small"
                  rowKey="code"
                  dataSource={opening}
                  pagination={{ pageSize: 12, showSizeChanger: false }}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 90 },
                    { title: 'Account', dataIndex: 'name' },
                    { title: 'Category', dataIndex: 'category', width: 120, render: (c: string) => <Tag color={catColor[c]}>{c}</Tag> },
                    { title: 'Balance', dataIndex: 'balance', align: 'right' as const, render: (v: number) => fmtETB(v) },
                    {
                      title: 'Action',
                      width: 110,
                      render: (_: unknown, r: { code: string; name: string; balance: number }) => (
                        <Button size="small" onClick={() => { setObOpen(r.code); obForm.setFieldsValue({ code: r.code, amount: r.balance }); }}>Set</Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'import-coa',
            label: 'Import GL Balance',
            children: (
              <Card title="Import GL Balance">
                <Typography.Paragraph type="secondary">
                  Paste rows as a JSON array of <code>{'{code, balance}'}</code> objects. Balances are set on the matching GL accounts.
                </Typography.Paragraph>
                <Input.TextArea
                  rows={6}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='[{"code":"1000","balance":1500000}]'
                />
                <Button type="primary" style={{ marginTop: 12 }} onClick={doImport}>Import Balances</Button>
              </Card>
            ),
          },
          {
            key: 'coa',
            label: 'Chart of Accounts (Hierarchical)',
            children: (
              <Card
                title="GL Classes & Leaves"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setClassOpen(true)}>New Class</Button>}
              >
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Row gutter={[20, 20]}>
                    {classes.map((c) => (
                      <Col span={8} key={c.id}>
                        <Card size="small">
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Typography.Text strong>{c.name}</Typography.Text>
                            <Tag color={c.status === 'Verified' ? 'green' : 'gold'}>{c.status}</Tag>
                          </Space>
                          {accounts.filter((a) => String(a.classId) === String(c.id)).map((a) => (
                            <div key={a.id} style={{ padding: '2px 0', fontSize: 12 }}>
                              <Tag style={{ marginRight: 4 }}>{a.code}</Tag>{a.name}
                            </div>
                          ))}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Space>
              </Card>
            ),
          },
          {
            key: 'assets',
            label: 'Asset Management',
            children: (
              <Card title="Fixed Assets & Depreciation" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAssetOpen(true)}>New Asset</Button>}>
                <Table
                  rowKey="id"
                  dataSource={assets}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 100 },
                    { title: 'Asset', dataIndex: 'name' },
                    { title: 'Value', dataIndex: 'value', align: 'right' as const, render: (v: number) => fmtETB(v) },
                    { title: 'Depr. Rate %', dataIndex: 'depreciationRate', align: 'right' as const, render: (v: number) => `${v}%` },
                    { title: 'DPR Link', dataIndex: 'dprLink', width: 90 },
                    { title: 'GL', dataIndex: 'glLink', width: 90 },
                    { title: 'Branch', dataIndex: 'branch' },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag>{s}</Tag> },
                    {
                      title: 'Action',
                      width: 130,
                      render: (_: unknown, r: FixedAsset) => (
                        <Button size="small" onClick={async () => { await api(`/api/assets/${r.id}/depreciate`, { method: 'POST' }); message.success('Depreciation applied'); await load(); }}>Depreciate</Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Asset modal */}
      <Modal title="New Fixed Asset" open={assetOpen} onCancel={() => setAssetOpen(false)} onOk={submitAsset} okText="Register Asset" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Value (ETB)" name="value" rules={[{ required: true }]}><CurrencyInput style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Depreciation Rate %" name="depreciationRate" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} step={0.5} /></Form.Item></Col>
            <Col span={12}><Form.Item label="DPR Link" name="dprLink"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="GL Link" name="glLink"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Class modal */}
      <Modal title="New GL Class" open={classOpen} onCancel={() => setClassOpen(false)} onOk={submitClass} okText="Create Class" confirmLoading={saving}>
        <Form form={cForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Class Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Assets" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Opening balance modal */}
      <Modal title={`Set Opening Balance${obOpen ? ` — ${obOpen}` : ''}`} open={!!obOpen} onCancel={() => setObOpen(null)} onOk={submitOpening} okText="Save" confirmLoading={saving}>
        <Form form={obForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="GL Code" name="code" hidden><Input /></Form.Item>
          <Form.Item label="Opening Balance (ETB)" name="amount" rules={[{ required: true }]}>
            <CurrencyInput style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}