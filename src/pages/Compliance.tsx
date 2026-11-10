import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  InputNumber,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  EditOutlined,
  FundOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type {
  CashFlowRow,
  CompliancePolicy,
  LargeExposure,
  LiquidityRow,
  ProfitAllocationRow,
} from '../types';
import { fmtETB } from '../utils/format';
import { chartPalette, colors } from '../theme';

const round2 = (n: number) => Math.round(n * 100) / 100;

const statusColor: Record<LiquidityRow['status'], string> = {
  Adequate: 'green',
  Below: 'red',
};

export default function Compliance() {
  const [policy, setPolicy] = useState<CompliancePolicy | null>(null);
  const [liquidity, setLiquidity] = useState<LiquidityRow[]>([]);
  const [exposures, setExposures] = useState<LargeExposure[]>([]);
  const [allocations, setAllocations] = useState<ProfitAllocationRow[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [p, l, e, a, c] = await Promise.all([
        api<CompliancePolicy>('/api/compliance/policy').catch(() => null),
        api<LiquidityRow[]>('/api/compliance/liquidity').catch(() => [] as LiquidityRow[]),
        api<LargeExposure[]>('/api/compliance/large-exposures').catch(() => [] as LargeExposure[]),
        api<ProfitAllocationRow[]>('/api/compliance/profit-allocation').catch(
          () => [] as ProfitAllocationRow[],
        ),
        api<CashFlowRow[]>('/api/compliance/cash-flow').catch(() => [] as CashFlowRow[]),
      ]);
      if (p) {
        setPolicy(p);
        setThreshold(p.exposureMaxPct);
      }
      setLiquidity(l);
      setExposures(e);
      setAllocations(a);
      setCashFlow(c);
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const openPolicy = () => {
    form.setFieldsValue({
      liquidityMinPct: policy?.liquidityMinPct ?? 20,
      exposureMaxPct: policy?.exposureMaxPct ?? 25,
    });
    setPolicyOpen(true);
  };

  const submitPolicy = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const updated = await api<CompliancePolicy>('/api/compliance/policy', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setPolicy(updated);
      setThreshold(updated.exposureMaxPct);
      setPolicyOpen(false);
      message.success('Compliance policy updated');
      await load();
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveThreshold = async () => {
    if (threshold == null || !Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      message.error('Exposure maximum must be between 0 and 100');
      return;
    }
    setSaving(true);
    try {
      const updated = await api<CompliancePolicy>('/api/compliance/policy', {
        method: 'POST',
        body: JSON.stringify({
          liquidityMinPct: policy?.liquidityMinPct ?? 20,
          exposureMaxPct: threshold,
        }),
      });
      setPolicy(updated);
      setThreshold(updated.exposureMaxPct);
      message.success('Exposure threshold updated');
      await load();
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const liquidAssets = liquidity.find((r) => r.label === 'Liquid Assets')?.value ?? 0;
  const shortTerm = liquidity.find((r) => r.label === 'Short-term Liabilities')?.value ?? 0;
  const netLiquid = liquidity.find((r) => r.label === 'Net Liquid Assets')?.value ?? 0;
  const liquidityRatio = shortTerm > 0 ? round2((liquidAssets / shortTerm) * 100) : 0;
  const breaches = exposures.filter((r) => r.status === 'Breach').length;
  const totalAllocated = allocations.reduce((sum, r) => sum + r.amount, 0);
  const netRow = cashFlow.find((r) => r.label === 'Net Cash Flow');
  const netCash = netRow ? netRow.inflow - netRow.outflow : 0;

  const liquidityChart = useMemo(
    () => [
      { name: 'Liquid Assets', value: liquidAssets },
      { name: 'Short-term Liabilities', value: shortTerm },
    ],
    [liquidAssets, shortTerm],
  );

  const cashFlowChart = useMemo(
    () => cashFlow.filter((r) => r.label !== 'Net Cash Flow'),
    [cashFlow],
  );

  if (loading && !policy) {
    return (
      <div className="page-shell">
        <PageHeader title="Compliance" subtitle="Prudential ratios, exposures and liquidity monitoring" />
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        </Card>
      </div>
    );
  }

  const liquidityTab = (
    <Space direction="vertical" style={{ width: '100%' }} size={20}>
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Liquid Assets"
            value={fmtETB(liquidAssets)}
            icon={<DollarOutlined style={{ color: colors.primary }} />}
            caption="Cash at bank and on hand"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Short-term Liabilities"
            value={fmtETB(shortTerm)}
            icon={<BankOutlined style={{ color: colors.info }} />}
            caption="Member claims payable"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Net Liquid Assets"
            value={fmtETB(netLiquid)}
            icon={<FundOutlined style={{ color: netLiquid >= 0 ? colors.success : colors.danger }} />}
            caption={netLiquid >= 0 ? 'Positive liquidity buffer' : 'Liquidity shortfall'}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Liquidity Ratio"
            value={`${liquidityRatio}%`}
            icon={<SafetyCertificateOutlined style={{ color: colors.accent }} />}
            caption={`Policy minimum ${policy?.liquidityMinPct ?? 0}%`}
          />
        </Col>
      </Row>

      <Card title="Liquidity Position">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : liquidity.length === 0 ? (
          <Empty description="No liquidity data available" />
        ) : (
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={14}>
              <Table
                size="small"
                rowKey="label"
                dataSource={liquidity}
                pagination={false}
                columns={[
                  { title: 'Component', dataIndex: 'label' },
                  {
                    title: 'Value',
                    dataIndex: 'value',
                    align: 'right' as const,
                    render: (v: number) => fmtETB(v),
                  },
                  {
                    title: 'Requirement',
                    dataIndex: 'requirement',
                    align: 'right' as const,
                    render: (v: number) => (v ? fmtETB(v) : '—'),
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    width: 110,
                    render: (s: LiquidityRow['status']) => <Tag color={statusColor[s]}>{s}</Tag>,
                  },
                ]}
              />
            </Col>
            <Col xs={24} lg={10}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={liquidityChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f2f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#98a2b3' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#98a2b3' }} />
                  <Tooltip formatter={(v) => fmtETB(Number(v))} />
                  <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]}>
                    <Cell fill={colors.primary} />
                    <Cell fill={colors.danger} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Col>
          </Row>
        )}
      </Card>
    </Space>
  );

  const exposuresTab = (
    <Card
      title="Large Exposures"
      extra={
        <Space>
          <Typography.Text type="secondary">Exposure limit %</Typography.Text>
          <InputNumber
            min={0}
            max={100}
            step={1}
            style={{ width: 90 }}
            value={threshold}
            onChange={(v) => setThreshold(v)}
          />
          <Button type="primary" size="small" loading={saving} onClick={saveThreshold}>
            Save
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : exposures.length === 0 ? (
        <Empty description="No large exposures on record" />
      ) : (
        <Table
          size="small"
          rowKey="id"
          dataSource={exposures}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          onRow={(r) =>
            r.status === 'Breach'
              ? { style: { background: 'rgba(240, 68, 56, 0.06)' } }
              : {}
          }
          columns={[
            { title: 'Member', dataIndex: 'memberName' },
            { title: 'Loan No', dataIndex: 'loanNo', width: 140 },
            {
              title: 'Facility',
              dataIndex: 'facility',
              align: 'right' as const,
              render: (v: number) => fmtETB(v),
            },
            {
              title: 'Exposure',
              dataIndex: 'exposure',
              align: 'right' as const,
              render: (v: number) => fmtETB(v),
            },
            {
              title: 'Exposure %',
              dataIndex: 'exposurePct',
              align: 'right' as const,
              width: 120,
              render: (v: number, r: LargeExposure) =>
                r.status === 'Breach' ? (
                  <Typography.Text strong style={{ color: colors.danger }}>
                    {v}%
                  </Typography.Text>
                ) : (
                  <span>{v}%</span>
                ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 110,
              render: (s: LargeExposure['status']) => (
                <Tag color={s === 'Breach' ? 'red' : 'green'}>{s}</Tag>
              ),
            },
          ]}
        />
      )}
    </Card>
  );

  const allocationTab = (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={14}>
        <Card title="Profit Allocation">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin />
            </div>
          ) : allocations.length === 0 ? (
            <Empty description="No profit allocation available" />
          ) : (
            <Table
              size="small"
              rowKey="label"
              dataSource={allocations}
              pagination={false}
              columns={[
                { title: 'Allocation', dataIndex: 'label' },
                {
                  title: 'Share %',
                  dataIndex: 'pct',
                  align: 'right' as const,
                  width: 120,
                  render: (v: number) => `${v}%`,
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  align: 'right' as const,
                  render: (v: number) => fmtETB(v),
                },
              ]}
            />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="Allocation Split" style={{ height: '100%' }}>
          {allocations.length === 0 ? (
            <Empty description="No allocation split" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={allocations}
                    dataKey="amount"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={96}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {allocations.map((row, i) => (
                      <Cell key={row.label} fill={chartPalette[i % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtETB(Number(v))} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center' }}>
                <div className="kpi-value" style={{ fontSize: 20 }}>
                  {fmtETB(totalAllocated)}
                </div>
                <div className="kpi-caption">Total distributed from surplus</div>
              </div>
            </>
          )}
        </Card>
      </Col>
    </Row>
  );

  const cashFlowTab = (
    <Space direction="vertical" style={{ width: '100%' }} size={20}>
      <Card title="Cash Flow Statement">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : cashFlow.length === 0 ? (
          <Empty description="No cash flow data available" />
        ) : (
          <Table
            size="small"
            rowKey="label"
            dataSource={cashFlow}
            pagination={false}
            columns={[
              { title: 'Category', dataIndex: 'label' },
              {
                title: 'Inflow',
                dataIndex: 'inflow',
                align: 'right' as const,
                render: (v: number, r: CashFlowRow) =>
                  r.label === 'Net Cash Flow' ? (
                    <Typography.Text strong>{fmtETB(v)}</Typography.Text>
                  ) : (
                    fmtETB(v)
                  ),
              },
              {
                title: 'Outflow',
                dataIndex: 'outflow',
                align: 'right' as const,
                render: (v: number, r: CashFlowRow) =>
                  r.label === 'Net Cash Flow' ? (
                    <Typography.Text strong>{fmtETB(v)}</Typography.Text>
                  ) : (
                    fmtETB(v)
                  ),
              },
              {
                title: 'Net',
                align: 'right' as const,
                render: (_: unknown, r: CashFlowRow) => {
                  const net = r.inflow - r.outflow;
                  return (
                    <Typography.Text strong style={{ color: net >= 0 ? colors.success : colors.danger }}>
                      {fmtETB(net)}
                    </Typography.Text>
                  );
                },
              },
            ]}
          />
        )}
      </Card>

      {cashFlowChart.length > 0 && (
        <Card title="Cash Flow by Activity">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f2f5" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#98a2b3' }} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#98a2b3' }} />
              <Tooltip formatter={(v) => fmtETB(Number(v))} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="inflow" name="Inflow" fill={colors.primary} radius={[6, 6, 0, 0]} />
              <Bar dataKey="outflow" name="Outflow" fill={colors.danger} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </Space>
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Compliance"
        subtitle="Prudential ratios, large exposures, profit allocation and cash flow monitoring"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => load().catch(() => {})}>
              Refresh
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={openPolicy}>
              Policy Settings
            </Button>
          </Space>
        }
        tags={
          <>
            <Tag color={(policy?.liquidityMinPct ?? 0) > liquidityRatio ? 'red' : 'green'}>
              Liquidity min {policy?.liquidityMinPct ?? 0}%
            </Tag>
            <Tag color={breaches > 0 ? 'red' : 'green'}>
              <WarningOutlined /> {breaches} exposure breach{breaches === 1 ? '' : 'es'}
            </Tag>
          </>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Liquidity Ratio"
            value={`${liquidityRatio}%`}
            icon={<SafetyCertificateOutlined style={{ color: colors.primary }} />}
            caption="Liquid assets over short-term liabilities"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Exposure Breaches"
            value={breaches}
            icon={<WarningOutlined style={{ color: breaches > 0 ? colors.danger : colors.success }} />}
            caption={`Limit ${policy?.exposureMaxPct ?? 0}% per borrower`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Allocated Surplus"
            value={fmtETB(totalAllocated)}
            icon={<FundOutlined style={{ color: colors.info }} />}
            caption={`${allocations.length} allocation lines`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Net Cash Flow"
            value={fmtETB(netCash)}
            icon={<DollarOutlined style={{ color: netCash >= 0 ? colors.success : colors.danger }} />}
            caption="Operating, investing and financing"
          />
        </Col>
      </Row>

      <Tabs
        items={[
          { key: 'liquidity', label: 'Liquidity', children: liquidityTab },
          { key: 'exposures', label: 'Large Exposures', children: exposuresTab },
          { key: 'allocation', label: 'Profit Allocation', children: allocationTab },
          { key: 'cashflow', label: 'Cash Flow', children: cashFlowTab },
        ]}
      />

      <Modal
        title="Compliance Policy Settings"
        open={policyOpen}
        onCancel={() => setPolicyOpen(false)}
        onOk={submitPolicy}
        okText="Save Policy"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Liquidity Minimum %"
            name="liquidityMinPct"
            rules={[
              { required: true, message: 'Liquidity minimum is required' },
              { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={100} step={1} />
          </Form.Item>
          <Form.Item
            label="Exposure Maximum %"
            name="exposureMaxPct"
            rules={[
              { required: true, message: 'Exposure maximum is required' },
              { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={100} step={1} />
          </Form.Item>
          <Typography.Text type="secondary">
            Thresholds are applied to the liquidity position and single-borrower exposure checks.
          </Typography.Text>
        </Form>
      </Modal>
    </div>
  );
}
