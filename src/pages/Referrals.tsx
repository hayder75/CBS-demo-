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
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { colors } from '../theme';
import { api } from '../api/client';
import type { ReferralCode, ReferralRecord, ReferralReport, ReferralSettings } from '../types';
import { members } from '../mocks/data';
import { fmtETB, fmtDate } from '../utils/format';

const referralStatusColor: Record<ReferralRecord['status'], string> = {
  Pending: 'gold',
  Qualified: 'blue',
  Rewarded: 'green',
  Rejected: 'red',
};

const cleanPhone = (raw: string) => {
  const digits = String(raw ?? '').replace(/[^0-9+]/g, '');
  if (digits.startsWith('+251')) return digits;
  if (digits.startsWith('251')) return `+${digits}`;
  if (digits.startsWith('0')) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  return digits;
};

export default function Referrals() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [report, setReport] = useState<ReferralReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [codeSearch, setCodeSearch] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralRecord['status'] | undefined>();
  const [newCodeOpen, setNewCodeOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ReferralRecord | null>(null);
  const [newCodeForm] = Form.useForm();
  const [recordForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [codeRows, recordRows, currentSettings, currentReport] = await Promise.all([
        api<ReferralCode[]>('/api/referrals/codes'),
        api<ReferralRecord[]>('/api/referrals'),
        api<ReferralSettings>('/api/referrals/settings'),
        api<ReferralReport>('/api/referrals/report'),
      ]);
      setCodes(codeRows);
      setRecords(recordRows);
      setSettings(currentSettings);
      setReport(currentReport);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  useEffect(() => {
    if (!settings) return;
    settingsForm.setFieldsValue({
      enabled: settings.enabled,
      rewardPerReferral: settings.rewardPerReferral,
      minQualifyingDeposit: settings.minQualifyingDeposit,
      rewardMode: settings.rewardMode,
    });
  }, [settings, settingsForm]);

  const friendly = (e: unknown, fallback: string) => {
    const text = (e as Error).message ?? '';
    return text.includes('400') || text.includes('409') ? fallback : text || fallback;
  };

  const filteredCodes = useMemo(() => {
    const q = codeSearch.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter(
      (c) => c.code.toLowerCase().includes(q) || c.memberName.toLowerCase().includes(q),
    );
  }, [codes, codeSearch]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        r.code.toLowerCase().includes(q) ||
        r.referrerName.toLowerCase().includes(q) ||
        r.refereeName.toLowerCase().includes(q) ||
        r.refereePhone.toLowerCase().includes(q);
      return matchesSearch && (!statusFilter || r.status === statusFilter);
    });
  }, [records, search, statusFilter]);

  const activeCodes = useMemo(() => codes.filter((c) => c.status === 'Active'), [codes]);
  const membersWithActiveCode = useMemo(
    () => new Set(codes.filter((c) => c.status === 'Active').map((c) => c.memberId)),
    [codes],
  );
  const rewardDisabled = settings ? !settings.enabled : false;

  const openNewCode = () => {
    newCodeForm.resetFields();
    setNewCodeOpen(true);
  };

  const openRecord = () => {
    recordForm.resetFields();
    setRecordOpen(true);
  };

  const createCode = async () => {
    const values = await newCodeForm.validateFields();
    setSaving(true);
    try {
      const created = await api<ReferralCode>('/api/referrals/codes', {
        method: 'POST',
        body: JSON.stringify({ memberId: values.memberId, rewardAmount: values.rewardAmount }),
      });
      setNewCodeOpen(false);
      newCodeForm.resetFields();
      message.success(`Referral code ${created.code} created`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to create referral code'));
    } finally {
      setSaving(false);
    }
  };

  const toggleCode = async (code: ReferralCode) => {
    setActing(`code:${code.id}`);
    try {
      const updated = await api<ReferralCode>(`/api/referrals/codes/${code.id}/toggle`, {
        method: 'POST',
      });
      message.success(`${updated.code} is now ${updated.status}`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to update referral code'));
    } finally {
      setActing(null);
    }
  };

  const createReferral = async () => {
    const values = await recordForm.validateFields();
    setSaving(true);
    try {
      await api<ReferralRecord>('/api/referrals', {
        method: 'POST',
        body: JSON.stringify({
          code: values.code,
          refereeName: values.refereeName,
          refereePhone: cleanPhone(values.refereePhone),
        }),
      });
      setRecordOpen(false);
      recordForm.resetFields();
      message.success('Referral recorded as pending');
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to record referral'));
    } finally {
      setSaving(false);
    }
  };

  const qualify = async (record: ReferralRecord) => {
    if (record.status !== 'Pending') return;
    setActing(`qualify:${record.id}`);
    try {
      await api(`/api/referrals/${record.id}/qualify`, { method: 'POST' });
      message.success(`${record.refereeName} marked as qualified`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to qualify referral'));
    } finally {
      setActing(null);
    }
  };

  const payReward = async (record: ReferralRecord) => {
    if (record.status !== 'Qualified') return;
    if (rewardDisabled) {
      message.warning('Referral rewards are disabled in settings');
      return;
    }
    setActing(`reward:${record.id}`);
    try {
      await api(`/api/referrals/${record.id}/reward`, { method: 'POST' });
      message.success(`Reward paid for ${record.refereeName}`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to pay referral reward'));
    } finally {
      setActing(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    const values = await rejectForm.validateFields();
    setSaving(true);
    try {
      await api(`/api/referrals/${rejectTarget.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: values.note?.trim() || undefined }),
      });
      setRejectTarget(null);
      rejectForm.resetFields();
      message.success(`${rejectTarget.refereeName} referral rejected`);
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to reject referral'));
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    const values = await settingsForm.validateFields();
    setSaving(true);
    try {
      const updated = await api<ReferralSettings>('/api/referrals/settings', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setSettings(updated);
      message.success('Referral programme settings saved');
      await load();
    } catch (e) {
      message.error(friendly(e, 'Unable to save referral settings'));
    } finally {
      setSaving(false);
    }
  };

  const totalRewards = report?.rewardsPaid ?? 0;

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Referral Programme"
        subtitle="Member referral codes, qualification tracking and reward payouts"
        extra={
          <Space wrap>
            <Button icon={<PlusOutlined />} onClick={openNewCode}>
              New Code
            </Button>
            <Button type="primary" icon={<UserAddOutlined />} onClick={openRecord}>
              Record Referral
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Referrals"
            value={report?.totalReferrals ?? 0}
            icon={<TeamOutlined style={{ color: colors.primary }} />}
            caption={`${report?.pending ?? 0} pending review`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Qualified"
            value={report?.qualified ?? 0}
            icon={<CheckCircleOutlined style={{ color: colors.info }} />}
            caption="Awaiting reward payout"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Rewarded"
            value={report?.rewarded ?? 0}
            icon={<TrophyOutlined style={{ color: colors.success }} />}
            caption={`${report?.rejected ?? 0} rejected`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Rewards Paid"
            value={fmtETB(totalRewards)}
            icon={<DollarOutlined style={{ color: colors.accent }} />}
            caption={settings ? `${settings.rewardMode} reward mode` : 'No payouts yet'}
          />
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="codes"
          items={[
            {
              key: 'codes',
              label: 'Referral Codes',
              children: (
                <div>
                  <Space wrap style={{ marginBottom: 12 }}>
                    <Input
                      placeholder="Search code or member"
                      allowClear
                      style={{ width: 260 }}
                      value={codeSearch}
                      onChange={(e) => setCodeSearch(e.target.value)}
                    />
                    <Tag color="blue">{filteredCodes.length} codes</Tag>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openNewCode}>
                      New Code
                    </Button>
                  </Space>
                  <Table<ReferralCode>
                    rowKey="id"
                    loading={loading}
                    dataSource={filteredCodes}
                    locale={{
                      emptyText: <Empty description="No referral codes yet" />,
                    }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    scroll={{ x: 900 }}
                    columns={[
                      {
                        title: 'Code',
                        dataIndex: 'code',
                        width: 150,
                        render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
                      },
                      { title: 'Member', dataIndex: 'memberName', ellipsis: true },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        width: 110,
                        render: (value: ReferralCode['status']) => (
                          <Tag color={value === 'Active' ? 'green' : 'default'}>{value}</Tag>
                        ),
                      },
                      { title: 'Uses', dataIndex: 'uses', width: 80, align: 'center' },
                      {
                        title: 'Reward',
                        dataIndex: 'rewardAmount',
                        width: 120,
                        align: 'right',
                        render: (value: number) => fmtETB(value),
                      },
                      {
                        title: 'Created',
                        dataIndex: 'createdAt',
                        width: 120,
                        render: (value: string) => fmtDate(value),
                      },
                      {
                        title: 'Action',
                        key: 'action',
                        width: 110,
                        render: (_, record) => (
                          <Button
                            size="small"
                            danger={record.status === 'Active'}
                            loading={acting === `code:${record.id}`}
                            onClick={() => toggleCode(record)}
                          >
                            {record.status === 'Active' ? 'Disable' : 'Enable'}
                          </Button>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'referrals',
              label: 'Referrals',
              children: (
                <div>
                  <Space wrap style={{ marginBottom: 12 }}>
                    <Input
                      placeholder="Search code, referrer, referee or phone"
                      allowClear
                      style={{ width: 300 }}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Select
                      placeholder="Status"
                      allowClear
                      style={{ width: 140 }}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={(['Pending', 'Qualified', 'Rewarded', 'Rejected'] as const).map(
                        (status) => ({ label: status, value: status }),
                      )}
                    />
                    <Button type="primary" icon={<UserAddOutlined />} onClick={openRecord}>
                      Record Referral
                    </Button>
                  </Space>
                  <Table<ReferralRecord>
                    rowKey="id"
                    loading={loading}
                    dataSource={filteredRecords}
                    locale={{ emptyText: <Empty description="No referrals found" /> }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    scroll={{ x: 1250 }}
                    columns={[
                      {
                        title: 'Code',
                        dataIndex: 'code',
                        width: 140,
                        render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
                      },
                      { title: 'Referrer', dataIndex: 'referrerName', width: 150, ellipsis: true },
                      { title: 'Referee', dataIndex: 'refereeName', width: 150, ellipsis: true },
                      { title: 'Phone', dataIndex: 'refereePhone', width: 140 },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        width: 110,
                        render: (value: ReferralRecord['status']) => (
                          <Tag color={referralStatusColor[value]}>{value}</Tag>
                        ),
                      },
                      {
                        title: 'Reward',
                        dataIndex: 'rewardAmount',
                        width: 110,
                        align: 'right',
                        render: (value: number) => fmtETB(value),
                      },
                      {
                        title: 'Created',
                        dataIndex: 'createdAt',
                        width: 110,
                        render: (value: string) => fmtDate(value),
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        width: 300,
                        render: (_, record) => {
                          const canQualify = record.status === 'Pending';
                          const canReward = record.status === 'Qualified' && !rewardDisabled;
                          const canReject = record.status === 'Pending' || record.status === 'Qualified';
                          return (
                            <Space size={4} wrap>
                              <Tooltip
                                title={
                                  canQualify
                                    ? 'Mark this referral as qualified'
                                    : 'Only pending referrals can be qualified'
                                }
                              >
                                <span>
                                  <Button
                                    size="small"
                                    icon={<CheckCircleOutlined />}
                                    disabled={!canQualify}
                                    loading={acting === `qualify:${record.id}`}
                                    onClick={() => qualify(record)}
                                  >
                                    Qualify
                                  </Button>
                                </span>
                              </Tooltip>
                              <Tooltip
                                title={
                                  record.status !== 'Qualified'
                                    ? 'Only qualified referrals can be rewarded'
                                    : rewardDisabled
                                      ? 'Referral rewards are disabled in settings'
                                      : 'Pay the referral reward'
                                }
                              >
                                <span>
                                  <Button
                                    size="small"
                                    type="primary"
                                    icon={<DollarOutlined />}
                                    disabled={!canReward}
                                    loading={acting === `reward:${record.id}`}
                                    onClick={() => payReward(record)}
                                  >
                                    Pay Reward
                                  </Button>
                                </span>
                              </Tooltip>
                              <Tooltip
                                title={
                                  canReject
                                    ? 'Reject this referral'
                                    : 'Only pending or qualified referrals can be rejected'
                                }
                              >
                                <span>
                                  <Button
                                    size="small"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    disabled={!canReject}
                                    onClick={() => {
                                      rejectForm.resetFields();
                                      setRejectTarget(record);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </span>
                              </Tooltip>
                            </Space>
                          );
                        },
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'settings',
              label: 'Settings',
              children: (
                <Row gutter={[20, 20]}>
                  <Col xs={24} lg={12}>
                    <Card size="small" title="Programme Settings">
                      <Form form={settingsForm} layout="vertical">
                        <Form.Item
                          label="Programme Enabled"
                          name="enabled"
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="On" unCheckedChildren="Off" />
                        </Form.Item>
                        <Form.Item
                          label="Reward per Referral (ETB)"
                          name="rewardPerReferral"
                          rules={[{ required: true, message: 'Reward amount is required' }]}
                        >
                          <InputNumber style={{ width: '100%' }} min={0} step={50} />
                        </Form.Item>
                        <Form.Item
                          label="Minimum Qualifying Deposit (ETB)"
                          name="minQualifyingDeposit"
                          rules={[{ required: true, message: 'Minimum deposit is required' }]}
                        >
                          <InputNumber style={{ width: '100%' }} min={0} step={100} />
                        </Form.Item>
                        <Form.Item
                          label="Reward Mode"
                          name="rewardMode"
                          rules={[{ required: true, message: 'Reward mode is required' }]}
                        >
                          <Select
                            options={[
                              { label: 'Cash', value: 'Cash' },
                              { label: 'Savings', value: 'Savings' },
                            ]}
                          />
                        </Form.Item>
                        <Button type="primary" loading={saving} onClick={saveSettings}>
                          Save Settings
                        </Button>
                      </Form>
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <Card size="small" title="Conversion Report">
                        <Space size={24} align="center" wrap>
                          <Progress
                            type="circle"
                            size={96}
                            percent={report?.conversionPct ?? 0}
                            strokeColor={colors.primary}
                          />
                          <Space direction="vertical" size={4}>
                            <Typography.Text strong>
                              {report?.qualified ?? 0} qualified · {report?.rewarded ?? 0} rewarded
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {report?.totalReferrals ?? 0} total referrals ·{' '}
                              {report?.conversionPct ?? 0}% conversion
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {fmtETB(totalRewards)} paid out · {report?.pending ?? 0} pending
                            </Typography.Text>
                          </Space>
                        </Space>
                      </Card>
                      <Card size="small" title="Top Referrers">
                        <Table
                          rowKey="memberName"
                          size="small"
                          loading={loading}
                          dataSource={report?.topReferrers ?? []}
                          locale={{ emptyText: <Empty description="No referrers yet" /> }}
                          pagination={false}
                          columns={[
                            { title: 'Member', dataIndex: 'memberName', ellipsis: true },
                            {
                              title: 'Referrals',
                              dataIndex: 'referrals',
                              width: 100,
                              align: 'right',
                            },
                            {
                              title: 'Rewarded',
                              dataIndex: 'rewarded',
                              width: 100,
                              align: 'right',
                            },
                          ]}
                        />
                      </Card>
                    </Space>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="New Referral Code"
        open={newCodeOpen}
        onCancel={() => setNewCodeOpen(false)}
        onOk={createCode}
        okText="Create Code"
        confirmLoading={saving}
      >
        <Form form={newCodeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Member"
            name="memberId"
            rules={[{ required: true, message: 'Select the member who will refer' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select a member"
              options={members.map((m) => {
                const taken = membersWithActiveCode.has(m.id);
                return {
                  label: `${m.fullName} (${m.memberNo})${taken ? ' — active code exists' : ''}`,
                  value: m.id,
                  disabled: taken,
                };
              })}
            />
          </Form.Item>
          <Form.Item label="Reward Amount (ETB)" name="rewardAmount">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={50}
              placeholder={`Default ${fmtETB(settings?.rewardPerReferral ?? 100)}`}
            />
          </Form.Item>
          <Typography.Text type="secondary">
            Each member can hold one active code. Leave the reward blank to use the programme
            default.
          </Typography.Text>
        </Form>
      </Modal>

      <Modal
        title="Record Referral"
        open={recordOpen}
        onCancel={() => setRecordOpen(false)}
        onOk={createReferral}
        okText="Record Referral"
        confirmLoading={saving}
      >
        <Form form={recordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Referral Code"
            name="code"
            rules={[{ required: true, message: 'Select an active referral code' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select an active code"
              options={activeCodes.map((c) => ({
                label: `${c.code} — ${c.memberName}`,
                value: c.code,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Referee Name"
            name="refereeName"
            rules={[{ required: true, message: 'Referee name is required' }]}
          >
            <Input placeholder="Full name of the referred person" />
          </Form.Item>
          <Form.Item
            label="Referee Phone"
            name="refereePhone"
            rules={[
              { required: true, message: 'Referee phone is required' },
              {
                validator: (_, value) => {
                  const phone = cleanPhone(String(value ?? ''));
                  return /^\+251[79]\d{8}$/.test(phone)
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error('Enter a valid Ethiopian mobile (+251 7/9 xxxxxxxx)'),
                      );
                },
              },
            ]}
          >
            <Input placeholder="+251911223344" />
          </Form.Item>
          <Typography.Text type="secondary">
            The referee must not already have been referred, and a member cannot refer themselves.
          </Typography.Text>
        </Form>
      </Modal>

      <Modal
        title="Reject Referral"
        open={rejectTarget !== null}
        onCancel={() => setRejectTarget(null)}
        onOk={reject}
        okText="Reject Referral"
        okButtonProps={{ danger: true }}
        confirmLoading={saving}
      >
        <Typography.Paragraph type="secondary">
          Rejecting the referral for {rejectTarget?.refereeName ?? 'this referee'} removes it from
          the qualification workflow.
        </Typography.Paragraph>
        <Form form={rejectForm} layout="vertical">
          <Form.Item label="Note" name="note">
            <Input.TextArea rows={3} placeholder="Optional reason for rejection" />
          </Form.Item>
        </Form>
      </Modal>
    </ProCard>
  );
}
