import { useEffect, useState } from 'react';
import type { Key } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { useMembers } from '../context/MembersContext';
import { api } from '../api/client';
import type {
  CustomFieldType,
  DormancyCandidate,
  DormancyPolicy,
  DormancyRunResult,
  Member,
  MemberCustomField,
  MemberExitRequest,
} from '../types';
import { fmtETB, fmtDate } from '../utils/format';
import { colors } from '../theme';

const fieldTypeColor: Record<CustomFieldType, string> = {
  Text: 'blue',
  Number: 'geekblue',
  Date: 'purple',
  Select: 'gold',
  Boolean: 'cyan',
};

const exitStatusColor: Record<MemberExitRequest['status'], string> = {
  Pending: 'gold',
  Approved: 'blue',
  Completed: 'green',
  Rejected: 'red',
};

const memberStatusColor: Record<string, string> = {
  Active: 'green',
  Dormant: 'orange',
  Suspended: 'red',
  Deceased: 'default',
  Withdrawn: 'default',
};

const fieldTypes: CustomFieldType[] = ['Text', 'Number', 'Date', 'Select', 'Boolean'];

export default function MemberLifecycle() {
  const { members, setMembers } = useMembers();
  const [fields, setFields] = useState<MemberCustomField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldSaving, setFieldSaving] = useState(false);
  const [fieldForm] = Form.useForm();
  const watchedType = Form.useWatch('type', fieldForm);

  const [policy, setPolicy] = useState<DormancyPolicy | null>(null);
  const [policyForm] = Form.useForm();
  const [policySaving, setPolicySaving] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [candidates, setCandidates] = useState<DormancyCandidate[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Key[]>([]);
  const [flagLoading, setFlagLoading] = useState(false);
  const [reactivating, setReactivating] = useState<string | null>(null);

  const [exits, setExits] = useState<MemberExitRequest[]>([]);
  const [exitsLoading, setExitsLoading] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitSaving, setExitSaving] = useState(false);
  const [exitForm] = Form.useForm();
  const [viewing, setViewing] = useState<MemberExitRequest | null>(null);
  const [exitBusy, setExitBusy] = useState<string | null>(null);

  const loadFields = async () => {
    setFieldsLoading(true);
    try {
      setFields(await api<MemberCustomField[]>('/api/member-custom-fields'));
    } catch {
      setFields([]);
    } finally {
      setFieldsLoading(false);
    }
  };

  const loadPolicy = async () => {
    try {
      const loaded = await api<DormancyPolicy>('/api/dormancy/policy');
      setPolicy(loaded);
      policyForm.setFieldsValue(loaded);
    } catch {
      setPolicy(null);
    }
  };

  const loadExits = async () => {
    setExitsLoading(true);
    try {
      setExits(await api<MemberExitRequest[]>('/api/member-exits'));
    } catch {
      setExits([]);
    } finally {
      setExitsLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
    loadPolicy();
    loadExits();
  }, []);

  const refreshAll = async () => {
    await Promise.all([loadFields(), loadPolicy(), loadExits()]);
    message.success('Member lifecycle data refreshed');
  };

  const openFieldModal = () => {
    fieldForm.resetFields();
    fieldForm.setFieldsValue({ type: 'Text', appliesTo: 'Both', required: false });
    setFieldModalOpen(true);
  };

  const createField = async () => {
    const values = await fieldForm.validateFields();
    setFieldSaving(true);
    try {
      await api<MemberCustomField>('/api/member-custom-fields', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setFieldModalOpen(false);
      fieldForm.resetFields();
      message.success('Custom field created');
      await loadFields();
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setFieldSaving(false);
    }
  };

  const toggleField = async (field: MemberCustomField) => {
    try {
      await api(`/api/member-custom-fields/${field.id}/toggle`, { method: 'POST' });
      message.success(`${field.label} ${field.status === 'Active' ? 'deactivated' : 'activated'}`);
      await loadFields();
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const savePolicy = async () => {
    const values = await policyForm.validateFields();
    setPolicySaving(true);
    try {
      const saved = await api<DormancyPolicy>('/api/dormancy/policy', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setPolicy(saved);
      policyForm.setFieldsValue(saved);
      message.success('Dormancy policy saved');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setPolicySaving(false);
    }
  };

  const runCheck = async () => {
    setRunLoading(true);
    try {
      const result = await api<DormancyRunResult>('/api/dormancy/run', { method: 'POST' });
      setCandidates(result.candidates);
      setSelectedIds([]);
      setHasRun(true);
      message.success(`${result.flagged} dormancy candidate(s) found, ${result.skipped} skipped`);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setRunLoading(false);
    }
  };

  const flagSelected = async () => {
    if (selectedIds.length === 0) {
      message.warning('Select at least one member to flag');
      return;
    }
    setFlagLoading(true);
    try {
      const ids = selectedIds.map(String);
      const result = await api<{ flagged: number }>('/api/dormancy/flag', {
        method: 'POST',
        body: JSON.stringify({ memberIds: ids }),
      });
      setCandidates((prev) =>
        prev.map((candidate) =>
          ids.includes(String(candidate.memberId)) ? { ...candidate, status: 'Dormant' } : candidate,
        ),
      );
      setMembers((prev) =>
        prev.map((member) =>
          ids.includes(String(member.id)) ? { ...member, status: 'Dormant' as const } : member,
        ),
      );
      setSelectedIds([]);
      message.success(`${result.flagged} member(s) flagged as dormant`);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setFlagLoading(false);
    }
  };

  const reactivate = async (candidate: DormancyCandidate) => {
    setReactivating(String(candidate.memberId));
    try {
      await api('/api/dormancy/reactivate', {
        method: 'POST',
        body: JSON.stringify({ memberId: candidate.memberId }),
      });
      setCandidates((prev) =>
        prev.map((row) =>
          String(row.memberId) === String(candidate.memberId) ? { ...row, status: 'Active' } : row,
        ),
      );
      setMembers((prev) =>
        prev.map((member) =>
          String(member.id) === String(candidate.memberId)
            ? { ...member, status: 'Active' as const }
            : member,
        ),
      );
      message.success(`${candidate.memberName} reactivated`);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setReactivating(null);
    }
  };

  const openExitModal = () => {
    exitForm.resetFields();
    setExitModalOpen(true);
  };

  const createExit = async () => {
    const values = await exitForm.validateFields();
    setExitSaving(true);
    try {
      const created = await api<MemberExitRequest>('/api/member-exits', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setExitModalOpen(false);
      exitForm.resetFields();
      message.success('Exit request submitted');
      await loadExits();
      setViewing(created);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setExitSaving(false);
    }
  };

  const applyExit = (updated: MemberExitRequest) => {
    setExits((prev) => prev.map((exit) => (exit.id === updated.id ? updated : exit)));
    setViewing((prev) => (prev && prev.id === updated.id ? updated : prev));
  };

  const toggleChecklist = async (exit: MemberExitRequest, key: string, done: boolean) => {
    setExitBusy(exit.id);
    try {
      const updated = await api<MemberExitRequest>(`/api/member-exits/${exit.id}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ key, done }),
      });
      applyExit(updated);
      message.success(done ? 'Checklist item completed' : 'Checklist item reopened');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setExitBusy(null);
    }
  };

  const exitAction = async (exit: MemberExitRequest, action: 'approve' | 'complete' | 'reject') => {
    setExitBusy(exit.id);
    try {
      const updated = await api<MemberExitRequest>(`/api/member-exits/${exit.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(action === 'reject' ? {} : {}),
      });
      applyExit(updated);
      if (action === 'complete') {
        setMembers((prev) =>
          prev.map((member) =>
            String(member.id) === String(exit.memberId)
              ? { ...member, status: 'Withdrawn' as const }
              : member,
          ),
        );
      }
      message.success(
        action === 'approve'
          ? 'Exit request approved'
          : action === 'complete'
            ? 'Exit completed and member withdrawn'
            : 'Exit request rejected',
      );
      await loadExits();
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setExitBusy(null);
    }
  };

  const activeFields = fields.filter((field) => field.status === 'Active');
  const memberOptions = members
    .filter((member) => member.status !== 'Withdrawn')
    .map((member: Member) => ({
      value: member.id,
      label: `${member.fullName} (${member.memberNo})`,
    }));

  const allChecklistDone = viewing ? viewing.checklist.every((item) => item.done) : false;
  const completeDisabled = !viewing || viewing.status !== 'Approved' || !allChecklistDone;
  const completeTooltip =
    viewing && viewing.status !== 'Approved'
      ? 'Approve the request before completing'
      : viewing && !allChecklistDone
        ? 'All checklist items must be completed first'
        : '';

  return (
    <div className="page-shell">
      <PageHeader
        title="Member Lifecycle"
        subtitle="Custom fields, dormancy control and member exit workflows"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refreshAll}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openFieldModal}>
              New Field
            </Button>
          </Space>
        }
      />

      <Tabs
        defaultActiveKey="custom"
        items={[
          {
            key: 'custom',
            label: 'Custom Fields',
            children: (
              <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <Row gutter={[20, 20]}>
                  <Col xs={24} sm={12} xl={6}>
                    <StatCard
                      title="Field Definitions"
                      value={fields.length}
                      icon={<AppstoreOutlined style={{ color: colors.primary }} />}
                      caption="Configured member attributes"
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <StatCard
                      title="Active Fields"
                      value={activeFields.length}
                      icon={<CheckCircleOutlined style={{ color: colors.success }} />}
                      caption={`${fields.length - activeFields.length} inactive`}
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <StatCard
                      title="Required Fields"
                      value={fields.filter((field) => field.required).length}
                      icon={<SafetyCertificateOutlined style={{ color: colors.accent }} />}
                      caption="Validated on save"
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={6}>
                    <StatCard
                      title="Select Fields"
                      value={fields.filter((field) => field.type === 'Select').length}
                      icon={<UserOutlined style={{ color: colors.info }} />}
                      caption="Controlled option lists"
                    />
                  </Col>
                </Row>

                <Card
                  title="Custom Field Definitions"
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={openFieldModal}>
                      New Field
                    </Button>
                  }
                >
                  <Table
                    rowKey="id"
                    loading={fieldsLoading}
                    dataSource={fields}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    locale={{ emptyText: 'No custom fields configured yet' }}
                    columns={[
                      { title: 'Key', dataIndex: 'key', render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
                      { title: 'Label', dataIndex: 'label' },
                      {
                        title: 'Type',
                        dataIndex: 'type',
                        width: 110,
                        render: (value: CustomFieldType) => <Tag color={fieldTypeColor[value]}>{value}</Tag>,
                      },
                      { title: 'Applies To', dataIndex: 'appliesTo', width: 120 },
                      {
                        title: 'Required',
                        dataIndex: 'required',
                        width: 100,
                        render: (value: boolean) =>
                          value ? <Tag color="red">Required</Tag> : <Tag>Optional</Tag>,
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        width: 100,
                        render: (value: string) => (
                          <Tag color={value === 'Active' ? 'green' : 'default'}>{value}</Tag>
                        ),
                      },
                      {
                        title: 'Toggle',
                        width: 120,
                        render: (_: unknown, field: MemberCustomField) => (
                          <Button size="small" onClick={() => toggleField(field)}>
                            {field.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: 'dormancy',
            label: 'Dormancy',
            children: (
              <Row gutter={[20, 20]}>
                <Col xs={24} xl={9}>
                  <Card title="Dormancy Policy" style={{ height: '100%' }}>
                    <Form
                      form={policyForm}
                      layout="vertical"
                      initialValues={{ months: 12, autoFlagMembers: true, autoFlagAccounts: true }}
                    >
                      <Form.Item
                        label="Inactivity threshold (months)"
                        name="months"
                        rules={[
                          { required: true, message: 'Months is required' },
                          {
                            type: 'number',
                            min: 1,
                            max: 60,
                            message: 'Months must be between 1 and 60',
                          },
                        ]}
                      >
                        <InputNumber min={1} max={60} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item
                        label="Automatically flag members"
                        name="autoFlagMembers"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        label="Automatically flag accounts"
                        name="autoFlagAccounts"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                      <Space>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={policySaving}
                          onClick={savePolicy}
                        >
                          Save Policy
                        </Button>
                      </Space>
                      {policy && (
                        <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
                          Last updated {fmtDate(policy.updatedAt)}
                        </Typography.Paragraph>
                      )}
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} xl={15}>
                  <Card
                    title="Dormancy Candidates"
                    extra={
                      <Space>
                        <Button
                          icon={<ThunderboltOutlined />}
                          loading={runLoading}
                          onClick={runCheck}
                        >
                          Run Check
                        </Button>
                        <Button
                          type="primary"
                          icon={<ClockCircleOutlined />}
                          loading={flagLoading}
                          disabled={selectedIds.length === 0}
                          onClick={flagSelected}
                        >
                          Flag Selected
                        </Button>
                      </Space>
                    }
                  >
                    <Table
                      rowKey="memberId"
                      loading={runLoading}
                      dataSource={candidates}
                      pagination={{ pageSize: 10, showSizeChanger: false }}
                      locale={{
                        emptyText: hasRun
                          ? 'No dormancy candidates found'
                          : 'Run a dormancy check to see candidates',
                      }}
                      rowSelection={{
                        selectedRowKeys: selectedIds,
                        onChange: (keys) => setSelectedIds(keys),
                      }}
                      columns={[
                        {
                          title: 'Member',
                          dataIndex: 'memberName',
                          render: (value: string, row: DormancyCandidate) => (
                            <div>
                              <Typography.Text strong>{value}</Typography.Text>
                              <div style={{ fontSize: 11, color: colors.text3 }}>{row.memberNo}</div>
                            </div>
                          ),
                        },
                        { title: 'Last Activity', dataIndex: 'lastActivity', width: 130, render: fmtDate },
                        {
                          title: 'Savings',
                          dataIndex: 'savingsBalance',
                          align: 'right',
                          width: 130,
                          render: (value: number) => fmtETB(value),
                        },
                        {
                          title: 'Loan',
                          dataIndex: 'loanOutstanding',
                          align: 'right',
                          width: 120,
                          render: (value: number) => (value > 0 ? fmtETB(value) : '—'),
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          width: 100,
                          render: (value: string) => (
                            <Tag color={memberStatusColor[value]}>{value}</Tag>
                          ),
                        },
                        {
                          title: 'Action',
                          width: 120,
                          render: (_: unknown, row: DormancyCandidate) => (
                            <Button
                              size="small"
                              loading={reactivating === String(row.memberId)}
                              onClick={() => reactivate(row)}
                            >
                              Reactivate
                            </Button>
                          ),
                        },
                      ]}
                    />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'exits',
            label: 'Exit Requests',
            children: (
              <Card
                title="Exit Requests"
                extra={
                  <Button type="primary" icon={<LogoutOutlined />} onClick={openExitModal}>
                    New Exit Request
                  </Button>
                }
              >
                <Table
                  rowKey="id"
                  loading={exitsLoading}
                  dataSource={exits}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  locale={{ emptyText: 'No exit requests recorded' }}
                  columns={[
                    {
                      title: 'Member',
                      dataIndex: 'memberName',
                      render: (value: string, row: MemberExitRequest) => (
                        <div>
                          <Typography.Text strong>{value}</Typography.Text>
                          <div style={{ fontSize: 11, color: colors.text3 }}>{row.memberNo}</div>
                        </div>
                      ),
                    },
                    { title: 'Reason', dataIndex: 'reason', ellipsis: true },
                    {
                      title: 'Checklist Progress',
                      width: 190,
                      render: (_: unknown, row: MemberExitRequest) => {
                        const done = row.checklist.filter((item) => item.done).length;
                        const percent = row.checklist.length
                          ? Math.round((done / row.checklist.length) * 100)
                          : 0;
                        return (
                          <Space>
                            <Progress percent={percent} size="small" style={{ width: 90 }} />
                            <Typography.Text type="secondary">
                              {done}/{row.checklist.length}
                            </Typography.Text>
                          </Space>
                        );
                      },
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      width: 120,
                      render: (value: MemberExitRequest['status']) => (
                        <Tag color={exitStatusColor[value]}>{value}</Tag>
                      ),
                    },
                    {
                      title: 'Requested',
                      dataIndex: 'requestedAt',
                      width: 130,
                      render: fmtDate,
                    },
                    {
                      title: 'Action',
                      width: 100,
                      render: (_: unknown, row: MemberExitRequest) => (
                        <Button size="small" onClick={() => setViewing(row)}>
                          View
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="New Custom Field"
        open={fieldModalOpen}
        onCancel={() => setFieldModalOpen(false)}
        onOk={createField}
        okText="Create Field"
        confirmLoading={fieldSaving}
        width={560}
      >
        <Form form={fieldForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Key"
                name="key"
                rules={[{ required: true, message: 'Key is required' }]}
              >
                <Input placeholder="e.g. tax_id" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Label"
                name="label"
                rules={[{ required: true, message: 'Label is required' }]}
              >
                <Input placeholder="e.g. Tax ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Type"
                name="type"
                rules={[{ required: true, message: 'Type is required' }]}
              >
                <Select options={fieldTypes.map((type) => ({ label: type, value: type }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Applies To"
                name="appliesTo"
                rules={[{ required: true, message: 'Applies to is required' }]}
              >
                <Select
                  options={['Individual', 'Entity', 'Both'].map((value) => ({
                    label: value,
                    value,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          {watchedType === 'Select' && (
            <Form.Item
              label="Options"
              name="options"
              rules={[{ required: true, message: 'At least one option is required' }]}
            >
              <Select mode="tags" placeholder="Type an option and press enter" />
            </Form.Item>
          )}
          <Form.Item label="Required" name="required" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="New Exit Request"
        open={exitModalOpen}
        onCancel={() => setExitModalOpen(false)}
        onOk={createExit}
        okText="Submit Exit Request"
        confirmLoading={exitSaving}
        width={560}
      >
        <Form form={exitForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Member"
            name="memberId"
            rules={[{ required: true, message: 'Select a member' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select member"
              options={memberOptions}
            />
          </Form.Item>
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Reason is required' }]}
          >
            <Input.TextArea rows={4} placeholder="Reason for exiting the SACCO" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={viewing ? `Exit Request — ${viewing.memberName}` : 'Exit Request'}
        open={!!viewing}
        onClose={() => setViewing(null)}
        width={560}
      >
        {viewing && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color={exitStatusColor[viewing.status]}>{viewing.status}</Tag>
              <Typography.Text type="secondary">{viewing.memberNo}</Typography.Text>
              <Typography.Text type="secondary">Requested {fmtDate(viewing.requestedAt)}</Typography.Text>
            </Space>
            <div>
              <Typography.Text strong>Reason</Typography.Text>
              <Typography.Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                {viewing.reason}
              </Typography.Paragraph>
            </div>
            <div>
              <Typography.Text strong>Exit Checklist</Typography.Text>
              <Space direction="vertical" size={10} style={{ width: '100%', marginTop: 10 }}>
                {viewing.checklist.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <Space>
                      <Switch
                        size="small"
                        checked={item.done}
                        disabled={viewing.status !== 'Pending' || exitBusy === viewing.id}
                        onChange={(checked) => toggleChecklist(viewing, item.key, checked)}
                      />
                      <Typography.Text>{item.label}</Typography.Text>
                    </Space>
                    <Tag color={item.done ? 'green' : 'default'}>
                      {item.done ? 'Done' : 'Pending'}
                    </Tag>
                  </div>
                ))}
              </Space>
            </div>
            <Space wrap>
              <Button
                type="primary"
                disabled={viewing.status !== 'Pending'}
                loading={exitBusy === viewing.id}
                onClick={() => exitAction(viewing, 'approve')}
              >
                Approve
              </Button>
              <Tooltip title={completeTooltip}>
                <span>
                  <Button
                    type="primary"
                    disabled={completeDisabled}
                    loading={exitBusy === viewing.id}
                    onClick={() => exitAction(viewing, 'complete')}
                  >
                    Complete Exit
                  </Button>
                </span>
              </Tooltip>
              <Button
                danger
                disabled={viewing.status !== 'Pending' && viewing.status !== 'Approved'}
                loading={exitBusy === viewing.id}
                onClick={() => exitAction(viewing, 'reject')}
              >
                Reject
              </Button>
            </Space>
          </Space>
        )}
      </Drawer>
    </div>
  );
}
