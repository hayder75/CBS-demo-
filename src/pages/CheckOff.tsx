import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Modal, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import { CloudUploadOutlined, DiffOutlined, SwapOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { CheckOffBatch } from '../types';
import { fmtETB } from '../utils/format';

export default function CheckOff() {
  const [batches, setBatches] = useState<CheckOffBatch[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [employer, setEmployer] = useState<string | undefined>();
  const [month, setMonth] = useState<string | undefined>();

  useEffect(() => {
    api<CheckOffBatch[]>('/api/checkoff').then(setBatches);
  }, []);

  const totals = useMemo(
    () => ({
      expected: batches.reduce((s, b) => s + b.expected, 0),
      received: batches.reduce((s, b) => s + b.received, 0),
      variance: batches.reduce((s, b) => s + b.variance, 0),
      unmatched: batches.reduce((s, b) => s + b.unmatched, 0),
    }),
    [batches],
  );

  const upload = async () => {
    const batch = await api<CheckOffBatch>('/api/checkoff/upload', {
      method: 'POST',
      body: JSON.stringify({ employer, month }),
    });
    setBatches((prev) => [batch, ...prev]);
    setUploadOpen(false);
    message.success(`Processed ${batch.rows} rows from ${batch.employer}`);
  };

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Expected Deductions (Aug)</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              <SwapOutlined /> {fmtETB(totals.expected)}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Received</Typography.Text>
            <Typography.Title level={3} style={{ color: '#52c41a', margin: 0 }}>
              {fmtETB(totals.received)}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Variance</Typography.Text>
            <Typography.Title level={3} style={{ color: totals.variance < 0 ? '#f5222d' : '#52c41a', margin: 0 }}>
              <DiffOutlined /> {fmtETB(totals.variance)}
            </Typography.Title>
            <Typography.Text type="secondary">{totals.unmatched} unmatched employee rows</Typography.Text>
          </Card>
        </Col>
      </Row>

      {totals.variance < 0 && (
        <Alert
          type="warning"
          showIcon
          message="Reconciliation variances detected"
          description="2 employers under-remitted relative to expected schedules. Open the batch to see exception detail."
        />
      )}

      <Card
        title="Employer Check-Off Batches"
        extra={
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setUploadOpen(true)}>
            Upload Deduction File
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={batches}
          pagination={false}
          columns={[
            { title: 'Employer', dataIndex: 'employer' },
            { title: 'Month', dataIndex: 'month', width: 100 },
            { title: 'Uploaded', dataIndex: 'uploadedAt', width: 110 },
            { title: 'Rows', dataIndex: 'rows', width: 70, align: 'right' },
            {
              title: 'Matched',
              dataIndex: 'matched',
              width: 90,
              align: 'right',
              render: (v, r) => (
                <Space>
                  {v}
                  {r.unmatched > 0 && <Tag color="orange">{r.unmatched} unmatched</Tag>}
                </Space>
              ),
            },
            { title: 'Expected', dataIndex: 'expected', align: 'right', render: (v) => fmtETB(v) },
            { title: 'Received', dataIndex: 'received', align: 'right', render: (v) => fmtETB(v) },
            {
              title: 'Variance',
              dataIndex: 'variance',
              align: 'right',
              render: (v) => (
                <Typography.Text type={v < 0 ? 'danger' : v > 0 ? 'warning' : 'success'}>
                  {fmtETB(v)}
                </Typography.Text>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (s) => (
                <Tag color={s === 'Reconciled' ? 'green' : s === 'Variance' ? 'orange' : 'default'}>{s}</Tag>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Allocation Priority">
        <Typography.Paragraph type="secondary">
          Received check-off amounts are automatically distributed per configured priority:
        </Typography.Paragraph>
        <Space wrap>
          <Tag color="blue">1. Loan interest arrears</Tag>
          <Tag color="blue">2. Loan principal</Tag>
          <Tag color="blue">3. Mandatory savings</Tag>
          <Tag color="blue">4. Shares</Tag>
          <Tag color="blue">5. Penalties</Tag>
        </Space>
      </Card>

      <Modal
        title="Upload Employer Deduction File"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onOk={upload}
        okText="Process File"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Typography.Text type="secondary">
            In the full build, this accepts the employer's Excel/CSV payroll deduction file and
            auto-matches employees to member IDs. Demo simulates a clean upload.
          </Typography.Text>
          <Select
            placeholder="Employer"
            style={{ width: '100%' }}
            value={employer}
            onChange={setEmployer}
            options={['Ethiopian Airlines', 'Commercial Bank of Ethiopia', 'Ethio Telecom', 'Ministry of Education', 'Addis Ababa University'].map((e) => ({ label: e, value: e }))}
          />
          <Select
            placeholder="Deduction month"
            style={{ width: '100%' }}
            value={month}
            onChange={setMonth}
            options={['Aug 2026', 'Sep 2026'].map((m) => ({ label: m, value: m }))}
          />
        </Space>
      </Modal>
    </ProCard>
  );
}