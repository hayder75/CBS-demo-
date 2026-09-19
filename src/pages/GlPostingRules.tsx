import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
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
  ApartmentOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { colors } from '../theme';
import { api } from '../api/client';
import type { GLAccount, GlPostingRule } from '../types';

const productTypes: GlPostingRule['productType'][] = [
  'Savings',
  'Loan',
  'Share',
  'Fee',
  'Treasury',
  'Expense',
];

const statusColor: Record<GlPostingRule['status'], string> = {
  Active: 'green',
  Inactive: 'default',
};

export default function GlPostingRules() {
  const [rules, setRules] = useState<GlPostingRule[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GlPostingRule | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<GlPostingRule['productType'] | undefined>();
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([
        api<GlPostingRule[]>('/api/gl-rules').catch(() => [] as GlPostingRule[]),
        api<GLAccount[]>('/api/accounting/accounts').catch(() => [] as GLAccount[]),
      ]);
      setRules(r);
      setAccounts(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    if (editing) {
      form.setFieldsValue({
        event: editing.event,
        description: editing.description,
        productType: editing.productType,
        debitAccountCode: editing.debitAccountCode,
        creditAccountCode: editing.creditAccountCode,
      });
    } else {
      form.resetFields();
    }
  }, [modalOpen, editing, form]);

  const accountCodes = useMemo(() => new Set(accounts.map((a) => a.code)), [accounts]);
  const accountLabel = useMemo(() => {
    const map = new Map(accounts.map((a) => [a.code, a.name]));
    return (code: string) => (map.has(code) ? `${code} — ${map.get(code)}` : code);
  }, [accounts]);

  const isValidRule = (r: GlPostingRule) =>
    accountCodes.size > 0 &&
    accountCodes.has(r.debitAccountCode) &&
    accountCodes.has(r.creditAccountCode) &&
    r.debitAccountCode !== r.creditAccountCode;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter((r) => {
      const matchesSearch =
        !q ||
        r.event.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.debitAccountCode.toLowerCase().includes(q) ||
        r.creditAccountCode.toLowerCase().includes(q);
      const matchesType = !typeFilter || r.productType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [rules, search, typeFilter]);

  const stats = useMemo(() => {
    const active = rules.filter((r) => r.status === 'Active').length;
    return {
      total: rules.length,
      active,
      inactive: rules.length - active,
      events: new Set(rules.map((r) => r.event)).size,
    };
  }, [rules]);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ label: `${a.code} — ${a.name}`, value: a.code })),
    [accounts],
  );

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (rule: GlPostingRule) => {
    setEditing(rule);
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/gl-rules/${editing.id}`, {
          method: 'POST',
          body: JSON.stringify({
            debitAccountCode: values.debitAccountCode,
            creditAccountCode: values.creditAccountCode,
            description: values.description,
          }),
        });
        message.success('Posting rule updated');
      } else {
        await api('/api/gl-rules', { method: 'POST', body: JSON.stringify(values) });
        message.success('Posting rule created');
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: GlPostingRule) => {
    try {
      await api(`/api/gl-rules/${rule.id}/toggle`, { method: 'POST' });
      message.success(rule.status === 'Active' ? 'Rule disabled' : 'Rule enabled');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="GL Posting Rules"
        subtitle="Product-to-chart-of-accounts mapping for automatic journal posting"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
            New Rule
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Rules"
            value={stats.total}
            icon={<ApartmentOutlined style={{ color: colors.info }} />}
            caption="Configured posting rules"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Active"
            value={stats.active}
            icon={<CheckCircleOutlined style={{ color: colors.success }} />}
            caption="Applied on transaction posting"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Inactive"
            value={stats.inactive}
            icon={<StopOutlined style={{ color: colors.danger }} />}
            caption="Suspended mappings"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Events Covered"
            value={stats.events}
            icon={<ThunderboltOutlined style={{ color: colors.accent }} />}
            caption="Distinct business events"
          />
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ApartmentOutlined /> Posting Rules
          </Space>
        }
      >
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search event, description or account"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Product type"
              value={typeFilter}
              onChange={(v) => setTypeFilter(v)}
              options={productTypes.map((p) => ({ label: p, value: p }))}
            />
          </Col>
        </Row>

        <Table
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          locale={{ emptyText: 'No posting rules match the current filters' }}
          columns={[
            { title: 'Event', dataIndex: 'event', width: 200, render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
            { title: 'Description', dataIndex: 'description', ellipsis: true },
            { title: 'Product Type', dataIndex: 'productType', width: 120, render: (v: GlPostingRule['productType']) => <Tag color="blue">{v}</Tag> },
            {
              title: 'Debit Account',
              dataIndex: 'debitAccountCode',
              width: 240,
              render: (v: string) => (
                <span style={{ color: accountCodes.has(v) ? undefined : colors.danger }}>{accountLabel(v)}</span>
              ),
            },
            {
              title: 'Credit Account',
              dataIndex: 'creditAccountCode',
              width: 240,
              render: (v: string) => (
                <span style={{ color: accountCodes.has(v) ? undefined : colors.danger }}>{accountLabel(v)}</span>
              ),
            },
            { title: 'Status', dataIndex: 'status', width: 100, render: (v: GlPostingRule['status']) => <Tag color={statusColor[v]}>{v}</Tag> },
            {
              title: 'Action',
              width: 170,
              render: (_: unknown, r: GlPostingRule) => (
                <Space>
                  <Tooltip title={isValidRule(r) ? '' : 'Cannot toggle: account mapping is invalid'}>
                    <Button size="small" disabled={!isValidRule(r)} onClick={() => toggleRule(r)}>
                      {r.status === 'Active' ? 'Disable' : 'Enable'}
                    </Button>
                  </Tooltip>
                  <Button size="small" type="link" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editing ? `Edit Posting Rule — ${editing.event}` : 'New Posting Rule'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editing ? 'Save Rule' : 'Create Rule'}
        confirmLoading={saving}
        width={620}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Event"
                name="event"
                rules={[{ required: true, message: 'Event is required' }]}
              >
                <Input placeholder="e.g. SAVINGS_DEPOSIT" disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Product Type"
                name="productType"
                rules={[{ required: true, message: 'Product type is required' }]}
              >
                <Select placeholder="Select product type" options={productTypes.map((p) => ({ label: p, value: p }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input placeholder="What does this rule post?" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Debit Account"
                name="debitAccountCode"
                rules={[{ required: true, message: 'Debit account is required' }]}
              >
                <Select showSearch optionFilterProp="label" placeholder="Select debit account" options={accountOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Credit Account"
                name="creditAccountCode"
                dependencies={['debitAccountCode']}
                rules={[
                  { required: true, message: 'Credit account is required' },
                  ({ getFieldValue }) => ({
                    validator: (_, value) =>
                      value && value === getFieldValue('debitAccountCode')
                        ? Promise.reject(new Error('Debit and credit accounts must differ'))
                        : Promise.resolve(),
                  }),
                ]}
              >
                <Select showSearch optionFilterProp="label" placeholder="Select credit account" options={accountOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary" style={{ display: 'block' }}>
            Debit and credit accounts must be different and both drawn from the chart of accounts.
          </Typography.Text>
        </Form>
      </Modal>
    </ProCard>
  );
}
