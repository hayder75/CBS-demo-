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
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, SwapOutlined, UndoOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { Payment, PaymentMode, SavingsAccount } from '../types';
import { fmtETB } from '../utils/format';

const statusTag = (s: string) => (
  <Tag color={s === 'Authorized' ? 'green' : s === 'Pending' ? 'gold' : s === 'Reversed' ? 'purple' : 'red'}>{s}</Tag>
);

const kindTag = (k: string) => <Tag>{k}</Tag>;

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [modes, setModes] = useState<PaymentMode[]>([]);
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setPayments(await api<Payment[]>('/api/payments').catch(() => []));
    setModes(await api<PaymentMode[]>('/api/payment-modes').catch(() => []));
    setAccounts(await api<SavingsAccount[]>('/api/accounts').catch(() => []));
  };

  useEffect(() => { load(); }, []);

  const pending = useMemo(() => payments.filter((p) => p.status === 'Pending'), [payments]);

  const act = async (path: string, msg: string) => {
    await api(path, { method: 'POST' });
    message.success(msg);
    await load();
  };

  const submit = async (kind: string) => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await api<Payment>('/api/payments', {
        method: 'POST',
        body: JSON.stringify({ ...values, kind }),
      });
      setOpen(null);
      form.resetFields();
      message.success(res.status === 'Authorized' ? 'Payment posted' : 'Payment submitted — pending authorization');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const paymentCols = [
    { title: 'No', dataIndex: 'paymentNo', width: 120 },
    { title: 'Kind', dataIndex: 'kind', width: 130, render: kindTag },
    { title: 'Account', dataIndex: 'accountId', width: 110 },
    { title: 'From', dataIndex: 'fromRef' },
    { title: 'To', dataIndex: 'toRef', ellipsis: true },
    { title: 'Amount', dataIndex: 'amount', align: 'right' as const, render: (v: number) => fmtETB(v) },
    { title: 'Mode', dataIndex: 'paymentModeId', width: 90 },
    { title: 'Maker', dataIndex: 'createdBy', width: 120 },
    { title: 'Status', dataIndex: 'status', width: 110, render: statusTag },
  ];

  const accountSelect = (
    <Form.Item label="Account" name="accountId" rules={[{ required: true }]}>
      <Select
        showSearch
        optionFilterProp="label"
        placeholder="Select savings account"
        options={accounts.map((a) => ({ label: `${a.accountNo} (M${a.memberId})`, value: Number(a.id) }))}
      />
    </Form.Item>
  );

  const amountField = (
    <Form.Item label="Amount (ETB)" name="amount" rules={[{ required: true, message: 'Amount required' }]}>
      <InputNumber style={{ width: '100%' }} min={1} step={100} />
    </Form.Item>
  );

  const modeField = (
    <Form.Item label="Payment Mode" name="paymentModeId" rules={[{ required: true }]}>
      <Select
        placeholder="Cash or non-cash"
        options={modes.filter((m) => m.status === 'Verified').map((m) => ({ label: `${m.name} (${m.paymentType})`, value: Number(m.id) }))}
      />
    </Form.Item>
  );

  const sharedModal = (kind: string, title: string) => (
    <Modal
      title={title}
      open={open === kind}
      onCancel={() => setOpen(null)}
      onOk={() => submit(kind)}
      okText={kind === 'WITHDRAWAL' || kind === 'TRANSFER' ? 'Submit for Authorization' : 'Submit'}
      confirmLoading={saving}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {accountSelect}
          {modeField}
          {amountField}
          <Form.Item label="Description" name="description">
            <Input placeholder="Optional description" />
          </Form.Item>
          <Typography.Text type="secondary">
            Cash withdrawals require an open till; non-cash modes route through a bank. Transactions
            await checker authorization (maker-checker).
          </Typography.Text>
        </Space>
      </Form>
    </Modal>
  );

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">Total Payments</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{payments.length}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">Pending Authorization</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#faad14' }}>{pending.length}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Typography.Text type="secondary">Volume (all)</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#0e7a5f' }}>
              {fmtETB(payments.reduce((s, p) => s + p.amount, 0))}
            </Typography.Title>
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'operations',
            label: 'Payment Operations',
            children: (
              <Row gutter={[16, 16]}>
                {[
                  { kind: 'DEPOSIT', name: 'Deposit', color: '#52c41a' },
                  { kind: 'WITHDRAWAL', name: 'Withdrawal', color: '#f5222d' },
                  { kind: 'TRANSFER', name: 'Transfer', color: '#1890ff' },
                ].map((k) => (
                  <Col xs={24} sm={8} key={k.kind}>
                    <Card>
                      <Space direction="vertical" size={12}>
                        <Typography.Text strong style={{ color: k.color }}>{k.name}</Typography.Text>
                        <Typography.Text type="secondary">
                          {k.kind === 'DEPOSIT' && 'Cash or interbank deposits to member savings.'}
                          {k.kind === 'WITHDRAWAL' && 'Cash, cheque or GL withdrawals.'}
                          {k.kind === 'TRANSFER' && 'Account-to-account, share, and GL-GL transfers.'}
                        </Typography.Text>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(k.kind)}>
                          New {k.name}
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                ))}
                <Col xs={24} sm={8}>
                  <Card>
                    <Space direction="vertical" size={12}>
                      <Typography.Text strong style={{ color: '#722ed1' }}>Mass Transfer</Typography.Text>
                      <Typography.Text type="secondary">One-to-many, many-to-one and GL mass transfers (CSV).</Typography.Text>
                      <Button icon={<SwapOutlined />} onClick={() => setOpen('MASS')}>Mass Transfer</Button>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Space direction="vertical" size={12}>
                      <Typography.Text strong style={{ color: '#fa8c16' }}>Adjustment Entry</Typography.Text>
                      <Typography.Text type="secondary">Correct customer or GL balances (accruals / corrections).</Typography.Text>
                      <Button icon={<SwapOutlined />} onClick={() => setOpen('ADJUSTMENT')}>Adjustment</Button>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Space direction="vertical" size={12}>
                      <Typography.Text strong style={{ color: '#13c2c2' }}>Branch Claims</Typography.Text>
                      <Typography.Text type="secondary">Inter-branch credit/debit claims for reconciliation.</Typography.Text>
                      <Button icon={<SwapOutlined />} onClick={() => setOpen('BRANCH_CLAIM')}>Branch Claim</Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'txns',
            label: 'Transactions',
            children: (
              <Card title="All Transactions">
                <Table rowKey="id" dataSource={payments} columns={paymentCols} pagination={{ pageSize: 10, showSizeChanger: false }} />
              </Card>
            ),
          },
          {
            key: 'authorization',
            label: 'Authorization',
            children: (
              <Card title="Authorization Queue — Checker">
                <Table
                  rowKey="id"
                  dataSource={pending}
                  pagination={false}
                  columns={[
                    { title: 'No', dataIndex: 'paymentNo', width: 120 },
                    { title: 'Kind', dataIndex: 'kind', width: 130, render: kindTag },
                    { title: 'Account', dataIndex: 'accountId', width: 110 },
                    { title: 'From', dataIndex: 'fromRef' },
                    { title: 'To', dataIndex: 'toRef' },
                    { title: 'Amount', dataIndex: 'amount', align: 'right' as const, render: (v: number) => fmtETB(v) },
                    { title: 'Maker', dataIndex: 'createdBy', width: 120 },
                    {
                      title: 'Action',
                      width: 160,
                      render: (_: unknown, r: Payment) => (
                        <Space>
                          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => act(`/api/payments/${r.id}/authorize`, 'Authorized')}>Authorize</Button>
                          <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => act(`/api/payments/${r.id}/reject`, 'Rejected')}>Reject</Button>
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'reversal',
            label: 'Reversal',
            children: (
              <Card title="Authorized Transactions — Reverse (Teller/Checker)">
                <Table
                  rowKey="id"
                  dataSource={payments.filter((p) => p.status === 'Authorized')}
                  pagination={false}
                  columns={[
                    { title: 'No', dataIndex: 'paymentNo', width: 120 },
                    { title: 'Kind', dataIndex: 'kind', width: 130 },
                    { title: 'Account', dataIndex: 'accountId', width: 110 },
                    { title: 'Amount', dataIndex: 'amount', align: 'right' as const, render: (v: number) => fmtETB(v) },
                    { title: 'Authorized', dataIndex: 'authorizedBy', width: 120 },
                    {
                      title: 'Action',
                      width: 110,
                      render: (_: unknown, r: Payment) => (
                        <Button size="small" danger icon={<UndoOutlined />} onClick={() => act(`/api/payments/${r.id}/reverse`, 'Reversed')}>Reverse</Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Standard modals */}
      {['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map((k) =>
        sharedModal(k, `New ${k.charAt(0) + k.slice(1).toLowerCase()}`),
      )}

      {/* Mass transfer modal */}
      <Modal title="Mass Transfer" open={open === 'MASS'} onCancel={() => setOpen(null)} onOk={() => submit('TRANSFER')} okText="Submit Mass Transfer" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {amountField}
            {modeField}
            <Form.Item label="Description" name="description">
              <Input placeholder="Mass transfer description" />
            </Form.Item>
            <Typography.Text type="secondary">
              Use Import CSV for one-to-many / many-to-one customer & GL legs (full build). This demo
              posts a single representative transfer row.
            </Typography.Text>
          </Space>
        </Form>
      </Modal>

      {/* Adjustment modal */}
      <Modal title="Adjustment Entry" open={open === 'ADJUSTMENT'} onCancel={() => setOpen(null)} onOk={() => submit('ADJUSTMENT')} okText="Submit Adjustment" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {accountSelect}
            {amountField}
            <Form.Item label="Adjustment Reason" name="description" rules={[{ required: true }]}>
              <Input placeholder="e.g. correction of miscoded debit" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* Branch claim modal */}
      <Modal title="Branch Claim" open={open === 'BRANCH_CLAIM'} onCancel={() => setOpen(null)} onOk={() => submit('BRANCH_CLAIM')} okText="Submit Claim" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Form.Item label="Amount (ETB)" name="amount" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
            <Form.Item label="Other Branch GL / Home Branch GL" name="description"><Input placeholder="e.g. credit other branch claim (dr self)" /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </ProCard>
  );
}