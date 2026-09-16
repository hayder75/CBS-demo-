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
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Tabs,
} from 'antd';
import {
  ClockCircleOutlined,
  FileTextOutlined,
  PieChartOutlined,
  PlusOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { CurrencyInput } from '../components/CurrencyInput';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { Charge, ShareCategory, SavingsProduct } from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

const statusCol = (s: string) => (
  <Tag color={s === 'Verified' || s === 'Active' ? 'green' : s === 'Pending' ? 'gold' : 'default'}>{s}</Tag>
);

export default function Products() {
  const [savingsProducts, setSavingsProducts] = useState<SavingsProduct[]>([]);
  const [shareCategories, setShareCategories] = useState<ShareCategory[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);

  const [spOpen, setSpOpen] = useState(false);
  const [scOpen, setScOpen] = useState(false);
  const [chOpen, setChOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spForm] = Form.useForm();
  const [scForm] = Form.useForm();
  const [chForm] = Form.useForm();

  const load = async () => {
    setSavingsProducts(await api<SavingsProduct[]>('/api/savings/products').catch(() => []));
    setShareCategories(await api<ShareCategory[]>('/api/share-categories').catch(() => []));
    setCharges(await api<Charge[]>('/api/charges').catch(() => []));
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
    <ProCard ghost direction="column" gutter={[20, 20]}>
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
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setSpOpen(true)}>New Category</Button>}
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
                          <Typography.Text type="secondary">Min balance</Typography.Text>
                          <Typography.Text>{fmtETB(p.minBalance)}</Typography.Text>
                        </Row>
                        <Row justify="space-between">
                          <Typography.Text type="secondary">Status</Typography.Text>
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
        ]}
      />

      {/* Saving category modal */}
      <Modal title="New Saving Category" open={spOpen} onCancel={() => setSpOpen(false)} onOk={() => spForm.submit()} confirmLoading={saving}>
        <Form form={spForm} layout="vertical" style={{ marginTop: 16 }} onFinish={(v) => post(spForm, '/api/savings/products', v, () => setSpOpen(false))}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Code" name="code" rules={[{ required: true }]}><Input placeholder="S-NEW-1" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="type" initialValue="Voluntary">
                <Select options={['Mandatory', 'Voluntary', 'Holiday', 'Fixed'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Interest Rate % p.a." name="interestRatePct" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Minimum Balance" name="minBalance" initialValue={0}>
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
    </ProCard>
  );
}