import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
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
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { FaydaIdInput, faydaValueFromEvent } from '../components/FaydaIdInput';
import { useMembers } from '../context/MembersContext';
import { api } from '../api/client';
import type { Member } from '../types';
import { fmtETB, fmtDate } from '../utils/format';

const statusColor: Record<Member['status'], string> = {
  Active: 'green',
  Dormant: 'orange',
  Suspended: 'red',
  Deceased: 'default',
  Withdrawn: 'default',
};

export default function Members() {
  const navigate = useNavigate();
  const { members, setMembers, search, setSearch, statusFilter, setStatusFilter } = useMembers();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

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
    navigate(`/members/${m.id}`);
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
              <Form.Item label="Join Date" name="joinDate" rules={[{ required: true }]} initialValue={dayjs()}>
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
              <Form.Item label="Fayda ID Number" name="faydaId" getValueFromEvent={faydaValueFromEvent}>
                <FaydaIdInput style={{ width: '100%' }} />
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