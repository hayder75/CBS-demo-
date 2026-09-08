import { useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Table, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { ApprovalItem } from '../types';
import { fmtETB } from '../utils/format';

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

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Alert
        type="info"
        showIcon
        message="Maker-checker principle"
        description="No single operator can initiate and approve restricted disbursements or financial adjustments. Approve only items you have verified."
      />

      <Card
        title={
          <Space>
            <SafetyCertificateOutlined /> Approval Queue
            <Tag color="volcano">{pending.length} pending</Tag>
          </Space>
        }
      >
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