import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
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
import { BankOutlined, DollarOutlined, PlusOutlined, WalletOutlined, WarningOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { CurrencyInput } from '../components/CurrencyInput';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { api } from '../api/client';
import type { CashMovement, PettyCashEntry, Till } from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

export default function CashOps() {
  const [tills, setTills] = useState<Till[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCashEntry[]>([]);
  const [movementOpen, setMovementOpen] = useState(false);
  const [pettyOpen, setPettyOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [movementForm] = Form.useForm();
  const [pettyForm] = Form.useForm();

  const load = async () => {
    const [t, m, p] = await Promise.all([
      api<Till[]>('/api/cashops/tills'),
      api<CashMovement[]>('/api/cashops/movements'),
      api<PettyCashEntry[]>('/api/cashops/pettycash'),
    ]);
    setTills(t);
    setMovements(m);
    setPettyCash(p);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const totalTill = tills.reduce((s, t) => s + t.closing, 0);
  const totalDiscrepancy = tills.reduce((s, t) => s + Math.abs(t.variance), 0);
  const pettyTotal = pettyCash.filter((p) => p.status === 'Open').reduce((s, p) => s + p.amount, 0);

  const createMovement = async () => {
    const values = await movementForm.validateFields();
    setSaving(true);
    try {
      await api('/api/cashops/movements', { method: 'POST', body: JSON.stringify(values) });
      setMovementOpen(false);
      movementForm.resetFields();
      message.success('Movement request created — pending manager approval');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const createPetty = async () => {
    const values = await pettyForm.validateFields();
    setSaving(true);
    try {
      await api('/api/cashops/pettycash', { method: 'POST', body: JSON.stringify(values) });
      setPettyOpen(false);
      pettyForm.resetFields();
      message.success('Petty cash entry recorded');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Cash Operations"
        subtitle="Teller tills, vault position and cash movements"
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setPettyOpen(true)}>
              New Petty Cash Entry
            </Button>
            <Button type="primary" icon={<BankOutlined />} onClick={() => setMovementOpen(true)}>
              New Cash Movement
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Teller Closing Balances"
            value={fmtETB(totalTill)}
            icon={<WalletOutlined style={{ color: colors.primary }} />}
            caption="Across all tills"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Vault Position"
            value={fmtETB(924000)}
            icon={<BankOutlined style={{ color: colors.info }} />}
            caption="Head office vault"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Open Petty Cash"
            value={fmtETB(pettyTotal)}
            icon={<DollarOutlined style={{ color: colors.accent }} />}
            caption="Awaiting reimbursement"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Teller Discrepancies"
            value={fmtETB(totalDiscrepancy)}
            icon={<WarningOutlined style={{ color: totalDiscrepancy > 0 ? colors.danger : colors.success }} />}
            caption="Absolute variance"
          />
        </Col>
      </Row>

      <Card title="Teller Tills">
        <Table
          rowKey="id"
          dataSource={tills}
          pagination={false}
          columns={[
            { title: 'Teller', dataIndex: 'teller', ellipsis: true },
            { title: 'Opening', dataIndex: 'opening', align: 'right', render: (v) => fmtETB(v) },
            { title: 'Deposits', dataIndex: 'deposits', align: 'right', render: (v) => fmtETB(v) },
            { title: 'Withdrawals', dataIndex: 'withdrawals', align: 'right', render: (v) => fmtETB(v) },
            { title: 'Closing', dataIndex: 'closing', align: 'right', render: (v) => <strong>{fmtETB(v)}</strong> },
            { title: 'Expected', dataIndex: 'expected', align: 'right', render: (v) => fmtETB(v) },
            {
              title: 'Variance',
              dataIndex: 'variance',
              align: 'right',
              render: (v) => <Typography.Text type={v === 0 ? 'success' : 'danger'}>{fmtETB(v)}</Typography.Text>,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (s) => (
                <Tag color={s === 'Balanced' ? 'green' : s === 'Discrepancy' ? 'red' : 'default'}>{s}</Tag>
              ),
            },
          ]}
        />
      </Card>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Card title="Cash Movements">
            <Table
              rowKey="id"
              dataSource={movements}
              pagination={false}
              columns={[
                { title: 'Date', dataIndex: 'date', width: 100 },
                { title: 'Type', dataIndex: 'type', ellipsis: true },
                { title: 'From', dataIndex: 'from', ellipsis: true },
                { title: 'To', dataIndex: 'to', ellipsis: true },
                { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => fmtETB(v) },
                { title: 'Initiated', dataIndex: 'initiatedBy', width: 120 },
                {
                  title: 'Approval',
                  dataIndex: 'status',
                  render: (s) => (
                    <Tag color={s === 'Approved' ? 'green' : s === 'Pending' ? 'gold' : 'red'}>{s}</Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Petty Cash">
            <Table
              rowKey="id"
              dataSource={pettyCash}
              pagination={false}
              size="small"
              columns={[
                { title: 'Date', dataIndex: 'date', width: 100 },
                { title: 'Description', dataIndex: 'description', ellipsis: true },
                { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => fmtETB(v) },
                {
                  title: '',
                  dataIndex: 'status',
                  render: (s) => <Tag color={s === 'Reimbursed' ? 'green' : 'default'}>{s}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="New Cash Movement"
        open={movementOpen}
        onCancel={() => setMovementOpen(false)}
        onOk={createMovement}
        okText="Submit for Approval"
        confirmLoading={saving}
      >
        <Form form={movementForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Movement Type" name="type" rules={[{ required: true }]}>
            <Select
              options={['Vault to Teller', 'Teller to Vault', 'Vault to Bank', 'Petty Cash Replenish'].map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="From" name="from" initialValue="Vault">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="To" name="to" initialValue="Teller">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Amount (ETB)" name="amount" rules={[{ required: true, message: 'Amount required' }]}>
            <CurrencyInput style={{ width: '100%' }} min={1} step={1000} />
          </Form.Item>
          <Typography.Text type="secondary">
            Vault-to-teller, teller-to-vault, and vault-to-bank transfers require manager (maker-checker)
            approval before cash moves (§13).
          </Typography.Text>
        </Form>
      </Modal>

      <Modal
        title="New Petty Cash Entry"
        open={pettyOpen}
        onCancel={() => setPettyOpen(false)}
        onOk={createPetty}
        okText="Record Entry"
        confirmLoading={saving}
      >
        <Form form={pettyForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}>
            <Input placeholder="e.g. Office stationery" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Category" name="category" initialValue="Office Supplies">
                <Select
                  options={['Office Supplies', 'Fuel', 'Hospitality', 'Transport', 'Repairs'].map((c) => ({ label: c, value: c }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Amount (ETB)" name="amount" rules={[{ required: true, message: 'Amount required' }]}>
                <CurrencyInput style={{ width: '100%' }} min={1} step={10} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Receipt No." name="receiptNo">
            <Input placeholder="RC-xxxx" />
          </Form.Item>
        </Form>
      </Modal>
    </ProCard>
  );
}