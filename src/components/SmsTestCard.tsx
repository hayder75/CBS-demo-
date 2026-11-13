import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { ReloadOutlined, SendOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import type { SmsGatewayStatus, SmsLogEntry } from '../types';

export function SmsTestCard() {
  const [status, setStatus] = useState<SmsGatewayStatus | null>(null);
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setStatus(await api<SmsGatewayStatus>('/api/sms/status').catch(() => null));
    setLogs(await api<SmsLogEntry[]>('/api/sms/logs').catch(() => []));
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    const values = await form.validateFields();
    setSending(true);
    try {
      await api('/api/sms/send', { method: 'POST', body: JSON.stringify(values) });
      message.success(`Test SMS sent to ${values.phone}`);
      form.setFieldValue('message', '');
      load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card
      title="Afro SMS Gateway"
      extra={<Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>}
      style={{ marginTop: 16 }}
    >
      {status && (
        <Space wrap style={{ marginBottom: 12 }}>
          <Tag color={status.enabled ? 'green' : 'red'}>
            {status.enabled ? 'Gateway active' : 'Not configured'}
          </Tag>
          <Typography.Text type="secondary">
            {status.provider} · sender {status.sender} · from {status.from}
          </Typography.Text>
        </Space>
      )}
      <Form form={form} layout="vertical" onFinish={send}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Phone required' }]}>
              <Input placeholder="+251 9x xxx xxxx" />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item label="Message" name="message" rules={[{ required: true, message: 'Message required' }]}>
              <Input placeholder="Test message from Anchor Financials" />
            </Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending}>
            Send test SMS
          </Button>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            The API key stays on the server and is never exposed to the browser.
          </Typography.Text>
        </Space>
      </Form>
      <Table
        style={{ marginTop: 16 }}
        size="small"
        rowKey="id"
        dataSource={logs.slice(0, 8)}
        pagination={false}
        columns={[
          { title: 'Phone', dataIndex: 'phone', width: 150 },
          { title: 'Purpose', dataIndex: 'purpose', width: 100 },
          {
            title: 'Status',
            dataIndex: 'status',
            width: 100,
            render: (s: string) => (
              <Tag color={s === 'Failed' ? 'red' : s === 'Verified' ? 'blue' : 'green'}>{s}</Tag>
            ),
          },
          { title: 'Detail', dataIndex: 'detail', ellipsis: true },
          {
            title: 'When',
            dataIndex: 'createdAt',
            width: 170,
            render: (v: string) => new Date(v).toLocaleString(),
          },
        ]}
      />
    </Card>
  );
}

export default SmsTestCard;
