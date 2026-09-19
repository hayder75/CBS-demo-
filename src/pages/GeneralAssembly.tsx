import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  DollarOutlined,
  FundOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { api } from '../api/client';
import type { GaResolution, Member } from '../types';
import { fmtETB, fmtNum } from '../utils/format';
import { colors } from '../theme';

const APPROVER = 'Tigist Fikre';

const statusColor: Record<GaResolution['status'], string> = {
  Draft: 'gold',
  Approved: 'blue',
  Executed: 'green',
  Rejected: 'red',
};

export default function GeneralAssembly() {
  const [resolutions, setResolutions] = useState<GaResolution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<GaResolution | null>(null);
  const [form] = Form.useForm();

  const wSurplus = Form.useWatch('totalSurplus', form);
  const wDividendPct = Form.useWatch('dividendPct', form);
  const wReservePct = Form.useWatch('reservePct', form);

  const load = async () => {
    setLoading(true);
    try {
      const [r, m] = await Promise.all([
        api<GaResolution[]>('/api/ga-resolutions'),
        api<Member[]>('/api/members'),
      ]);
      setResolutions(r);
      setMembers(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const latest = useMemo(
    () => resolutions.reduce<GaResolution | null>((acc, r) => (!acc || r.year > acc.year ? r : acc), null),
    [resolutions],
  );

  const totalShares = useMemo(() => members.reduce((s, m) => s + m.shareBalance, 0), [members]);

  const preview = useMemo(() => {
    const surplus = Number(wSurplus) || 0;
    const dividendPct = Number(wDividendPct) || 0;
    const reservePct = Number(wReservePct) || 0;
    const dividendPool = (surplus * dividendPct) / 100;
    const reserve = (surplus * reservePct) / 100;
    const perShare = totalShares > 0 ? dividendPool / totalShares : 0;
    const valid = surplus > 0 && dividendPct >= 0 && reservePct >= 0 && dividendPct + reservePct <= 100;
    return { dividendPool, reserve, perShare, valid };
  }, [wSurplus, wDividendPct, wReservePct, totalShares]);

  const friendly = (e: unknown, fallback: string) => {
    const text = (e as Error).message ?? '';
    return text.includes('400') || text.includes('409') ? fallback : text || fallback;
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api<GaResolution>('/api/ga-resolutions', {
        method: 'POST',
        body: JSON.stringify({
          year: values.year,
          totalSurplus: values.totalSurplus,
          dividendPct: values.dividendPct,
          reservePct: values.reservePct,
          note: values.note,
        }),
      });
      setCreateOpen(false);
      form.resetFields();
      message.success('Draft resolution created');
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to create resolution'));
    } finally {
      setSaving(false);
    }
  };

  const approve = async (r: GaResolution) => {
    if (r.status !== 'Draft') return message.error('Only draft resolutions can be approved');
    if (r.createdBy === APPROVER) {
      return message.error('Maker and checker must be different users');
    }
    try {
      await api(`/api/ga-resolutions/${r.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approvedBy: APPROVER }),
      });
      message.success(`Resolution ${r.ref} approved`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to approve resolution'));
    }
  };

  const reject = async (r: GaResolution) => {
    if (r.status !== 'Draft') return message.error('Only draft resolutions can be rejected');
    try {
      await api(`/api/ga-resolutions/${r.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Rejected during General Assembly review' }),
      });
      message.success(`Resolution ${r.ref} rejected`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to reject resolution'));
    }
  };

  const execute = async (r: GaResolution) => {
    if (r.status !== 'Approved') return message.error('Only approved resolutions can be executed');
    try {
      await api(`/api/ga-resolutions/${r.id}/execute`, { method: 'POST' });
      message.success(`Resolution ${r.ref} executed — dividends and reserves credited`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to execute resolution'));
    }
  };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="General Assembly & Dividends"
        subtitle="Resolutions on surplus distribution, dividends and statutory reserves"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => load().catch(() => {})}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              New Resolution
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Surplus"
            value={latest ? fmtETB(latest.totalSurplus) : '—'}
            icon={<DollarOutlined style={{ color: colors.primary }} />}
            caption={latest ? `Financial year ${latest.year}` : 'No resolution yet'}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Dividend Pool"
            value={latest ? fmtETB(latest.totalDividend) : '—'}
            icon={<FundOutlined style={{ color: colors.info }} />}
            caption={latest ? `${latest.dividendPct}% of distributable surplus` : 'No resolution yet'}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Legal Reserve"
            value={latest ? fmtETB(latest.totalReserve) : '—'}
            icon={<SafetyCertificateOutlined style={{ color: colors.success }} />}
            caption={latest ? `${latest.reservePct}% statutory allocation` : 'No resolution yet'}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Eligible Members"
            value={latest ? fmtNum(latest.eligibleMembers) : '—'}
            icon={<TeamOutlined style={{ color: colors.accent }} />}
            caption={latest ? `Dividend/share ${fmtETB(latest.dividendPerShare)}` : 'No resolution yet'}
          />
        </Col>
      </Row>

      <Card
        title="GA Resolutions"
        extra={
          <Space>
            <Tag color="green">{resolutions.filter((r) => r.status === 'Executed').length} executed</Tag>
            <Tag color="gold">{resolutions.filter((r) => r.status === 'Draft').length} draft</Tag>
          </Space>
        }
      >
        <Table<GaResolution>
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={resolutions}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            { title: 'Ref', dataIndex: 'ref', width: 120 },
            { title: 'Year', dataIndex: 'year', width: 80 },
            { title: 'Surplus', dataIndex: 'totalSurplus', align: 'right', render: (v: number) => fmtETB(v) },
            { title: 'Dividend %', dataIndex: 'dividendPct', align: 'right', render: (v: number) => `${v}%` },
            { title: 'Reserve %', dataIndex: 'reservePct', align: 'right', render: (v: number) => `${v}%` },
            {
              title: 'Dividend/Share',
              dataIndex: 'dividendPerShare',
              align: 'right',
              render: (v: number) => `${v} ETB`,
            },
            { title: 'Eligible Members', dataIndex: 'eligibleMembers', align: 'right', render: (v: number) => fmtNum(v) },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (s: GaResolution['status']) => <Tag color={statusColor[s]}>{s}</Tag>,
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 240,
              render: (_, r) => (
                <Space size={4} wrap>
                  <Button type="link" size="small" onClick={() => setBreakdown(r)}>
                    Breakdown
                  </Button>
                  {r.status === 'Draft' && (
                    <>
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => approve(r)}
                      >
                        Approve
                      </Button>
                      <Popconfirm
                        title="Reject this resolution?"
                        okText="Reject"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => reject(r)}
                      >
                        <Button type="link" size="small" danger>
                          Reject
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                  {r.status === 'Approved' && (
                    <Popconfirm
                      title="Execute resolution and credit dividends/reserves?"
                      okText="Execute"
                      onConfirm={() => execute(r)}
                    >
                      <Button type="link" size="small">
                        Execute
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="New GA Resolution"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submit}
        okText="Create Draft"
        confirmLoading={saving}
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ year: 2026 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Financial Year"
                name="year"
                rules={[
                  { required: true, message: 'Financial year is required' },
                  {
                    validator: (_, value) =>
                      resolutions.some((r) => r.year === Number(value) && r.status !== 'Rejected')
                        ? Promise.reject(new Error(`A resolution for ${value} already exists`))
                        : Promise.resolve(),
                  },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={2000} max={2100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Total Surplus (ETB)"
                name="totalSurplus"
                rules={[
                  { required: true, message: 'Total surplus is required' },
                  {
                    validator: (_, value) =>
                      Number(value) > 0
                        ? Promise.resolve()
                        : Promise.reject(new Error('Surplus must be greater than zero')),
                  },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={10000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Dividend %"
                name="dividendPct"
                rules={[
                  { required: true, message: 'Dividend % is required' },
                  {
                    validator: (_, value) =>
                      Number(value) + Number(form.getFieldValue('reservePct') ?? 0) <= 100
                        ? Promise.resolve()
                        : Promise.reject(new Error('Dividend % + reserve % cannot exceed 100%')),
                  },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0} max={100} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Reserve %"
                name="reservePct"
                rules={[
                  { required: true, message: 'Reserve % is required' },
                  {
                    validator: (_, value) =>
                      Number(value) + Number(form.getFieldValue('dividendPct') ?? 0) <= 100
                        ? Promise.resolve()
                        : Promise.reject(new Error('Dividend % + reserve % cannot exceed 100%')),
                  },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0} max={100} addonAfter="%" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Note" name="note">
            <Input placeholder="Optional context for the General Assembly" />
          </Form.Item>
          <div className="soft-panel" style={{ marginTop: 4 }}>
            <Typography.Text strong style={{ fontSize: 13 }}>
              Live preview
            </Typography.Text>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={8}>
                <div className="kpi-label">Dividend Pool</div>
                <div className="kpi-value" style={{ fontSize: 18 }}>
                  {preview.valid ? fmtETB(preview.dividendPool) : '—'}
                </div>
              </Col>
              <Col span={8}>
                <div className="kpi-label">Legal Reserve</div>
                <div className="kpi-value" style={{ fontSize: 18 }}>
                  {preview.valid ? fmtETB(preview.reserve) : '—'}
                </div>
              </Col>
              <Col span={8}>
                <div className="kpi-label">Dividend / Share</div>
                <div className="kpi-value" style={{ fontSize: 18 }}>
                  {preview.valid ? `${preview.perShare.toFixed(2)} ETB` : '—'}
                </div>
              </Col>
            </Row>
            {!preview.valid && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Enter a positive surplus and allocations totalling at most 100%.
              </Typography.Text>
            )}
          </div>
        </Form>
      </Modal>

      <Modal
        title={breakdown ? `Resolution ${breakdown.ref}` : 'Resolution Breakdown'}
        open={!!breakdown}
        onCancel={() => setBreakdown(null)}
        footer={<Button onClick={() => setBreakdown(null)}>Close</Button>}
        width={560}
      >
        {breakdown && (
          <Descriptions bordered size="small" column={2} style={{ marginTop: 8 }}>
            <Descriptions.Item label="Year">{breakdown.year}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColor[breakdown.status]}>{breakdown.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total Surplus">{fmtETB(breakdown.totalSurplus)}</Descriptions.Item>
            <Descriptions.Item label="Distributable">{fmtETB(breakdown.distributable)}</Descriptions.Item>
            <Descriptions.Item label="Dividend %">{breakdown.dividendPct}%</Descriptions.Item>
            <Descriptions.Item label="Reserve %">{breakdown.reservePct}%</Descriptions.Item>
            <Descriptions.Item label="Dividend Pool">{fmtETB(breakdown.totalDividend)}</Descriptions.Item>
            <Descriptions.Item label="Legal Reserve">{fmtETB(breakdown.totalReserve)}</Descriptions.Item>
            <Descriptions.Item label="Eligible Members">{fmtNum(breakdown.eligibleMembers)}</Descriptions.Item>
            <Descriptions.Item label="Dividend / Share">{breakdown.dividendPerShare} ETB</Descriptions.Item>
            <Descriptions.Item label="Created By">{breakdown.createdBy}</Descriptions.Item>
            <Descriptions.Item label="Approved By">{breakdown.approvedBy ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Created At">{breakdown.createdAt}</Descriptions.Item>
            <Descriptions.Item label="Executed At">{breakdown.executedAt ?? '—'}</Descriptions.Item>
            {breakdown.note && (
              <Descriptions.Item label="Note" span={2}>
                {breakdown.note}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </ProCard>
  );
}
