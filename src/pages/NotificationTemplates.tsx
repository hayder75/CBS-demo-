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
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  EditOutlined,
  MailOutlined,
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { SmsTestCard } from '../components/SmsTestCard';
import { api } from '../api/client';
import type { GatewaySettings, NotificationTemplate } from '../types';
import { colors } from '../theme';

const CHANNELS = ['Email', 'SMS'];
const EVENTS = ['Deposit', 'Withdrawal', 'Transfer', 'Loan Approval', 'Loan Reminder', 'OTP'];

const PLACEHOLDER_NAME = /^[a-zA-Z][a-zA-Z0-9_]*$/;

function placeholderError(value: string): string | null {
  if (!value) return null;
  const matches = value.match(/\{\{.*?\}\}/g) ?? [];
  const opened = (value.match(/\{\{/g) ?? []).length;
  const closed = (value.match(/\}\}/g) ?? []).length;
  if (opened !== closed || matches.length !== opened) return 'Unbalanced placeholder braces';
  for (const token of matches) {
    const key = token.slice(2, -2).trim();
    if (!key) return 'Placeholder name cannot be empty';
    if (!PLACEHOLDER_NAME.test(key)) return `Invalid placeholder ${token}`;
  }
  return null;
}

function maskCredential(value?: string): string {
  if (!value) return 'not set';
  if (value.length <= 2) return '•'.repeat(value.length);
  return `${value[0]}${'•'.repeat(Math.max(value.length - 1, 1))}`;
}

