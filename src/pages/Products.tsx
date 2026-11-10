import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
  Tabs,
} from 'antd';
import {
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  PieChartOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { CurrencyInput } from '../components/CurrencyInput';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { Charge, SavingsFeeRunResult, ShareCategory, SavingsProduct } from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

const statusCol = (s: string) => (
  <Tag color={s === 'Verified' || s === 'Active' ? 'green' : s === 'Pending' ? 'gold' : 'default'}>{s}</Tag>
);

interface ProductTypeRow {
  id: string | number;
  code: string;
  name: string;
  category: string;
  description?: string;
  status: string;
}

export default function Products() {
  const [savingsProducts, setSavingsProducts] = useState<SavingsProduct[]>([]);
  const [shareCategories, setShareCategories] = useState<ShareCategory[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [productTypes, setProductTypes] = useState<ProductTypeRow[]>([]);

  const [spOpen, setSpOpen] = useState(false);
  const [scOpen, setScOpen] = useState(false);
  const [chOpen, setChOpen] = useState(false);
  const [ptOpen, setPtOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<'interest' | 'fees' | null>(null);
  const [spForm] = Form.useForm();
  const [scForm] = Form.useForm();
  const [chForm] = Form.useForm();
  const [ptForm] = Form.useForm();
  const overdraftAllowed = Form.useWatch('overdraftAllowed', spForm) ?? false;

  const load = async () => {
    setSavingsProducts(await api<SavingsProduct[]>('/api/savings/products').catch(() => []));
    setShareCategories(await api<ShareCategory[]>('/api/share-categories').catch(() => []));
    setCharges(await api<Charge[]>('/api/charges').catch(() => []));
    setProductTypes(await api<ProductTypeRow[]>('/api/product-types').catch(() => []));
  };

  useEffect(() => { load(); }, []);

  const post = async (form: any, path: string, values: Record<string, unknown>, close: () => void) => {
    setSaving(true);
    try {
      await api(path, { method: 'POST', body: JSON.stringify(values) });
      close();
      form.resetFields();
      message.success('Created — verify to activate');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const verify = async (path: string) => {
    await api(path, { method: 'POST' });
    message.success('Verified');
    await load();
  };

  const runInterest = async () => {
    setRunning('interest');
    try {
      const result = await api<{ posted: number }>('/api/savings/interest', { method: 'POST' });
      message.success(`Interest posted for ${result.posted} account(s)`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setRunning(null);
    }
  };

  const runMaintenanceFees = async () => {
    setRunning('fees');
    try {
      const result = await api<SavingsFeeRunResult>('/api/savings/maintenance-fees', { method: 'POST' });
      message.success(
        `Fees posted: ${result.posted} · Total ${fmtETB(result.totalAmount)} · Skipped ${result.skipped}`,
      );
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setRunning(null);
    }
  };

  const pendingCount = [...savingsProducts, ...shareCategories, ...charges].filter(
    (p) => p.status === 'Pending',
  ).length;

  const scCols = [
    { title: 'Code', dataIndex: 'code', width: 90 },
    { title: 'Name', dataIndex: 'name', ellipsis: true },
    { title: 'Total Shares', dataIndex: 'totalShares', align: 'right' as const },
    { title: 'Nominal', dataIndex: 'nominalPrice', align: 'right' as const, render: (v: number) => fmtETB(v) },
    { title: 'For Sale', dataIndex: 'sharesForSale', align: 'right' as const },
    { title: 'Min', dataIndex: 'minPerCustomer', align: 'right' as const },
    { title: 'Max', dataIndex: 'maxPerCustomer', align: 'right' as const },
    {
      title: 'Actions',
      render: (_: unknown, r: ShareCategory) =>
        r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => verify(`/api/share-categories/${r.id}/verify`)}>Verify</Button> : null,
    },
  ];

  const chCols = [
    { title: 'Code', dataIndex: 'code', width: 100 },
    { title: 'Charge', dataIndex: 'name', ellipsis: true },
    { title: 'Service', dataIndex: 'serviceType', width: 120 },
    { title: 'Type', dataIndex: 'calcType', width: 100 },
    { title: 'Amount', dataIndex: 'amount', align: 'right' as const, render: (v: number) => fmtETB(v) },
    { title: 'Penalty', dataIndex: 'applyPenalty', width: 90, render: (v: boolean) => (v ? <Tag color="orange">Yes</Tag> : <Tag>No</Tag>) },
    {
      title: 'Actions',
      render: (_: unknown, r: Charge) =>
        r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => verify(`/api/charges/${r.id}/verify`)}>Verify</Button> : null,
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title="Products"
        subtitle="Savings, share and charge products with verification workflow"
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Saving Categories"
            value={savingsProducts.length}
            icon={<WalletOutlined style={{ color: colors.primary }} />}
            caption="Savings products configured"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Share Categories"
            value={shareCategories.length}
            icon={<PieChartOutlined style={{ color: colors.info }} />}
            caption="Equity share classes"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Charges"
            value={charges.length}
            icon={<FileTextOutlined style={{ color: '#7a5af8' }} />}
            caption="Fees and penalties"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Pending Verification"
            value={pendingCount}
            icon={<ClockCircleOutlined style={{ color: colors.accent }} />}
            caption="Awaiting checker"
          />
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'saving',
            label: 'Saving Categories',
            children: (
              <Card
                title="Saving Categories"
                extra={(
                  <Space wrap>
                    <Popconfirm
                      title="Run monthly interest?"
                      description="Interest will be credited to every funded savings account."
                      okText="Run"
                      onConfirm={runInterest}
                    >
                      <Button icon={<ThunderboltOutlined />} loading={running === 'interest'}>Run Interest</Button>
                    </Popconfirm>
                    <Popconfirm
                      title="Run maintenance fees?"
                      description="Maintenance fees will be deducted from funded accounts."
                      okText="Run"
                      onConfirm={runMaintenanceFees}
                    >
                      <Button icon={<DollarOutlined />} loading={running === 'fees'}>Run Maintenance Fees</Button>
                    </Popconfirm>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setSpOpen(true)}>New Category</Button>
                  </Space>
                )}
              >
                <Row gutter={[20, 20]}>
                  {savingsProducts.map((p) => (
                    <Col xs={24} sm={12} lg={8} key={p.id}>
                      <Card size="small">
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <div>
                            <Typography.Text strong>{p.name}</Typography.Text>
                            <div style={{ fontSize: 12, color: '#999' }}>{p.code} · {p.type}</div>
                          </div>
                          <Tag color="blue">{p.interestRatePct}% p.a.</Tag>
                        </Space>
                        <Row style={{ marginTop: 8 }} justify="space-between">
                          <Typography.Text type="secondary">Interest method</Typography.Text>
                          <Typography.Text>{p.interestMethod ?? 'Daily Outstanding'}</Typography.Text>
                        </Row>
                        <Row justify="space-between">
                          <Typography.Text type="secondary">Min balance</Typography.Text>
                          <Typography.Text>{fmtETB(p.minBalance)}</Typography.Text>
                        </Row>
                        <Row justify="space-between">
                          <Typography.Text type="secondary">Maintenance</Typography.Text>
                          <Typography.Text>
                            {(p.maintenanceFee ?? 0) > 0
                              ? `${fmtETB(p.maintenanceFee ?? 0)} · ${p.maintenanceFeeFrequency ?? 'None'}`
                              : 'None'}
                          </Typography.Text>
                        </Row>
                        <Row justify="space-between">
                          <Typography.Text type="secondary">Passbook fee</Typography.Text>
                          <Typography.Text>{fmtETB(p.passbookFee ?? 0)}</Typography.Text>
                        </Row>
                        <Row justify="space-between">
                          <Typography.Text type="secondary">Overdraft</Typography.Text>
                          <Typography.Text>
                            {p.overdraftAllowed ? fmtETB(p.overdraftLimit ?? 0) : 'Not allowed'}
                          </Typography.Text>
                        </Row>
                        <Row justify="space-between">
                          <Typography.Text type="secondary">Lock-in</Typography.Text>
                          <Typography.Text>{(p.lockInMonths ?? 0) > 0 ? `${p.lockInMonths} months` : 'None'}</Typography.Text>
                        </Row>
                        <Row style={{ marginTop: 8 }} justify="space-between" align="middle">
                          <Space size={[4, 4]} wrap>
                            {p.compulsory ? <Tag color="volcano">Compulsory</Tag> : null}
                            {p.autoCreate ? <Tag color="green">Auto-create</Tag> : null}
                          </Space>
                          <span>{statusCol(p.status ?? 'Verified')}</span>
                        </Row>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            ),
          },
          {
            key: 'shares',
            label: 'Share Categories',
            children: (
              <Card
                title="Share Categories"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setScOpen(true)}>New Share Category</Button>}
              >
                <Table rowKey="id" dataSource={shareCategories} columns={scCols} pagination={false} />
              </Card>
            ),
          },
          {
            key: 'charges',
            label: 'Charges',
            children: (
              <Card
                title="Charges"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setChOpen(true)}>New Charge</Button>}
              >
                <Table rowKey="id" dataSource={charges} columns={chCols} pagination={false} />
              </Card>
            ),
          },
          {
            key: 'types',
            label: 'Product Types',
            children: (
              <Card
                title="Product Types"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setPtOpen(true)}>New Product Type</Button>}
              >
                <Table
                  rowKey="id"
                  dataSource={productTypes}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 110 },
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Category', dataIndex: 'category', width: 110, render: (c: string) => <Tag color={c === 'Saving' ? 'blue' : c === 'Share' ? 'purple' : 'gold'}>{c}</Tag> },
                    { title: 'Description', dataIndex: 'description', ellipsis: true },
                    { title: 'Status', dataIndex: 'status', width: 100, render: statusCol },
                    {
                      title: 'Actions',
                      render: (_: unknown, r: ProductTypeRow) =>
                        r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => verify(`/api/product-types/${r.id}/verify`)}>Verify</Button> : null,
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Saving category modal */}
      <Modal
        title="New Saving Category"
        open={spOpen}
        width={760}
        onCancel={() => setSpOpen(false)}
        onOk={() => spForm.submit()}
        confirmLoading={saving}
        styles={{ body: { maxHeight: '64vh', overflowY: 'auto', paddingRight: 8 } }}
      >
        <Form form={spForm} layout="vertical" style={{ marginTop: 16 }} onFinish={(v) => post(spForm, '/api/savings/products', v, () => setSpOpen(false))}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Code" name="code" rules={[{ required: true }]}><Input placeholder="S-NEW-1" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Type" name="type" initialValue="Voluntary">
                <Select options={['Mandatory', 'Voluntary', 'Holiday', 'Fixed'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>Interest</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Interest Rate % p.a." name="interestRatePct" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Interest Method" name="interestMethod" initialValue="Daily Outstanding">
                <Select options={['Daily Outstanding', 'Minimum Balance'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Minimum Balance" name="minBalance" initialValue={0}>
                <CurrencyInput style={{ width: '100%' }} min={0} step={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Notice Period (days)" name="noticePeriodDays">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Lock-in Months" name="lockInMonths" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>Fees</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Maintenance Fee" name="maintenanceFee" initialValue={0}>
                <CurrencyInput style={{ width: '100%' }} min={0} step={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Maintenance Frequency" name="maintenanceFeeFrequency" initialValue="None">
                <Select options={['None', 'Monthly', 'Quarterly', 'Annually'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Passbook Fee" name="passbookFee" initialValue={0}>
                <CurrencyInput style={{ width: '100%' }} min={0} step={10} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>Features</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Auto-create Account" name="autoCreate" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Compulsory" name="compulsory" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Overdraft Allowed" name="overdraftAllowed" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Overdraft Limit" name="overdraftLimit" initialValue={0}>
                <CurrencyInput style={{ width: '100%' }} min={0} step={1000} disabled={!overdraftAllowed} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain>GL Accounts</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Liability Code" name="glLiabilityCode" initialValue="1201">
                <Input placeholder="1201" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Interest Expense Code" name="glInterestExpenseCode" initialValue="2000">
                <Input placeholder="2000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Fee Income Code" name="glFeeIncomeCode" initialValue="2100">
                <Input placeholder="2100" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Share category modal */}
      <Modal title="New Share Category" open={scOpen} onCancel={() => setScOpen(false)} onOk={() => scForm.submit()} confirmLoading={saving}>
        <Form form={scForm} layout="vertical" style={{ marginTop: 16 }} onFinish={(v) => post(scForm, '/api/share-categories', v, () => setScOpen(false))}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Total Shares" name="totalShares" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Nominal Price" name="nominalPrice" rules={[{ required: true }]}><CurrencyInput style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Shares for Sale" name="sharesForSale" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Min per Customer" name="minPerCustomer" initialValue={1}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Max per Customer" name="maxPerCustomer" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Payment Agreement Months" name="paymentAgreementMonths" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Charge modal */}
      <Modal title="New Charge" open={chOpen} onCancel={() => setChOpen(false)} onOk={() => chForm.submit()} confirmLoading={saving}>
        <Form form={chForm} layout="vertical" style={{ marginTop: 16 }} onFinish={(v) => post(chForm, '/api/charges', v, () => setChOpen(false))}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Service Type" name="serviceType"><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item label="Calculation Type" name="calcType" initialValue="Flat">
                <Select options={['Flat', 'Fixed', 'Percentile'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item label="Amount" name="amount" rules={[{ required: true }]}><CurrencyInput style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item label="Apply Penalty" name="applyPenalty" valuePropName="checked">
                <Select options={[{ label: 'No', value: false }, { label: 'Yes', value: true }]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Product type modal */}
      <Modal title="New Product Type" open={ptOpen} onCancel={() => setPtOpen(false)} onOk={() => ptForm.submit()} confirmLoading={saving}>
        <Form form={ptForm} layout="vertical" style={{ marginTop: 16 }} onFinish={(v) => post(ptForm, '/api/product-types', v, () => setPtOpen(false))}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input placeholder="LN-NEW" /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item label="Category" name="category" initialValue="Saving">
                <Select options={['Saving', 'Share', 'Loan'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item label="Description" name="description"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}