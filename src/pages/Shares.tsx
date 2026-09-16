import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { FundOutlined, PercentageOutlined, SwapOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { CurrencyInput } from '../components/CurrencyInput';
import { api } from '../api/client';
import type { DividendRun, Member, ShareTransfer } from '../types';
import { fmtETB, fmtNum } from '../utils/format';

export default function Shares() {
  const [transfers, setTransfers] = useState<ShareTransfer[]>([]);
  const [dividends, setDividends] = useState<DividendRun[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const [t, d, m] = await Promise.all([
      api<ShareTransfer[]>('/api/shares/transfers'),
      api<DividendRun[]>('/api/shares/dividends'),
      api<Member[]>('/api/members'),
    ]);
    setTransfers(t);
    setDividends(d);
    setMembers(m);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const current = dividends.find((d) => d.year === '2026');

  const submitTransfer = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api('/api/shares/transfers', { method: 'POST', body: JSON.stringify(values) });
      setTransferOpen(false);
      form.resetFields();
      message.success('Transfer request created — pending approval');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Share Capital">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Total Members">{fmtNum(members.length || 1428)}</Descriptions.Item>
              <Descriptions.Item label="Min. Qualifying Shares">200</Descriptions.Item>
              <Descriptions.Item label="Share Par Value">{fmtETB(100)}</Descriptions.Item>
              <Descriptions.Item label="Nominal Share Capital">{fmtETB(4820000)}</Descriptions.Item>
            </Descriptions>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
              Weighted-duration method prevents late share purchases from earning a full-year dividend.
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Pending Share Transfers">
            <Table
              size="small"
              rowKey="id"
              dataSource={transfers.filter((t) => t.status === 'Pending')}
              pagination={false}
              columns={[
                { title: 'From', dataIndex: 'fromMember' },
                { title: 'To', dataIndex: 'toMember' },
                { title: 'Shares', dataIndex: 'shares', align: 'right' },
                { title: 'Value', dataIndex: 'value', align: 'right', render: (v) => fmtETB(v) },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Dividend History"
        extra={
          <Button type="primary" icon={<PercentageOutlined />} onClick={() => setTransferOpen(true)}>
            Share Transfer
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={dividends}
          pagination={false}
          columns={[
            { title: 'Year', dataIndex: 'year', width: 80 },
            { title: 'Surplus', dataIndex: 'totalSurplus', align: 'right', render: (v) => (v ? fmtETB(v) : '—') },
            { title: 'Statutory Reserve', dataIndex: 'statutoryReserve', align: 'right', render: (v) => (v ? fmtETB(v) : '—') },
            { title: 'Distributable', dataIndex: 'distributable', align: 'right', render: (v) => (v ? fmtETB(v) : '—') },
            { title: 'Dividend/Share', dataIndex: 'dividendPerShare', align: 'right', render: (v) => (v ? `${v} ETB` : '—') },
            { title: 'Eligible Members', dataIndex: 'eligibleMembers', align: 'right', render: (v) => (v ? v : '—') },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (s) => (
                <Tag color={s === 'Credited' ? 'green' : s === 'Approved' ? 'blue' : 'default'}>{s}</Tag>
              ),
            },
          ]}
        />
      </Card>

      <Card title={`Dividend Run — ${current?.year ?? ''}`}>
        <Space direction="vertical" size={12}>
          <Typography.Text>
            <FundOutlined /> Dividend recommendation for financial year 2026 will be computed after
            year-end closing using approved shareholding methodology. Statutory reserve deduction is
            applied before distribution (§9).
          </Typography.Text>
          <Space>
            <Tag color="purple">Last declared: {current?.dividendPerShare ?? '—'} ETB/share</Tag>
            <Tag color="blue">Weighted-duration method</Tag>
            <Tag>Bulk crediting to withdrawable accounts</Tag>
            <Tag>Recapitalization option</Tag>
          </Space>
        </Space>
      </Card>

      <Modal
        title="Internal Share Transfer"
        open={transferOpen}
        onCancel={() => setTransferOpen(false)}
        onOk={submitTransfer}
        okText="Submit Transfer"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="From Member" name="fromMember" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Transferring member"
              options={members.map((m) => ({ label: `${m.fullName} (${m.memberNo})`, value: m.fullName }))}
            />
          </Form.Item>
          <Form.Item label="To Member" name="toMember" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Receiving member"
              options={members.map((m) => ({ label: `${m.fullName} (${m.memberNo})`, value: m.fullName }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Shares" name="shares" rules={[{ required: true, message: 'Shares required' }]}>
                <InputNumber style={{ width: '100%' }} min={1} step={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Value (ETB)" name="value">
                <CurrencyInput style={{ width: '100%' }} min={0} step={1000} />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            <SwapOutlined /> For eligible retiring / relocating members. Transfers require membership
            eligibility checks and approval before the share ledger is updated.
          </Typography.Text>
        </Form>
      </Modal>
    </ProCard>
  );
}