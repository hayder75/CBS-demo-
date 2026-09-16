import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Space, Table, Tag, Typography, message } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { ApprovalItem } from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

export default function Approvals() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    api<ApprovalItem[]>('/api/approvals').then(setItems);
  }, []);

  const decide = async (id: string, approve: boolean) => {
    setAction(id);
    await api(`/api/approvals/${id}/${approve ? 'approve' : 'reject'}`, { method: 'POST' });
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: approve ? 'Approved' : 'Rejected' } : i)),
    );
    setAction(null);
    message.success(approve ? 'Approved' : 'Rejected');
  };

  const pending = items.filter((i) => i.status === 'Pending');
  const approved = items.filter((i) => i.status === 'Approved').length;
  const rejected = items.filter((i) => i.status === 'Rejected').length;
  const pendingValue = pending.reduce((s, i) => s + i.amount, 0);

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Approvals"
        subtitle="Maker-checker queue for restricted disbursements and financial adjustments"
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Requests"
            value={items.length}
            icon={<SafetyCertificateOutlined style={{ color: colors.primary }} />}
            caption="All approval items"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Pending"
            value={pending.length}
            icon={<ClockCircleOutlined style={{ color: colors.accent }} />}
            delta={pending.length ? 2.4 : undefined}
            caption={`${fmtETB(pendingValue)} awaiting action`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Approved"
            value={approved}
            icon={<CheckCircleOutlined style={{ color: colors.success }} />}
            caption="Cleared by checker"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Rejected"
            value={rejected}
            icon={<CloseCircleOutlined style={{ color: colors.danger }} />}
            caption="Returned to initiator"
          />
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        message="Maker-checker principle"
        description="No single operator can initiate and approve restricted disbursements or financial adjustments. Approve only items you have verified."
      />

      <Card title="Approval Queue">
        <Table
          rowKey="id"
          dataSource={items}
          pagination={false}
          columns={[
            { title: 'Type', dataIndex: 'type', width: 150 },
            { title: 'Ref', dataIndex: 'ref', width: 120 },
            { title: 'Summary', dataIndex: 'summary', ellipsis: true },
            { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => fmtETB(v) },
            { title: 'Initiated by', dataIndex: 'initiatedBy', width: 130 },
            { title: 'Requested', dataIndex: 'requestedAt', width: 150, render: (v) => new Date(v).toLocaleString() },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 110,
              render: (s) => (
                <Tag color={s === 'Approved' ? 'green' : s === 'Rejected' ? 'red' : 'gold'}>{s}</Tag>
              ),
            },
            {
              title: 'Action',
              width: 170,
              render: (_, r) =>
                r.status === 'Pending' ? (
                  <Space>
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={action === r.id}
                      onClick={() => decide(r.id, true)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={action === r.id}
                      onClick={() => decide(r.id, false)}
                    >
                      Reject
                    </Button>
                  </Space>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                ),
            },
          ]}
        />
      </Card>
    </ProCard>
  );
}