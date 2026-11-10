import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
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
  CalendarOutlined,
  FieldTimeOutlined,
  MoneyCollectOutlined,
  PercentageOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { colors } from '../theme';
import { api } from '../api/client';
import type { Member, SavingsProduct, TermDeposit } from '../types';
import { fmtETB, fmtDate } from '../utils/format';

const statusColor: Record<TermDeposit['status'], string> = {
  Active: 'green',
  Matured: 'blue',
  Broken: 'red',
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function TermDeposits() {
  const [deposits, setDeposits] = useState<TermDeposit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TermDeposit['status'] | undefined>();

  const [createOpen, setCreateOpen] = useState(false);
  const [breakTarget, setBreakTarget] = useState<TermDeposit | null>(null);
  const [penaltyPct, setPenaltyPct] = useState(0);
  const [maturingId, setMaturingId] = useState<string | null>(null);
  const [breaking, setBreaking] = useState(false);
  const [form] = Form.useForm();

  const watchedPrincipal = Form.useWatch('principal', form);
  const watchedTerm = Form.useWatch('termMonths', form);
  const watchedRate = Form.useWatch('ratePct', form);

  const load = async () => {
    setLoading(true);
    try {
      const [d, m, p] = await Promise.all([
        api<TermDeposit[]>('/api/term-deposits'),
        api<Member[]>('/api/members'),
        api<SavingsProduct[]>('/api/savings/products'),
      ]);
      setDeposits(d);
      setMembers(m);
      setProducts(p);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const termProducts = useMemo(() => products.filter((p) => p.type === 'Fixed'), [products]);

  const summary = useMemo(() => {
    const active = deposits.filter((d) => d.status === 'Active');
    const now = dayjs();
    return {
      activeCount: active.length,
      totalPrincipal: active.reduce((s, d) => s + d.principal, 0),
      interestAccrued: active.reduce((s, d) => s + d.interestAccrued, 0),
      maturingThisMonth: active.filter((d) => dayjs(d.maturityDate).isSame(now, 'month')).length,
    };
  }, [deposits]);

  const filtered = useMemo(
    () =>
      deposits.filter((d) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          d.accountNo.toLowerCase().includes(q) ||
          d.memberName.toLowerCase().includes(q) ||
          d.productName.toLowerCase().includes(q);
        return matchesSearch && (!statusFilter || d.status === statusFilter);
      }),
    [deposits, search, statusFilter],
  );

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ termMonths: 12, ratePct: 8 });
    setCreateOpen(true);
  };

  const createDeposit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const created = await api<TermDeposit>('/api/term-deposits', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setCreateOpen(false);
      form.resetFields();
      message.success(`Term deposit ${created.accountNo} opened`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const mature = async (deposit: TermDeposit) => {
    setMaturingId(deposit.id);
    try {
      await api(`/api/term-deposits/${deposit.id}/mature`, { method: 'POST' });
      message.success(`${deposit.accountNo} matured`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setMaturingId(null);
    }
  };

  const openBreak = (deposit: TermDeposit) => {
    setBreakTarget(deposit);
    setPenaltyPct(deposit.penaltyPct || 2);
  };

  const breakDeposit = async () => {
    if (!breakTarget) return;
    setBreaking(true);
    try {
      await api(`/api/term-deposits/${breakTarget.id}/break`, {
        method: 'POST',
        body: JSON.stringify({ penaltyPct }),
      });
      message.success(`${breakTarget.accountNo} broken early`);
      setBreakTarget(null);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBreaking(false);
    }
  };

  const penalty = breakTarget ? round2(breakTarget.interestAccrued * penaltyPct / 100) : 0;
  const netInterest = breakTarget ? round2(Math.max(0, breakTarget.interestAccrued - penalty)) : 0;
  const payout = breakTarget ? round2(breakTarget.principal + netInterest) : 0;
  const projectedMaturity =
    Number(watchedPrincipal) > 0 && Number(watchedTerm) > 0
      ? round2(Number(watchedPrincipal) * (1 + (Number(watchedRate) || 0) / 100 * Number(watchedTerm) / 12))
      : 0;

  return (
    <div className="page-shell">
      <PageHeader
        title="Term Deposits"
        subtitle="Fixed-term savings (TFS) register, maturity and early-break management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Term Deposit
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Active Deposits"
            value={summary.activeCount}
            icon={<SafetyCertificateOutlined style={{ color: colors.primary }} />}
            caption="Currently earning interest"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Principal"
            value={fmtETB(summary.totalPrincipal)}
            icon={<MoneyCollectOutlined style={{ color: colors.info }} />}
            caption="Active term deposits"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Interest Accrued"
            value={fmtETB(summary.interestAccrued)}
            icon={<PercentageOutlined style={{ color: '#7a5af8' }} />}
            caption="On active deposits"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Maturing This Month"
            value={summary.maturingThisMonth}
            icon={<CalendarOutlined style={{ color: colors.accent }} />}
            caption="Active deposits due"
          />
        </Col>
      </Row>

      <Card
        title="Term Deposit Register"
        extra={
          <Space>
            <Input
              placeholder="Search account no or member"
              allowClear
              style={{ width: 240 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={(['Active', 'Matured', 'Broken'] as const).map((s) => ({ label: s, value: s }))}
            />
          </Space>
        }
      >
        <Table<TermDeposit>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          locale={{ emptyText: <Empty description="No term deposits found" /> }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1100 }}
          columns={[
            { title: 'Account No', dataIndex: 'accountNo', width: 130 },
            { title: 'Member', dataIndex: 'memberName', ellipsis: true },
            { title: 'Principal', dataIndex: 'principal', align: 'right', render: (v) => fmtETB(v) },
            { title: 'Rate', dataIndex: 'ratePct', align: 'right', render: (v) => `${v}%` },
            { title: 'Term', dataIndex: 'termMonths', align: 'right', render: (v) => `${v}M` },
            { title: 'Start', dataIndex: 'startDate', render: fmtDate },
            { title: 'Maturity', dataIndex: 'maturityDate', render: fmtDate },
            {
              title: 'Interest Accrued',
              dataIndex: 'interestAccrued',
              align: 'right',
              render: (v) => fmtETB(v),
            },
            {
              title: 'Maturity Value',
              dataIndex: 'maturityValue',
              align: 'right',
              render: (v) => <Typography.Text strong>{fmtETB(v)}</Typography.Text>,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (s: TermDeposit['status']) => <Tag color={statusColor[s]}>{s}</Tag>,
            },
            {
              title: 'Actions',
              key: 'actions',
              fixed: 'right',
              width: 180,
              render: (_, r) =>
                r.status === 'Active' ? (
                  <Space>
                    <Popconfirm
                      title="Mature this deposit?"
                      description={`Accrues ${fmtETB(r.maturityValue - r.principal)} interest and pays out ${fmtETB(r.maturityValue)}.`}
                      onConfirm={() => mature(r)}
                    >
                      <Button size="small" type="link" icon={<ThunderboltOutlined />} loading={maturingId === r.id}>
                        Mature
                      </Button>
                    </Popconfirm>
                    <Button
                      size="small"
                      type="link"
                      danger
                      icon={<StopOutlined />}
                      onClick={() => openBreak(r)}
                    >
                      Break
                    </Button>
                  </Space>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                ),
            },
          ]}
        />
      </Card>

      <Modal
        title="New Term Deposit"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={createDeposit}
        okText="Open Deposit"
        confirmLoading={saving}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Member" name="memberId" rules={[{ required: true, message: 'Member required' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select member"
              options={members.map((m) => ({ label: `${m.fullName} (${m.memberNo})`, value: m.id }))}
            />
          </Form.Item>
          <Form.Item label="Term Product" name="productId" rules={[{ required: true, message: 'Product required' }]}>
            <Select
              placeholder="Select fixed-term product"
              options={termProducts.map((p) => ({
                label: `${p.code} — ${p.name} (${p.interestRatePct}%)`,
                value: p.id,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Principal (ETB)"
                name="principal"
                rules={[{ required: true, message: 'Principal required' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0.01} step={1000} placeholder="e.g. 100000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Term (months)"
                name="termMonths"
                rules={[{ required: true, message: 'Term required' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} step={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Rate (% p.a.)"
                name="ratePct"
                rules={[{ required: true, message: 'Rate required' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Projected Maturity Value">
                <Input
                  readOnly
                  value={projectedMaturity ? fmtETB(projectedMaturity) : '—'}
                  prefix={<FieldTimeOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            Principal is locked until {watchedTerm ? dayjs().add(Number(watchedTerm), 'month').format('DD MMM YYYY') : 'maturity'}.
            Early break applies a penalty to accrued interest.
          </Typography.Text>
        </Form>
      </Modal>

      <Modal
        title="Break Term Deposit Early"
        open={!!breakTarget}
        onCancel={() => setBreakTarget(null)}
        onOk={breakDeposit}
        okText="Confirm Break"
        okButtonProps={{ danger: true }}
        confirmLoading={breaking}
        width={520}
      >
        {breakTarget && (
          <div style={{ marginTop: 8 }}>
            <Typography.Paragraph>
              <Typography.Text strong>{breakTarget.accountNo}</Typography.Text> — {breakTarget.memberName}
            </Typography.Paragraph>
            <Form layout="vertical">
              <Form.Item label="Penalty (% of accrued interest)">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={0.5}
                  value={penaltyPct}
                  onChange={(v) => setPenaltyPct(Number(v) || 0)}
                />
              </Form.Item>
            </Form>
            <Row justify="space-between">
              <Typography.Text type="secondary">Principal</Typography.Text>
              <Typography.Text>{fmtETB(breakTarget.principal)}</Typography.Text>
            </Row>
            <Row justify="space-between">
              <Typography.Text type="secondary">Accrued interest</Typography.Text>
              <Typography.Text>{fmtETB(breakTarget.interestAccrued)}</Typography.Text>
            </Row>
            <Row justify="space-between">
              <Typography.Text type="secondary">Penalty</Typography.Text>
              <Typography.Text type="danger">-{fmtETB(penalty)}</Typography.Text>
            </Row>
            <Row justify="space-between">
              <Typography.Text type="secondary">Net interest paid</Typography.Text>
              <Typography.Text>{fmtETB(netInterest)}</Typography.Text>
            </Row>
            <Row justify="space-between" style={{ marginTop: 4 }}>
              <Typography.Text strong>Payout to member</Typography.Text>
              <Typography.Text strong>{fmtETB(payout)}</Typography.Text>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
