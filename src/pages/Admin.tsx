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
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { AuditLogEntry, Branch, TransactionLimit } from '../types';
import { fmtETB } from '../utils/format';

export default function Admin() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [limits, setLimits] = useState<TransactionLimit[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setBranches(await api<Branch[]>('/api/branches').catch(() => []));
    setLimits(await api<TransactionLimit[]>('/api/transaction-limits').catch(() => []));
    setLogs(await api<AuditLogEntry[]>('/api/audit/logs').catch(() => []));
  };

  useEffect(() => { load(); }, []);

  const submit = async (path: string) => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api(path, { method: 'POST', body: JSON.stringify(values) });
      setOpen(null);
      form.resetFields();
      message.success('Saved');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const act = async (path: string, msg: string) => { await api(path, { method: 'POST' }); message.success(msg); await load(); };

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Tabs
        items={[
          {
            key: 'branches',
            label: 'Branches',
            children: (
              <Card title="Branch Management" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('branch')}>New Branch</Button>}>
                <Table
                  rowKey="id"
                  dataSource={branches}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 90 },
                    { title: 'Branch', dataIndex: 'name' },
                    { title: 'Address', dataIndex: 'address' },
                    { title: 'Phone', dataIndex: 'phone', width: 140 },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={s === 'Verified' || s === 'Active' ? 'green' : s === 'Pending' ? 'gold' : s === 'Inactive' ? 'orange' : 'default'}>{s}</Tag> },
                    {
                      title: 'Actions',
                      width: 200,
                      render: (_: unknown, r: Branch) => (
                        <Space>
                          {r.status === 'Pending' && <Button size="small" type="primary" onClick={() => act(`/api/branches/${r.id}/verify`, 'Branch verified')}>Verify</Button>}
                          {r.status === 'Verified' && <Button size="small" onClick={() => act(`/api/branches/${r.id}`, 'Closure requested')}>Close</Button>}
                        </Space>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'config',
            label: 'Transaction Config',
            children: (
              <Card title="Role-Based Transaction Limits" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('limit')}>New Limit</Button>}>
                <Table
                  rowKey="id"
                  dataSource={limits}
                  pagination={false}
                  columns={[
                    { title: 'Role', dataIndex: 'roleCode', width: 150, render: (r: string) => <Tag>{r}</Tag> },
                    { title: 'Type', dataIndex: 'txnType', width: 140 },
                    { title: 'Max Amount', dataIndex: 'maxAmount', align: 'right' as const, render: (v: number) => fmtETB(v) },
                  ]}
                />
                <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
                  Withdrawal and transfer limits enforce role-based authorization thresholds. Large
                  transactions must be processed by an authorized role.
                </Typography.Paragraph>
              </Card>
            ),
          },
          {
            key: 'logs',
            label: 'Audit Logs',
            children: (
              <Card title="Audit Logs">
                <Table
                  rowKey="id"
                  dataSource={logs}
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  columns={[
                    { title: 'When', dataIndex: 'occurredAt', width: 180, render: (v: string) => new Date(v).toLocaleString() },
                    { title: 'User', dataIndex: 'username', width: 120 },
                    { title: 'Action', dataIndex: 'action', width: 170, render: (a: string) => <Tag>{a}</Tag> },
                    { title: 'Entity', dataIndex: 'entity', width: 100 },
                    { title: 'Ref', dataIndex: 'entityId', width: 90 },
                    { title: 'Detail', dataIndex: 'detail', ellipsis: true },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Branch modal */}
      <Modal title="New Branch" open={open === 'branch'} onCancel={() => setOpen(null)} onOk={() => submit('/api/branches')} okText="Create Branch" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Address" name="address"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Phone" name="phone"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Limit modal */}
      <Modal title="New Transaction Limit" open={open === 'limit'} onCancel={() => setOpen(null)} onOk={() => submit('/api/transaction-limits')} okText="Create Limit" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Role" name="roleCode" rules={[{ required: true }]}>
                <Select
                  options={['ADMIN', 'MANAGER', 'TELLER', 'CREDIT_OFFICER', 'ACCOUNTANT', 'AUDITOR'].map((r) => ({ label: r, value: r }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Transaction Type" name="txnType" rules={[{ required: true }]}>
                <Select options={['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map((t) => ({ label: t, value: t }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Max Amount (ETB)" name="maxAmount" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={1000} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </ProCard>
  );
}