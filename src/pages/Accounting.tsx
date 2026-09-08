import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import {
  BankOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  PlusOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { GLAccount, JournalEntry } from '../types';
import { fmtETB } from '../utils/format';

const categoryColor: Record<GLAccount['category'], string> = {
  Asset: 'blue',
  Liability: 'green',
  Equity: 'purple',
  Income: 'cyan',
  Expense: 'red',
};

export default function Accounting() {
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [view, setView] = useState<'trial' | 'bs' | 'is'>('trial');
  const [entryOpen, setEntryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entryForm] = Form.useForm();

  const load = async () => {
    const [a, j] = await Promise.all([
      api<GLAccount[]>('/api/accounting/accounts'),
      api<JournalEntry[]>('/api/accounting/journal'),
    ]);
    setAccounts(a);
    setJournal(j);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const postEntry = async () => {
    const values = await entryForm.validateFields();
    setSaving(true);
    try {
      await api('/api/accounting/journal', {
        method: 'POST',
        body: JSON.stringify({ ...values, date: values.date?.format('YYYY-MM-DD') }),
      });
      setEntryOpen(false);
      entryForm.resetFields();
      message.success('Balanced journal entry posted');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    const assets = accounts.filter((a) => a.category === 'Asset').reduce((s, a) => s + a.balance, 0);
    const liabilities = accounts.filter((a) => a.category === 'Liability').reduce((s, a) => s + Math.abs(a.balance), 0);
    const equity = accounts.filter((a) => a.category === 'Equity').reduce((s, a) => s + Math.abs(a.balance), 0);
    const income = accounts.filter((a) => a.category === 'Income').reduce((s, a) => s + Math.abs(a.balance), 0);
    const expense = accounts.filter((a) => a.category === 'Expense').reduce((s, a) => s + a.balance, 0);
    const surplus = income - expense;
    return { assets, liabilities, equity, income, expense, surplus };
  }, [accounts]);

  const trialRows = accounts.map((a) => ({
    ...a,
    debit: a.balance > 0 ? a.balance : 0,
    credit: a.balance < 0 ? Math.abs(a.balance) : 0,
  }));

  const trialTotals = trialRows.reduce(
    (s, r) => ({ debit: s.debit + r.debit, credit: s.credit + r.credit }),
    { debit: 0, credit: 0 },
  );

  const bsRows = accounts
    .filter((a) => ['Asset', 'Liability', 'Equity'].includes(a.category))
    .map((a) => ({
      ...a,
      amount: a.balance > 0 ? a.balance : Math.abs(a.balance),
      side: a.category === 'Asset' ? 'Debit' : 'Credit',
    }));

  const bsTotals = bsRows.reduce(
    (s, r) => (r.side === 'Debit' ? { ...s, debit: s.debit + r.amount } : { ...s, credit: s.credit + r.amount }),
    { debit: 0, credit: 0 },
  );

  const isRows = accounts
    .filter((a) => ['Income', 'Expense'].includes(a.category))
    .map((a) => ({ ...a, amount: Math.abs(a.balance) }));

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Total Assets</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              <BankOutlined /> {fmtETB(totals.assets)}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Liabilities</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              {fmtETB(totals.liabilities)}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Equity & Reserves</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#722ed1' }}>
              {fmtETB(totals.equity)}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Surplus (Income − Expense)</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#0e7a5f' }}>
              <RiseOutlined /> {fmtETB(totals.surplus)}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <CalculatorOutlined /> General Ledger & Statements
          </Space>
        }
        extra={
          <Space>
            <Segmented
              value={view}
              onChange={(v) => setView(v as typeof view)}
              options={[
                { label: 'Trial Balance', value: 'trial' },
                { label: 'Balance Sheet', value: 'bs' },
                { label: 'Income Statement', value: 'is' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEntryOpen(true)}>
              New Journal Entry
            </Button>
          </Space>
        }
      >
        {view === 'trial' && (
          <Table
            size="small"
            rowKey="id"
            dataSource={trialRows}
            pagination={false}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <Typography.Text strong>Totals</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Typography.Text strong>{fmtETB(trialTotals.debit)}</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Typography.Text strong>{fmtETB(trialTotals.credit)}</Typography.Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
            columns={[
              { title: 'Code', dataIndex: 'code', width: 80 },
              { title: 'Account', dataIndex: 'name' },
              { title: 'Category', dataIndex: 'category', render: (c) => <Tag color={categoryColor[c as GLAccount["category"]]}>{String(c)}</Tag> },
              { title: 'Balance', dataIndex: 'balance', align: 'right', render: (v) => fmtETB(Math.abs(v)) },
              { title: 'Debit', dataIndex: 'debit', align: 'right', render: (v) => (v ? fmtETB(v) : '—') },
              { title: 'Credit', dataIndex: 'credit', align: 'right', render: (v) => (v ? fmtETB(v) : '—') },
            ]}
          />
        )}

        {view === 'bs' && (
          <>
            <Table
              size="small"
              rowKey="id"
              dataSource={bsRows}
              pagination={false}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Typography.Text strong>Totals</Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Typography.Text strong>{fmtETB(bsTotals.debit)}</Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Typography.Text strong>{fmtETB(bsTotals.credit)}</Typography.Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
              columns={[
                { title: 'Code', dataIndex: 'code', width: 80 },
                { title: 'Account', dataIndex: 'name' },
                { title: 'Category', dataIndex: 'category', render: (c) => <Tag color={categoryColor[c as GLAccount["category"]]}>{String(c)}</Tag> },
                { title: 'Assets / Debit', dataIndex: 'amount', align: 'right', render: (v, r) => (r.side === 'Debit' ? <strong>{fmtETB(v)}</strong> : '—') },
                { title: 'Liab+Equity / Credit', dataIndex: 'amount', align: 'right', render: (v, r) => (r.side === 'Credit' ? <strong>{fmtETB(v)}</strong> : '—') },
              ]}
            />
            <AlertInfo
              text="Balance Sheet totals balance automatically from double-entry GL. Unbalanced books are flagged before closings."
            />
          </>
        )}

        {view === 'is' && (
          <>
            <Table
              size="small"
              rowKey="id"
              dataSource={isRows}
              pagination={false}
              columns={[
                { title: 'Code', dataIndex: 'code', width: 80 },
                { title: 'Account', dataIndex: 'name' },
                { title: 'Category', dataIndex: 'category', render: (c) => <Tag color={categoryColor[c as GLAccount["category"]]}>{String(c)}</Tag> },
                { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v, r) => (r.category === 'Income' ? <span style={{ color: '#52c41a' }}>{fmtETB(v)}</span> : <span style={{ color: '#f5222d' }}>{fmtETB(v)}</span>) },
              ]}
            />
            <Row style={{ marginTop: 12 }} justify="end">
              <Col>
                <Space direction="vertical" align="end">
                  <Typography.Text>Income: <strong>{fmtETB(totals.income)}</strong></Typography.Text>
                  <Typography.Text>Expenses: <strong>{fmtETB(totals.expense)}</strong></Typography.Text>
                  <Typography.Text strong style={{ color: '#0e7a5f', fontSize: 16 }}>
                    <FileTextOutlined /> Operating Surplus: {fmtETB(totals.surplus)}
                  </Typography.Text>
                </Space>
              </Col>
            </Row>
          </>
        )}
      </Card>

      <Card title="General Ledger Journal">
        <Table
          size="small"
          rowKey="id"
          dataSource={journal}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            { title: 'Date', dataIndex: 'date', width: 100 },
            { title: 'Ref', dataIndex: 'ref', width: 130 },
            { title: 'Description', dataIndex: 'description', ellipsis: true },
            { title: 'Account', dataIndex: 'accountName' },
            { title: 'Debit', dataIndex: 'debit', align: 'right', render: (v) => (v ? fmtETB(v) : '—') },
            { title: 'Credit', dataIndex: 'credit', align: 'right', render: (v) => (v ? fmtETB(v) : '—') },
            { title: 'Posted by', dataIndex: 'postedBy', width: 130 },
          ]}
        />
      </Card>

      <Modal
        title="New Journal Entry (double-entry)"
        open={entryOpen}
        onCancel={() => setEntryOpen(false)}
        onOk={postEntry}
        okText="Post Entry"
        confirmLoading={saving}
        width={620}
      >
        <Form form={entryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Date" name="date" rules={[{ required: true }]} initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Reference" name="ref">
                <Input placeholder="JRN-2026-XXXX (auto if blank)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input placeholder="What does this entry record?" />
              </Form.Item>
            </Col>
          </Row>
          <Card size="small" title="Debit leg">
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item label="Debit Account" name="debitAccountCode" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={accounts.map((a) => ({ label: `${a.code} — ${a.name} (${a.category})`, value: a.code }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Debit Amount" name="debit" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={1} step={100} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card size="small" title="Credit leg" style={{ marginTop: 12 }}>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item label="Credit Account" name="creditAccountCode" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={accounts.map((a) => ({ label: `${a.code} — ${a.name} (${a.category})`, value: a.code }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Credit Amount" name="credit" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={1} step={100} />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
            Debits and credits must be equal. Both GL account balances update atomically.
          </Typography.Text>
        </Form>
      </Modal>
    </ProCard>
  );
}

function AlertInfo({ text }: { text: string }) {
  return (
    <Typography.Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
      {text}
    </Typography.Paragraph>
  );
}