import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
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
import {
  EnvironmentOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { Member, SavingsTransaction } from '../types';
import { fmtETB, fmtDate } from '../utils/format';

const statusColor: Record<Member['status'], string> = {
  Active: 'green',
  Dormant: 'orange',
  Suspended: 'red',
  Deceased: 'default',
  Withdrawn: 'default',
};

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selected, setSelected] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api<Member[]>('/api/members').then(setMembers);
  }, []);

  const createMember = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const created = await api<Member>('/api/members', {
        method: 'POST',
        body: JSON.stringify({ ...values, birthDate: values.birthDate?.format('YYYY-MM-DD'), joinDate: values.joinDate?.format('YYYY-MM-DD') }),
      });
      setMembers((prev) => [created, ...prev]);
      setCreateOpen(false);
      form.resetFields();
      message.success(`Member ${created.fullName} registered as ${created.memberNo}`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(
    () =>
      members.filter(
        (m) =>
          (!search ||
            m.fullName.toLowerCase().includes(search.toLowerCase()) ||
            m.memberNo.toLowerCase().includes(search.toLowerCase()) ||
            m.faydaId.toLowerCase().includes(search.toLowerCase())) &&
          (!statusFilter || m.status === statusFilter),
      ),
    [members, search, statusFilter],
  );

  const openProfile = (m: Member) => {
    setSelected(m);
    setTxLoading(true);
    api<SavingsTransaction[]>(`/api/savings/transactions/${m.id}`)
      .then(setTransactions)
      .finally(() => setTxLoading(false));
  };

  const summary = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.status === 'Active').length,
      dormant: members.filter((m) => m.status === 'Dormant').length,
      suspended: members.filter((m) => m.status === 'Suspended').length,
      shares: members.reduce((s, m) => s + m.shareBalance, 0),
      savings: members.reduce((s, m) => s + m.savingsBalance, 0),
    }),
    [members],
  );

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Row gutter={16}>
        <Col span={24}>
          <Card>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space>
                  <Typography.Text strong>Members</Typography.Text>
                  <Tag>{summary.total} total</Tag>
                  <Tag color="green">{summary.active} active</Tag>
                  <Tag color="orange">{summary.dormant} dormant</Tag>
                  <Tag color="red">{summary.suspended} suspended</Tag>
                  <Tag color="blue">{fmtETB(summary.shares)} shares</Tag>
                  <Tag color="cyan">{fmtETB(summary.savings)} savings</Tag>
                </Space>
              </Col>
              <Col>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                  New Member
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card
        title="Member Registry"
        extra={
          <Space>
            <Input
              placeholder="Search name, member no, or Fayda ID"
              allowClear
              prefix={<UserOutlined />}
              style={{ width: 280 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={['Active', 'Dormant', 'Suspended', 'Deceased', 'Withdrawn'].map((s) => ({
                label: s,
                value: s,
              }))}
            />
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={filtered}
          onRow={(r) => ({ onClick: () => openProfile(r), style: { cursor: 'pointer' } })}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: 'Member',
              dataIndex: 'fullName',
              render: (v, r) => (
                <Space>
                  <Avatar style={{ background: r.photoColor }} icon={<UserOutlined />} />
                  <div>
                    <Typography.Text strong>{v}</Typography.Text>
                    <div style={{ fontSize: 11, color: '#999' }}>{r.memberNo}</div>
                  </div>
                </Space>
              ),
            },
            { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={statusColor[s as Member["status"]]}>{String(s)}</Tag> },
            { title: 'Fayda ID', dataIndex: 'faydaId' },
            { title: 'Occupation', dataIndex: 'occupation' },
            { title: 'Employer', dataIndex: 'employer', ellipsis: true },
            { title: 'Joined', dataIndex: 'joinDate', render: fmtDate },
            {
              title: 'Shares',
              dataIndex: 'shareBalance',
              align: 'right',
              render: (v) => fmtETB(v),
            },
            {
              title: 'Savings',
              dataIndex: 'savingsBalance',
              align: 'right',
              render: (v) => fmtETB(v),
            },
            {
              title: 'Loan O/S',
              dataIndex: 'loanOutstanding',
              align: 'right',
              render: (v) => (v ? <Typography.Text strong type="danger">{fmtETB(v)}</Typography.Text> : '—'),
            },
          ]}
        />
      </Card>

      <Drawer
        title={
          selected && (
            <Space>
              <Avatar style={{ background: selected.photoColor }} icon={<UserOutlined />} />
              <span>{selected.fullName}</span>
              <Tag color={statusColor[selected.status]}>{selected.status}</Tag>
            </Space>
          )
        }
        width={640}
        open={!!selected}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <Tabs
            items={[
              {
                key: 'profile',
                label: 'Profile',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Member No">{selected.memberNo}</Descriptions.Item>
                    <Descriptions.Item label="Gender">{selected.gender}</Descriptions.Item>
                    <Descriptions.Item label="Birth Date">{fmtDate(selected.birthDate)}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{selected.phone}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selected.email || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Fayda ID">{selected.faydaId}</Descriptions.Item>
                    <Descriptions.Item label="Kebele">{selected.kebele}</Descriptions.Item>
                    <Descriptions.Item label="Woreda">{selected.woreda}</Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      <Space>
                        <EnvironmentOutlined /> {selected.city}, {selected.kebele}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Occupation">{selected.occupation}</Descriptions.Item>
                    <Descriptions.Item label="Employer">{selected.employer || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Share Balance">{fmtETB(selected.shareBalance)}</Descriptions.Item>
                    <Descriptions.Item label="Savings Balance">{fmtETB(selected.savingsBalance)}</Descriptions.Item>
                    <Descriptions.Item label="Loan Outstanding">
                      {selected.loanOutstanding ? fmtETB(selected.loanOutstanding) : '—'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'nok',
                label: 'Next of Kin & Beneficiaries',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Typography.Text strong>Next of Kin</Typography.Text>
                    {selected.nextOfKin.map((n, i) => (
                      <Card size="small" key={i}>
                        <Descriptions column={3} size="small">
                          <Descriptions.Item label="Name">{n.name}</Descriptions.Item>
                          <Descriptions.Item label="Relation">{n.relation}</Descriptions.Item>
                          <Descriptions.Item label="Phone">{n.phone}</Descriptions.Item>
                        </Descriptions>
                      </Card>
                    ))}
                    <Typography.Text strong>Beneficiaries</Typography.Text>
                    {selected.beneficiaries.map((b, i) => (
                      <Card size="small" key={i}>
                        <Descriptions column={3} size="small">
                          <Descriptions.Item label="Name">{b.name}</Descriptions.Item>
                          <Descriptions.Item label="Relation">{b.relation}</Descriptions.Item>
                          <Descriptions.Item label="Allocation">{b.percent}%</Descriptions.Item>
                        </Descriptions>
                      </Card>
                    ))}
                  </Space>
                ),
              },
              {
                key: 'statement',
                label: 'Statement',
                children: (
                  <Table
                    size="small"
                    loading={txLoading}
                    rowKey="id"
                    dataSource={transactions}
                    pagination={false}
                    columns={[
                      { title: 'Date', dataIndex: 'date' },
                      { title: 'Product', dataIndex: 'productId', render: (v) => String(v).toUpperCase().replace('SP', 'S-') },
                      { title: 'Type', dataIndex: 'type' },
                      { title: 'Channel', dataIndex: 'channel' },
                      { title: 'Teller', dataIndex: 'teller' },
                      { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => fmtETB(v) },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>

      <Modal
        title="Register New Member"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={createMember}
        okText="Register Member"
        confirmLoading={saving}
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Full name required' }]}>
                <Input placeholder="e.g. Almaz Tesfaye" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Gender" name="gender" rules={[{ required: true }]} initialValue="M">
                <Select options={[{ label: 'Male', value: 'M' }, { label: 'Female', value: 'F' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Birth Date" name="birthDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Join Date" name="joinDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+251 9x xxx xxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="name@email.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Fayda ID" name="faydaId">
                <Input placeholder="FAY-..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kebele" name="kebele">
                <Input placeholder="e.g. Bole 01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Woreda" name="woreda">
                <Input placeholder="e.g. Woreda 3" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="City" name="city" initialValue="Addis Ababa">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Occupation" name="occupation">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Employer" name="employer">
                <Input placeholder="e.g. Ethio Telecom" />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            Registering a member sets an Active status with zero balances; shares and savings are
            posted through their own workflows.
          </Typography.Text>
        </Form>
      </Modal>
    </ProCard>
  );
}