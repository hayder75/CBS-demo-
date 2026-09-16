import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  ArrowDownOutlined,
  FieldTimeOutlined,
  MoneyCollectOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { CurrencyInput } from '../components/CurrencyInput';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { colors } from '../theme';
import { api } from '../api/client';
import type { Member, SavingsProduct, SavingsTransaction } from '../types';
import { fmtETB } from '../utils/format';

const typeColor: Record<SavingsTransaction['type'], string> = {
  Deposit: 'green',
  Withdrawal: 'red',
  'Transfer In': 'blue',
  'Transfer Out': 'orange',
  Interest: 'purple',
  Dividend: 'gold',
};

export default function Savings() {
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [txns, setTxns] = useState<SavingsTransaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [productFilter, setProductFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const [productOpen, setProductOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositType, setDepositType] = useState<'Deposit' | 'Withdrawal'>('Deposit');
  const [saving, setSaving] = useState(false);
  const [interestRunning, setInterestRunning] = useState(false);
  const [productForm] = Form.useForm();
  const [txForm] = Form.useForm();

  const load = async () => {
    const [p, t, m] = await Promise.all([
      api<SavingsProduct[]>('/api/savings/products'),
      api<SavingsTransaction[]>('/api/savings/transactions'),
      api<Member[]>('/api/members'),
    ]);
    setProducts(p);
    setTxns(t);
    setMembers(m);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const totals = useMemo(
    () => ({
      deposits: txns.filter((t) => t.type === 'Deposit').reduce((s, t) => s + t.amount, 0),
      withdrawals: txns.filter((t) => t.type === 'Withdrawal').reduce((s, t) => s + t.amount, 0),
      interest: txns.filter((t) => t.type === 'Interest').reduce((s, t) => s + t.amount, 0),
    }),
    [txns],
  );

  const filtered = useMemo(
    () =>
      txns.filter(
        (t) =>
          (!productFilter || t.productId === productFilter) &&
          (!typeFilter || t.type === typeFilter),
      ),
    [txns, productFilter, typeFilter],
  );

  const productTotals = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const val = txns
        .filter((t) => t.productId === p.id && t.type === 'Deposit')
        .reduce((s, t) => s + t.amount, 0);
      map.set(p.id, val);
    });
    return map;
  }, [products, txns]);

  const createProduct = async () => {
    const values = await productForm.validateFields();
    setSaving(true);
    try {
      await api('/api/savings/products', { method: 'POST', body: JSON.stringify(values) });
      setProductOpen(false);
      productForm.resetFields();
      message.success('Savings product created');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openTxn = (type: 'Deposit' | 'Withdrawal') => {
    setDepositType(type);
    txForm.setFieldsValue({ type });
    setDepositOpen(true);
  };

  const postTxn = async () => {
    const values = await txForm.validateFields();
    setSaving(true);
    try {
      await api('/api/savings/transactions', { method: 'POST', body: JSON.stringify(values) });
      setDepositOpen(false);
      txForm.resetFields();
      message.success(`${depositType} posted`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const runInterest = async () => {
    setInterestRunning(true);
    try {
      const res = await api<{ posted: number }>('/api/savings/interest', { method: 'POST' });
      message.success(`Interest posted for ${res.posted} member(s)`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setInterestRunning(false);
    }
  };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Savings"
        subtitle="Savings products, deposit and withdrawal activity across the SACCO"
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setProductOpen(true)}>
              New Product
            </Button>
            <Popconfirm
              title="Post monthly interest?"
              description="Credits interest to eligible members and posts GL entries."
              onConfirm={runInterest}
            >
              <Button icon={<FieldTimeOutlined />} loading={interestRunning}>
                Run Interest Posting
              </Button>
            </Popconfirm>
            <Button type="primary" icon={<MoneyCollectOutlined />} onClick={() => openTxn('Deposit')}>
              New Deposit
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Deposits (period)"
            value={fmtETB(totals.deposits)}
            icon={<MoneyCollectOutlined style={{ color: colors.success }} />}
            delta={6.4}
            caption="Compared to last period"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Withdrawals (period)"
            value={fmtETB(totals.withdrawals)}
            icon={<ArrowDownOutlined style={{ color: colors.danger }} />}
            delta={-2.8}
            caption="Compared to last period"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Interest Posted"
            value={fmtETB(totals.interest)}
            icon={<SaveOutlined style={{ color: '#7a5af8' }} />}
            caption="Latest monthly posting run"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Savings Products"
            value={products.length}
            icon={<AppstoreOutlined style={{ color: colors.info }} />}
            caption={`${txns.length} transactions recorded`}
          />
        </Col>
      </Row>

      <Card title="Savings Products">
        <Row gutter={[20, 20]}>
          {products.map((p) => (
            <Col xs={24} sm={12} lg={8} key={p.id}>
              <Card size="small">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Typography.Text strong>{p.name}</Typography.Text>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {p.code} · {p.type}
                      {p.noticePeriodDays ? ` · ${p.noticePeriodDays}d notice` : ''}
                    </div>
                  </div>
                  <Tag color="blue">{p.interestRatePct}% p.a.</Tag>
                </Space>
                <Row style={{ marginTop: 8 }} justify="space-between">
                  <Typography.Text type="secondary">Min balance</Typography.Text>
                  <Typography.Text>{fmtETB(p.minBalance)}</Typography.Text>
                </Row>
                <Row justify="space-between">
                  <Typography.Text type="secondary">Deposits (period)</Typography.Text>
                  <Typography.Text strong>{fmtETB(productTotals.get(p.id) ?? 0)}</Typography.Text>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title="Savings Transactions"
        extra={
          <Space>
            <Select
              placeholder="Product"
              allowClear
              style={{ width: 180 }}
              value={productFilter}
              onChange={setProductFilter}
              options={products.map((p) => ({ label: p.name, value: p.id }))}
            />
            <Select
              placeholder="Type"
              allowClear
              style={{ width: 150 }}
              value={typeFilter}
              onChange={setTypeFilter}
              options={['Deposit', 'Withdrawal', 'Transfer In', 'Transfer Out', 'Interest', 'Dividend'].map((t) => ({ label: t, value: t }))}
            />
            <Button icon={<ArrowDownOutlined />} onClick={() => openTxn('Withdrawal')}>
              Withdraw
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            { title: 'Date', dataIndex: 'date', width: 110 },
            {
              title: 'Member',
              dataIndex: 'memberId',
              ellipsis: true,
              render: (v) => (
                <Typography.Text>
                  {members.find((m) => String(m.id) === String(v))?.fullName ?? String(v).toUpperCase()}
                </Typography.Text>
              ),
            },
            {
              title: 'Product',
              dataIndex: 'productId',
              ellipsis: true,
              render: (v) => {
                const p = products.find((x) => String(x.id) === String(v));
                return p ? `${p.name}` : String(v);
              },
            },
            { title: 'Type', dataIndex: 'type', render: (t) => <Tag color={typeColor[t as SavingsTransaction["type"]]}>{String(t)}</Tag> },
            { title: 'Channel', dataIndex: 'channel' },
            { title: 'Teller', dataIndex: 'teller' },
            { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => fmtETB(v) },
          ]}
        />
      </Card>

      <Modal
        title="New Savings Product"
        open={productOpen}
        onCancel={() => setProductOpen(false)}
        onOk={createProduct}
        okText="Create Product"
        confirmLoading={saving}
      >
        <Form form={productForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Code" name="code" rules={[{ required: true }]}>
                <Input placeholder="S-VOL-2" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Business Savings" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="type" rules={[{ required: true }]} initialValue="Voluntary">
                <Select options={['Mandatory', 'Voluntary', 'Holiday', 'Fixed'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Interest Rate (% p.a.)" name="interestRatePct" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Minimum Balance (ETB)" name="minBalance" initialValue={0}>
                <CurrencyInput style={{ width: '100%' }} min={0} step={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Notice Period (days)" name="noticePeriodDays">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={depositType === 'Deposit' ? 'Record Cash Deposit' : 'Process Withdrawal'}
        open={depositOpen}
        onCancel={() => setDepositOpen(false)}
        onOk={postTxn}
        okText="Post Transaction"
        confirmLoading={saving}
      >
        <Form form={txForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Member" name="memberId" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select member"
              options={members.map((m) => ({ label: `${m.fullName} (${m.memberNo})`, value: m.id }))}
            />
          </Form.Item>
          <Form.Item label="Product" name="productId" rules={[{ required: true }]}>
            <Select options={products.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Amount (ETB)" name="amount" rules={[{ required: true, message: 'Amount required' }]}>
                <CurrencyInput style={{ width: '100%' }} min={1} step={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="type" hidden>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            {depositType === 'Deposit'
              ? 'Posts Debit Cash / Credit Member Savings with a matching GL journal entry.'
              : 'Validates balance and minimum-balance rules before posting. Large withdrawals require manager approval.'}
          </Typography.Text>
        </Form>
      </Modal>
    </ProCard>
  );
}