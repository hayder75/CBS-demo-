import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type {
  Branch,
  MembershipApplication,
  SavingsProduct,
  ShareCategory,
} from '../types';
import { fmtDate } from '../utils/format';
import { colors } from '../theme';

const paymentColor: Record<MembershipApplication['paymentStatus'], string> = {
  Paid: 'green',
  Unpaid: 'orange',
};

const statusColor: Record<MembershipApplication['status'], string> = {
  Pending: 'gold',
  Approved: 'green',
  Rejected: 'red',
};

export default function MembershipApplications() {
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shareCategories, setShareCategories] = useState<ShareCategory[]>([]);
  const [savingsProducts, setSavingsProducts] = useState<SavingsProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<MembershipApplication | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setApplications(await api<MembershipApplication[]>('/api/membership-applications'));
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRefs = useCallback(async () => {
    const [b, c, p] = await Promise.all([
      api<Branch[]>('/api/branches').catch(() => []),
      api<ShareCategory[]>('/api/share-categories').catch(() => []),
      api<SavingsProduct[]>('/api/savings/products').catch(() => []),
    ]);
    setBranches(b);
    setShareCategories(c);
    setSavingsProducts(p);
  }, []);

  useEffect(() => {
    load();
    loadRefs();
  }, [load, loadRefs]);

  const summary = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === 'Pending').length,
      approved: applications.filter((a) => a.status === 'Approved').length,
      rejected: applications.filter((a) => a.status === 'Rejected').length,
    }),
    [applications],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter(
      (a) =>
        (!term ||
          a.applicationNo.toLowerCase().includes(term) ||
          a.fullName.toLowerCase().includes(term) ||
          a.phone.toLowerCase().includes(term)) &&
        (!statusFilter || a.status === statusFilter),
    );
  }, [applications, search, statusFilter]);

  const createApplication = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const created = await api<MembershipApplication>('/api/membership-applications', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setCreateOpen(false);
      form.resetFields();
      message.success(`Application ${created.applicationNo} submitted`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (application: MembershipApplication) => {
    try {
      await api(`/api/membership-applications/${application.id}/pay`, { method: 'POST' });
      message.success(`Payment recorded for ${application.applicationNo}`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const approve = async (application: MembershipApplication) => {
    if (application.paymentStatus !== 'Paid') {
      message.warning('Payment required before approval. Mark the application as paid first.');
      return;
    }
    try {
      await api(`/api/membership-applications/${application.id}/approve`, { method: 'POST' });
      message.success(
        `${application.applicationNo} approved — member and share account provisioned`,
      );
      await load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const openReject = (application: MembershipApplication) => {
    setRejectTarget(application);
    rejectForm.resetFields();
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    const values = await rejectForm.validateFields();
    setRejecting(true);
    try {
      await api(`/api/membership-applications/${rejectTarget.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: values.reason }),
      });
      message.success(`${rejectTarget.applicationNo} rejected`);
      setRejectTarget(null);
      rejectForm.resetFields();
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Membership Applications"
        subtitle="Join SACCO, collect payment, approve and auto-provision membership accounts"
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Applications"
            value={summary.total}
            icon={<TeamOutlined style={{ color: colors.primary }} />}
            caption="All channels"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Pending"
            value={summary.pending}
            icon={<ClockCircleOutlined style={{ color: colors.accent }} />}
            caption="Awaiting decision"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Approved"
            value={summary.approved}
            icon={<CheckCircleOutlined style={{ color: colors.success }} />}
            caption="Provisioned members"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Rejected"
            value={summary.rejected}
            icon={<CloseCircleOutlined style={{ color: colors.danger }} />}
            caption="Declined applications"
          />
        </Col>
      </Row>

      <Card
        title="Application Queue"
        extra={
          <Space wrap>
            <Input
              placeholder="Search app no, applicant or phone"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={['Pending', 'Approved', 'Rejected'].map((s) => ({ label: s, value: s }))}
            />
            <Button icon={<ReloadOutlined />} onClick={load}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              New Application
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: 'No membership applications found' }}
          columns={[
            { title: 'App No', dataIndex: 'applicationNo', width: 110 },
            {
              title: 'Applicant',
              dataIndex: 'fullName',
              width: 160,
              render: (v, r) => (
                <div style={{ maxWidth: 150 }}>
                  <Typography.Text strong ellipsis style={{ display: 'block' }}>
                    {v}
                  </Typography.Text>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#999',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.email ?? '—'}
                  </div>
                </div>
              ),
            },
            { title: 'Type', dataIndex: 'applicantType', width: 90 },
            { title: 'Phone', dataIndex: 'phone', width: 120 },
            { title: 'Branch', dataIndex: 'branch', width: 95, ellipsis: true },
            { title: 'Shares', dataIndex: 'shareCount', align: 'right', width: 85 },
            {
              title: 'Payment',
              dataIndex: 'paymentStatus',
              width: 85,
              render: (s: MembershipApplication['paymentStatus']) => (
                <Tag color={paymentColor[s]}>{s}</Tag>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 85,
              render: (s: MembershipApplication['status']) => <Tag color={statusColor[s]}>{s}</Tag>,
            },
            { title: 'Submitted', dataIndex: 'submittedAt', width: 90, render: fmtDate },
            {
              title: 'Actions',
              width: 215,
              render: (_, r) => {
                if (r.status !== 'Pending') {
                  return <Typography.Text type="secondary">—</Typography.Text>;
                }
                const blocked = r.paymentStatus !== 'Paid';
                return (
                  <Space>
                    {blocked && (
                      <Button size="small" onClick={() => markPaid(r)}>
                        Mark Paid
                      </Button>
                    )}
                    <Tooltip title={blocked ? 'Payment required before approval' : undefined}>
                      <span
                        style={{ display: 'inline-block' }}
                        onClick={() => {
                          if (blocked) approve(r);
                        }}
                      >
                        <Button
                          size="small"
                          type="primary"
                          disabled={blocked}
                          onClick={() => approve(r)}
                        >
                          Approve
                        </Button>
                      </span>
                    </Tooltip>
                    <Button size="small" danger onClick={() => openReject(r)}>
                      Reject
                    </Button>
                  </Space>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        title="New Membership Application"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={createApplication}
        okText="Submit Application"
        confirmLoading={saving}
        width={680}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Applicant Type" name="applicantType" initialValue="Individual">
                <Select
                  options={[
                    { label: 'Individual', value: 'Individual' },
                    { label: 'Entity', value: 'Entity' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Channel" name="channel" initialValue="Staff">
                <Select
                  options={[
                    { label: 'Staff', value: 'Staff' },
                    { label: 'Portal', value: 'Portal' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Full Name"
                name="fullName"
                rules={[{ required: true, message: 'Full name is required' }]}
              >
                <Input placeholder="e.g. Almaz Tesfaye" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[{ required: true, message: 'Phone is required' }]}
              >
                <Input placeholder="+251 9x xxx xxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Fayda ID" name="faydaId">
                <Input placeholder="FAY-xxxxxxxxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="name@email.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Employer" name="employer">
                <Input placeholder="e.g. Ethio Telecom" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Branch"
                name="branch"
                rules={[{ required: true, message: 'Branch is required' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select branch"
                  options={branches.map((b) => ({ label: b.name, value: b.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Share Product"
                name="shareProductId"
                rules={[{ required: true, message: 'Share product is required' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select share product"
                  options={shareCategories.map((c) => ({
                    label: `${c.code} — ${c.name}`,
                    value: c.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Share Count"
                name="shareCount"
                initialValue={1}
                rules={[
                  { required: true, message: 'Share count is required' },
                  {
                    validator: (_, value) =>
                      Number(value) >= 1
                        ? Promise.resolve()
                        : Promise.reject(new Error('Share count must be at least 1')),
                  },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} step={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Compulsory Savings Product" name="compulsoryProductId">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select savings product"
                  options={savingsProducts.map((p) => ({ label: p.name, value: p.id }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            Entrance fee and registration fee are applied on approval. The member and share
            account are auto-provisioned once payment is confirmed.
          </Typography.Text>
        </Form>
      </Modal>

      <Modal
        title={`Reject Application ${rejectTarget?.applicationNo ?? ''}`}
        open={!!rejectTarget}
        onCancel={() => {
          setRejectTarget(null);
          rejectForm.resetFields();
        }}
        onOk={submitReject}
        okText="Reject Application"
        okButtonProps={{ danger: true }}
        confirmLoading={rejecting}
      >
        <Form form={rejectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Rejection Reason"
            name="reason"
            rules={[{ required: true, message: 'Rejection reason is required' }]}
          >
            <Input.TextArea rows={4} placeholder="Explain why this application is being rejected" />
          </Form.Item>
        </Form>
      </Modal>
    </ProCard>
  );
}
