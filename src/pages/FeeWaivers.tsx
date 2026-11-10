import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
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
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { colors } from '../theme';
import { api } from '../api/client';
import type { FeeWaiver } from '../types';
import { charges, members } from '../mocks/data';
import { fmtETB, fmtDate } from '../utils/format';

const MAKER = 'Kaleab Desta';
const CHECKER = 'Tigist Fikre';

const statusColor: Record<FeeWaiver['status'], string> = {
  Pending: 'gold',
  Approved: 'green',
  Rejected: 'red',
};

export default function FeeWaivers() {
  const [waivers, setWaivers] = useState<FeeWaiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeeWaiver['status'] | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      setWaivers(await api<FeeWaiver[]>('/api/fee-waivers'));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const pending = waivers.filter((w) => w.status === 'Pending');
    const approved = waivers.filter((w) => w.status === 'Approved');
    return {
      total: waivers.length,
      pending: pending.length,
      approved: approved.length,
      waivedValue: approved.reduce((s, w) => s + w.amount, 0),
    };
  }, [waivers]);

  const filtered = useMemo(
    () =>
      waivers.filter((w) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          w.memberName.toLowerCase().includes(q) ||
          w.chargeCode.toLowerCase().includes(q) ||
          w.chargeName.toLowerCase().includes(q) ||
          w.requestedBy.toLowerCase().includes(q) ||
          w.reason.toLowerCase().includes(q);
        return matchesSearch && (!statusFilter || w.status === statusFilter);
      }),
    [waivers, search, statusFilter],
  );

  const friendly = (e: unknown, fallback: string) => {
    const text = (e as Error).message ?? '';
    return text.includes('400') || text.includes('409') ? fallback : text || fallback;
  };

  const openCreate = () => {
    form.resetFields();
    setCreateOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const [from, to] = values.period as [Dayjs, Dayjs];
    setSaving(true);
    try {
      await api<FeeWaiver>('/api/fee-waivers', {
        method: 'POST',
        body: JSON.stringify({
          memberId: values.memberId,
          chargeCode: values.chargeCode,
          dateFrom: from.format('YYYY-MM-DD'),
          dateTo: to.format('YYYY-MM-DD'),
          amount: values.amount,
          reason: values.reason,
          requestedBy: MAKER,
        }),
      });
      setCreateOpen(false);
      form.resetFields();
      message.success('Fee waiver request submitted for maker-checker approval');
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to submit fee waiver'));
    } finally {
      setSaving(false);
    }
  };

  const approve = async (w: FeeWaiver) => {
    if (w.status !== 'Pending') return message.error('Only pending waivers can be approved');
    if (w.requestedBy === CHECKER) {
      return message.warning(
        'Maker-checker: you cannot approve a fee waiver you requested. A different manager must approve it.',
      );
    }
    setActingId(w.id);
    try {
      await api(`/api/fee-waivers/${w.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approvedBy: CHECKER }),
      });
      message.success(`Fee waiver for ${w.memberName} approved`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to approve fee waiver'));
    } finally {
      setActingId(null);
    }
  };

  const reject = async (w: FeeWaiver) => {
    if (w.status !== 'Pending') return message.error('Only pending waivers can be rejected');
    setActingId(w.id);
    try {
      await api(`/api/fee-waivers/${w.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Rejected during fee waiver review' }),
      });
      message.success(`Fee waiver for ${w.memberName} rejected`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to reject fee waiver'));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Fee Waivers"
        subtitle="Maker-checker requests to waive charges, fees and penalties"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Waiver
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Requests"
            value={stats.total}
            icon={<SafetyCertificateOutlined style={{ color: colors.primary }} />}
            caption="All fee waiver requests"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<ClockCircleOutlined style={{ color: colors.accent }} />}
            caption="Awaiting checker decision"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircleOutlined style={{ color: colors.success }} />}
            caption="Cleared by checker"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Waived Value"
            value={fmtETB(stats.waivedValue)}
            icon={<WalletOutlined style={{ color: colors.info }} />}
            caption="Approved waivers only"
          />
        </Col>
      </Row>

      <Card
        title="Fee Waiver Requests"
        extra={
          <Space wrap>
            <Input
              placeholder="Search member, charge or reason"
              allowClear
              style={{ width: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={(['Pending', 'Approved', 'Rejected'] as const).map((s) => ({
                label: s,
                value: s,
              }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Waiver
            </Button>
          </Space>
        }
      >
        <Table<FeeWaiver>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          locale={{ emptyText: <Empty description="No fee waiver requests found" /> }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          columns={[
            { title: 'Member', dataIndex: 'memberName', width: 160, ellipsis: true },
            {
              title: 'Charge',
              key: 'charge',
              width: 190,
              ellipsis: true,
              render: (_, r) => `${r.chargeCode} — ${r.chargeName}`,
            },
            {
              title: 'Period',
              key: 'period',
              width: 190,
              render: (_, r) => `${fmtDate(r.dateFrom)} – ${fmtDate(r.dateTo)}`,
            },
            { title: 'Amount', dataIndex: 'amount', align: 'right', width: 120, render: (v: number) => fmtETB(v) },
            { title: 'Reason', dataIndex: 'reason', ellipsis: true },
            { title: 'Requested By', dataIndex: 'requestedBy', width: 140 },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 110,
              render: (s: FeeWaiver['status']) => <Tag color={statusColor[s]}>{s}</Tag>,
            },
            {
              title: 'Actions',
              key: 'actions',
              fixed: 'right',
              width: 180,
              render: (_, r) =>
                r.status === 'Pending' ? (
                  <Space>
                    <Button
                      size="small"
                      type="link"
                      icon={<CheckCircleOutlined />}
                      loading={actingId === r.id}
                      onClick={() => approve(r)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      type="link"
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={actingId === r.id}
                      onClick={() => reject(r)}
                    >
                      Reject
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
        title="New Fee Waiver"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submit}
        okText="Submit for Approval"
        confirmLoading={saving}
        width={600}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
          Submitted requests are created as Pending and must be approved by a different manager
          (maker-checker).
        </Typography.Paragraph>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Member"
                name="memberId"
                rules={[{ required: true, message: 'Member required' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select member"
                  options={members.map((m) => ({
                    label: `${m.fullName} (${m.memberNo})`,
                    value: m.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Charge"
                name="chargeCode"
                rules={[{ required: true, message: 'Charge required' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select charge"
                  options={charges.map((c) => ({
                    label: `${c.code} — ${c.name}`,
                    value: c.code,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Waiver Period"
            name="period"
            rules={[{ required: true, message: 'Period required' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Amount (ETB)"
                name="amount"
                rules={[{ required: true, message: 'Amount required' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0.01} step={10} placeholder="e.g. 25" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Requested By">
                <Input value={MAKER} disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, whitespace: true, message: 'Reason required' }]}
          >
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="Justification for the waiver" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