export default function NotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [settings, setSettings] = useState<GatewaySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const channel = Form.useWatch('channel', form);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      setTemplates(await api<NotificationTemplate[]>('/api/notification-templates'));
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const loaded = await api<GatewaySettings>('/api/notification-settings');
      setSettings(loaded);
      settingsForm.setFieldsValue({ ...loaded, smtpUser: '' });
    } catch {
      setSettings(null);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadSettings();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ channel: 'Email', event: 'Deposit', subject: '', body: '' });
    setModalOpen(true);
  };

  const openEdit = (template: NotificationTemplate) => {
    setEditing(template);
    form.resetFields();
    form.setFieldsValue({
      code: template.code,
      name: template.name,
      channel: template.channel,
      event: template.event,
      subject: template.subject ?? '',
      body: template.body,
    });
    setModalOpen(true);
  };

  const submitTemplate = async () => {
    const values = await form.validateFields();
    const payload = {
      code: values.code,
      name: values.name,
      channel: values.channel,
      event: values.event,
      subject: values.channel === 'Email' ? values.subject : undefined,
      body: values.body,
    };
    setSaving(true);
    try {
      const path = editing
        ? `/api/notification-templates/${editing.id}`
        : '/api/notification-templates';
      await api(path, { method: 'POST', body: JSON.stringify(payload) });
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      message.success(editing ? 'Template updated' : 'Template created');
      await loadTemplates();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplate = async (template: NotificationTemplate) => {
    setTogglingId(template.id);
    try {
      await api(`/api/notification-templates/${template.id}/toggle`, { method: 'POST' });
      message.success(template.enabled ? 'Template disabled' : 'Template enabled');
      await loadTemplates();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setTogglingId(null);
    }
  };

  const saveSettings = async () => {
    const values = await settingsForm.validateFields();
    const enteredUser = (values.smtpUser ?? '').trim();
    const payload: GatewaySettings = {
      smtpHost: values.smtpHost,
      smtpPort: Number(values.smtpPort),
      smtpUser: enteredUser || settings?.smtpUser || '',
      smtpSecure: Boolean(values.smtpSecure),
      smsProvider: values.smsProvider ?? '',
      smsSenderId: values.smsSenderId ?? '',
      updatedAt: settings?.updatedAt ?? new Date().toISOString(),
    };
    setSavingSettings(true);
    try {
      const saved = await api<GatewaySettings>('/api/notification-settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSettings(saved);
      settingsForm.setFieldsValue({ ...saved, smtpUser: '' });
      message.success('Gateway settings saved');
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSavingSettings(false);
    }
  };

  const enabledCount = templates.filter((t) => t.enabled).length;
  const emailCount = templates.filter((t) => t.channel === 'Email').length;
  const smsCount = templates.filter((t) => t.channel === 'SMS').length;

  const placeholderRule = {
    validator: (_rule: unknown, value: string) => {
      const error = placeholderError(value ?? '');
      return error ? Promise.reject(new Error(error)) : Promise.resolve();
    },
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Notification Templates"
        subtitle="Email and SMS message templates plus delivery gateway configuration"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { loadTemplates(); loadSettings(); }}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Template
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Templates"
            value={templates.length}
            icon={<BellOutlined style={{ color: colors.primary }} />}
            caption="Configured notifications"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Enabled"
            value={enabledCount}
            icon={<CheckCircleOutlined style={{ color: colors.success }} />}
            caption={`${templates.length - enabledCount} disabled`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Email"
            value={emailCount}
            icon={<MailOutlined style={{ color: colors.info }} />}
            caption="SMTP channel"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="SMS"
            value={smsCount}
            icon={<MobileOutlined style={{ color: colors.accent }} />}
            caption="Bulk SMS channel"
          />
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'templates',
            label: 'Templates',
            children: (
              <Card
                title="Notification Templates"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>New Template</Button>}
              >
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={templates}
                  pagination={false}
                  locale={{ emptyText: 'No notification templates yet' }}
                  columns={[
                    { title: 'Name', dataIndex: 'name', ellipsis: true },
                    { title: 'Code', dataIndex: 'code', width: 140 },
                    {
                      title: 'Channel',
                      dataIndex: 'channel',
                      width: 110,
                      render: (c: NotificationTemplate['channel']) => (
                        <Tag color={c === 'Email' ? 'blue' : 'purple'}>{c}</Tag>
                      ),
                    },
                    { title: 'Event', dataIndex: 'event', width: 150 },
                    {
                      title: 'Enabled',
                      dataIndex: 'enabled',
                      width: 100,
                      render: (enabled: boolean, r: NotificationTemplate) => (
                        <Switch
                          size="small"
                          checked={enabled}
                          loading={togglingId === r.id}
                          onChange={() => toggleTemplate(r)}
                        />
                      ),
                    },
                    {
                      title: 'Actions',
                      width: 110,
                      render: (_: unknown, r: NotificationTemplate) => (
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
                          Edit
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'gateway',
            label: 'Gateway Settings',
            children: (
              <>
              <Card title="Gateway Settings">
                <Form
                  form={settingsForm}
                  layout="vertical"
                  disabled={loadingSettings}
                  onFinish={saveSettings}
                >
                  <Typography.Title level={5} style={{ marginTop: 0 }}>Email (SMTP)</Typography.Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="SMTP Host"
                        name="smtpHost"
                        rules={[{ required: true, message: 'SMTP host is required' }]}
                      >
                        <Input placeholder="smtp.sacco.local" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="SMTP Port"
                        name="smtpPort"
                        rules={[
                          { required: true, message: 'SMTP port is required' },
                          {
                            validator: (_rule: unknown, value: number) =>
                              Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 65535
                                ? Promise.resolve()
                                : Promise.reject(new Error('Port must be between 1 and 65535')),
                          },
                        ]}
                      >
                        <InputNumber style={{ width: '100%' }} min={1} max={65535} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="SMTP User"
                        name="smtpUser"
                        extra={`Current: ${maskCredential(settings?.smtpUser)} — leave blank to keep unchanged`}
                      >
                        <Input autoComplete="off" placeholder="Leave blank to keep current" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Use TLS / Secure" name="smtpSecure" valuePropName="checked">
                        <Switch checkedChildren="Secure" unCheckedChildren="Plain" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Typography.Title level={5}>SMS</Typography.Title>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="SMS Provider"
                        name="smsProvider"
                        rules={[{ required: true, message: 'SMS provider is required' }]}
                      >
                        <Input placeholder="AfroMessage" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Sender ID"
                        name="smsSenderId"
                        rules={[{ required: true, message: 'Sender ID is required' }]}
                      >
                        <Input placeholder="SACCO" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={savingSettings}
                      onClick={() => settingsForm.submit()}
                    >
                      Save Settings
                    </Button>
                    <Button onClick={() => loadSettings()}>Reset</Button>
                  </Space>
                </Form>
              </Card>
              <SmsTestCard />
              </>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Edit Template' : 'New Template'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        onOk={() => form.submit()}
        okText={editing ? 'Save Changes' : 'Create Template'}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} onFinish={submitTemplate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Code is required' }]}>
                <Input placeholder="TPL-DEP-001" disabled={Boolean(editing)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
                <Input placeholder="Deposit Confirmation" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Channel" name="channel" rules={[{ required: true }]}>
                <Select options={CHANNELS.map((c) => ({ label: c, value: c }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Event" name="event" rules={[{ required: true, message: 'Event is required' }]}>
                <Select options={EVENTS.map((e) => ({ label: e, value: e }))} />
              </Form.Item>
            </Col>
            {channel === 'Email' && (
              <Col span={24}>
                <Form.Item
                  label="Subject"
                  name="subject"
                  rules={[{ required: true, message: 'Email templates require a subject' }, placeholderRule]}
                >
                  <Input placeholder="Your deposit of {{amount}} has been received" />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item
                label="Body"
                name="body"
                rules={[{ required: true, message: 'Body is required' }, placeholderRule]}
              >
                <Input.TextArea rows={4} placeholder="Dear {{memberName}}, ..." />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            Placeholders use the {'{{name}}'} syntax, for example {'{{memberName}}'} or {'{{amount}}'}.
          </Typography.Text>
        </Form>
      </Modal>
    </div>
  );
}
