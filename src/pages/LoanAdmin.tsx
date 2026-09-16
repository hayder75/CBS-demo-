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
  message,
} from 'antd';
import {
  AppstoreOutlined,
  ClusterOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { CurrencyInput } from '../components/CurrencyInput';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { BatchJob, CreditCommittee, LoanCategory, LoanGroup } from '../types';
import { fmtETB } from '../utils/format';

export default function LoanAdmin() {
  const [committees, setCommittees] = useState<CreditCommittee[]>([]);
  const [categories, setCategories] = useState<LoanCategory[]>([]);
  const [groups, setGroups] = useState<LoanGroup[]>([]);
  const [jobs, setJobs] = useState<BatchJob[]>([]);

  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setCommittees(await api<CreditCommittee[]>('/api/committees').catch(() => []));
    setCategories(await api<LoanCategory[]>('/api/loan-categories').catch(() => []));
    setGroups(await api<LoanGroup[]>('/api/loan-groups').catch(() => []));
    setJobs(await api<BatchJob[]>('/api/batch-jobs').catch(() => []));
  };

  useEffect(() => { load(); }, []);

  const submit = async (path: string) => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api(path, { method: 'POST', body: JSON.stringify(values) });
      setOpen(null);
      form.resetFields();
      message.success('Created');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const act = async (path: string, msg: string) => { await api(path, { method: 'POST' }); message.success(msg); await load(); };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Loan Administration"
        subtitle="Credit committees, loan categories, groups and batch processing"
        extra={
          <Space>
            <Button icon={<PlayCircleOutlined />} onClick={() => setOpen('job')}>
              New Job
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('committee')}>
              New Committee
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Credit Committees"
            value={committees.length}
            icon={<TeamOutlined style={{ color: '#0e7a5f' }} />}
            caption={`${committees.filter((c) => c.status === 'Pending').length} pending verification`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Loan Categories"
            value={categories.length}
            icon={<AppstoreOutlined style={{ color: '#2e90fa' }} />}
            caption={`${categories.filter((c) => c.status === 'Pending').length} pending verification`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Loan Groups"
            value={groups.length}
            icon={<ClusterOutlined style={{ color: '#f79009' }} />}
            caption={`${groups.filter((g) => g.status === 'Pending').length} pending verification`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Batch Jobs"
            value={jobs.length}
            icon={<PlayCircleOutlined style={{ color: '#12b76a' }} />}
            caption={`${jobs.filter((j) => j.status === 'Running').length} running now`}
          />
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'committee',
            label: 'Credit Committee',
            children: (
              <Card title="Credit Committees" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('committee')}>New Committee</Button>}>
                <Table
                  rowKey="id"
                  dataSource={committees}
                  pagination={false}
                  columns={[
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Min Amount', dataIndex: 'minAmount', align: 'right' as const, render: (v: number) => fmtETB(v) },
                    { title: 'Max Amount', dataIndex: 'maxAmount', align: 'right' as const, render: (v: number) => fmtETB(v) },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={s === 'Verified' ? 'green' : 'gold'}>{s}</Tag> },
                    { title: 'Actions', render: (_: unknown, r: CreditCommittee) => r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => act(`/api/committees/${r.id}/verify`, 'Committee verified')}>Verify</Button> : null },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'categories',
            label: 'Loan Categories',
            children: (
              <Card title="Loan Categories" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('category')}>New Category</Button>}>
                <Table
                  rowKey="id"
                  dataSource={categories}
                  pagination={false}
                  columns={[
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Description', dataIndex: 'description' },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={s === 'Verified' ? 'green' : 'gold'}>{s}</Tag> },
                    { title: 'Actions', render: (_: unknown, r: LoanCategory) => r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => act(`/api/loan-categories/${r.id}/verify`, 'Category verified')}>Verify</Button> : null },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'groups',
            label: 'Loan Groups',
            children: (
              <Card title="Loan Groups" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('group')}>New Group</Button>}>
                <Table
                  rowKey="id"
                  dataSource={groups}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 100 },
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Max Members', dataIndex: 'maxMembers', align: 'right' as const },
                    { title: 'Status', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={s === 'Verified' ? 'green' : 'gold'}>{s}</Tag> },
                    { title: 'Actions', render: (_: unknown, r: LoanGroup) => r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => act(`/api/loan-groups/${r.id}/verify`, 'Group verified')}>Verify</Button> : null },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'batch',
            label: 'Batch Jobs',
            children: (
              <Card title="Batch Jobs" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('job')}>New Job</Button>}>
                <Table
                  rowKey="id"
                  dataSource={jobs}
                  pagination={false}
                  columns={[
                    { title: 'Type', dataIndex: 'jobType', width: 200, render: (t: string) => <Tag>{t}</Tag> },
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Status', dataIndex: 'status', width: 110, render: (s: string) => <Tag color={s === 'Done' ? 'green' : s === 'Running' ? 'blue' : 'default'}>{s}</Tag> },
                    { title: 'Last Run', dataIndex: 'lastRunAt', width: 170, render: (v: string) => (v ? new Date(v).toLocaleString() : '—') },
                    { title: 'Action', width: 120, render: (_: unknown, r: BatchJob) => <Button size="small" icon={<PlayCircleOutlined />} onClick={() => act(`/api/batch-jobs/${r.id}/run`, 'Job executed')}>Run Now</Button> },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Committee modal */}
      <Modal title="New Credit Committee" open={open === 'committee'} onCancel={() => setOpen(null)} onOk={() => submit('/api/committees')} okText="Create Committee" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={24}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Min Amount (auto-approve below)" name="minAmount" initialValue={0}><CurrencyInput style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Max Amount" name="maxAmount" initialValue={0}><CurrencyInput style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Category modal */}
      <Modal title="New Loan Category" open={open === 'category'} onCancel={() => setOpen(null)} onOk={() => submit('/api/loan-categories')} okText="Create Category" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Description" name="description"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Group modal */}
      <Modal title="New Loan Group" open={open === 'group'} onCancel={() => setOpen(null)} onOk={() => submit('/api/loan-groups')} okText="Create Group" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Max Members" name="maxMembers" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Job modal */}
      <Modal title="New Batch Job" open={open === 'job'} onCancel={() => setOpen(null)} onOk={() => submit('/api/batch-jobs')} okText="Create Job" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Job Type" name="jobType" rules={[{ required: true }]}>
                <Select
                  options={['INTEREST_CALCULATION', 'INTEREST_POSTING', 'LOAN_OPERATION', 'DEPRECIATION', 'COLLATERAL_INSURANCE', 'SAVING_STATUS'].map((t) => ({ label: t, value: t }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </ProCard>
  );
}