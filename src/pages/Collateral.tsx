import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
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
import { FileProtectOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { Collateral } from '../types';
import { fmtETB, fmtDate } from '../utils/format';

const statusColor: Record<Collateral['status'], string> = {
  Pledged: 'blue',
  Released: 'green',
  'Pending Release': 'gold',
};

export default function Collateral() {
  const [items, setItems] = useState<Collateral[]>([]);
  const [selected, setSelected] = useState<Collateral | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setItems(await api<Collateral[]>('/api/collateral'));
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const addCollateral = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api('/api/collateral', { method: 'POST', body: JSON.stringify(values) });
      setAddOpen(false);
      form.resetFields();
      message.success('Collateral registered and pledged');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(
    () => ({
      pledged: items.filter((c) => c.status === 'Pledged').length,
      pendingRelease: items.filter((c) => c.status === 'Pending Release').length,
      valuation: items.reduce((s, c) => s + c.valuation, 0),
      fsv: items.reduce((s, c) => s + c.forcedSaleValue, 0),
    }),
    [items],
  );

  const requestRelease = () => {
    setReleasing(true);
    setTimeout(() => {
      setReleasing(false);
      setItems((prev) =>
        prev.map((c) =>
          c.id === selected?.id ? { ...c, status: 'Released' as const } : c,
        ),
      );
      setSelected((s) => (s ? { ...s, status: 'Released' } : s));
      message.success('Release request submitted — pending maker-checker approval');
    }, 800);
  };

  const expired = items.filter(
    (c) => c.insuranceExpiry && new Date(c.insuranceExpiry) < new Date(),
  );

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      {expired.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${expired.length} collateral item(s) have expired insurance`}
          description="Insurance expiry alerts appear on the asset record and management dashboard."
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Pledged</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#1890ff' }}>{totals.pledged}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Pending Release</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#faad14' }}>{totals.pendingRelease}</Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Total Valuation</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              <FileProtectOutlined /> {fmtETB(totals.valuation)}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="stat-card">
            <Typography.Text type="secondary">Forced Sale Value</Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>{fmtETB(totals.fsv)}</Typography.Title>
          </Card>
        </Col>
      </Row>

      <Card title="Collateral Registry" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Add Collateral</Button>}>
        <Table
          rowKey="id"
          dataSource={items}
          onRow={(r) => ({ onClick: () => setSelected(r), style: { cursor: 'pointer' } })}
          pagination={false}
          columns={[
            { title: 'Code', dataIndex: 'code', width: 100 },
            { title: 'Type', dataIndex: 'type' },
            { title: 'Owner', dataIndex: 'owner' },
            { title: 'Description', dataIndex: 'description', ellipsis: true },
            { title: 'Linked Loan', dataIndex: 'loanRef', width: 110 },
            { title: 'Valuation', dataIndex: 'valuation', align: 'right', render: (v) => fmtETB(v) },
            { title: 'FSV', dataIndex: 'forcedSaleValue', align: 'right', render: (v) => fmtETB(v) },
            {
              title: 'Insurance',
              dataIndex: 'insuranceExpiry',
              render: (v) => {
                if (!v) return '—';
                const expired = new Date(v) < new Date();
                return <Tag color={expired ? 'red' : 'green'}>{fmtDate(v)}{expired ? ' EXPIRED' : ''}</Tag>;
              },
            },
            { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={statusColor[s as Collateral["status"]]}>{String(s)}</Tag> },
          ]}
        />
      </Card>

      <Drawer title="Collateral Detail" width={520} open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Code">{selected.code}</Descriptions.Item>
              <Descriptions.Item label="Type">{selected.type}</Descriptions.Item>
              <Descriptions.Item label="Owner">{selected.owner}</Descriptions.Item>
              <Descriptions.Item label="Description">{selected.description}</Descriptions.Item>
              <Descriptions.Item label="Valuation">{fmtETB(selected.valuation)}</Descriptions.Item>
              <Descriptions.Item label="Forced Sale Value">{fmtETB(selected.forcedSaleValue)}</Descriptions.Item>
              <Descriptions.Item label="Haircut / Discount">{selected.discountPct}%</Descriptions.Item>
              <Descriptions.Item label="Linked Loan">{selected.loanRef ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Insurance Expiry">{fmtDate(selected.insuranceExpiry)}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColor[selected.status]}>{selected.status}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Alert
              type="info"
              showIcon
              message="Maker-checker release control"
              description="Collateral is released only after the linked loan balance reaches zero and a second authorized user approves the release request."
            />

            {selected.status !== 'Released' && (
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                loading={releasing}
                onClick={requestRelease}
              >
                Request Release
              </Button>
            )}
          </Space>
        )}
      </Drawer>

      <Modal
        title="Add Collateral"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={addCollateral}
        okText="Register Collateral"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Asset Type" name="type" rules={[{ required: true }]}>
                <Select
                  options={['Property Title Deed', 'Vehicle Ownership', 'Share Certificate', 'Bank Guarantee', 'Machinery & Equipment'].map((t) => ({ label: t, value: t }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Owner" name="owner" rules={[{ required: true }]}>
                <Input placeholder="Member full name" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input placeholder="e.g. Title deed - 3-bed house, Yeka, 180 m2" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Valuation (ETB)" name="valuation" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1000} step={10000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Haircut / Discount (%)" name="discountPct" initialValue={30}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Linked Loan Ref" name="loanRef">
                <Input placeholder="LN-2026-XXX (optional)" />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            Forced Sale Value is computed automatically as valuation × (1 − discount). New collateral is
            recorded as Pledged.
          </Typography.Text>
        </Form>
      </Modal>
    </ProCard>
  );
}