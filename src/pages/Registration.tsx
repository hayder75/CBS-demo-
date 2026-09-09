import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { Currency, PaymentMode, SavingsAccount, ShareAccount, ShareRequest, Vault } from '../types';
import { fmtETB } from '../utils/format';

const statusTag = (s: string) => (
  <Tag color={s === 'Active' || s === 'Verified' || s === 'Open' ? 'green' : s === 'Pending' ? 'gold' : 'default'}>{s}</Tag>
);

export default function Registration() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [shares, setShares] = useState<ShareAccount[]>([]);
  const [shareReqs, setShareReqs] = useState<ShareRequest[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setAccounts(await api<SavingsAccount[]>('/api/accounts').catch(() => []));
    setShares(await api<ShareAccount[]>('/api/share-accounts').catch(() => []));
    setShareReqs(await api<ShareRequest[]>('/api/share-accounts/requests').catch(() => []));
    setVaults(await api<Vault[]>('/api/vaults').catch(() => []));
    setPaymentModes(await api<PaymentMode[]>('/api/payment-modes').catch(() => []));
    setCurrencies(await api<Currency[]>('/api/currencies').catch(() => []));
  };

  useEffect(() => { load(); }, []);

  const verify = async (path: string) => { await api(path, { method: 'POST' }); message.success('Verified'); await load(); };

  const submit = async (path: string) => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api(path, { method: 'POST', body: JSON.stringify(values) });
      setOpen(null);
      form.resetFields();
      message.success('Created (Pending — verify to activate)');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const accountCols = [
    { title: 'Account No', dataIndex: 'accountNo' },
    { title: 'Member ID', dataIndex: 'memberId', width: 90 },
    { title: 'Product ID', dataIndex: 'productId', width: 90 },
    { title: 'Type', dataIndex: 'accountType', width: 90 },
    { title: 'Opened', dataIndex: 'openedDate', width: 110 },
    { title: 'Balance', dataIndex: 'balance', align: 'right' as const, render: (v: number) => fmtETB(v) },
    { title: 'Status', dataIndex: 'status', width: 100, render: statusTag },
    {
      title: 'Actions',
      render: (_: unknown, r: SavingsAccount) => (
        <Space>
          {r.status === 'Pending' && <Button size="small" type="primary" onClick={() => verify(`/api/accounts/${r.id}/verify`)}>Verify</Button>}
          {r.status === 'Active' && <Button size="small" onClick={() => verify(`/api/accounts/${r.id}/freeze`)}>Freeze</Button>}
        </Space>
      ),
    },
  ];

  const shareCols = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Member', dataIndex: 'memberId', width: 100 },
    { title: 'Category', dataIndex: 'categoryId', width: 100 },
    { title: 'Shares', dataIndex: 'shareCount', align: 'right' as const },
    { title: 'Status', dataIndex: 'status', width: 100, render: statusTag },
    {
      title: 'Actions',
      render: (_: unknown, r: ShareAccount) =>
        r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => verify(`/api/share-accounts/${r.id}/verify`)}>Verify</Button> : null,
    },
  ];

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Tabs
        items={[
          {
            key: 'accounts',
            label: 'Accounts',
            children: (
              <Card title="Customer Accounts" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('account')}>New Account</Button>}>
                <Table rowKey="id" dataSource={accounts} columns={accountCols} pagination={false} />
              </Card>
            ),
          },
          {
            key: 'shares',
            label: 'Shares',
            children: (
              <>
                <Card title="Member Share Accounts" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('share')}>New Share Account</Button>} style={{ marginBottom: 16 }}>
                  <Table rowKey="id" dataSource={shares} columns={shareCols} pagination={false} />
                </Card>
                <Card title="Share Upgrade / Downgrade Requests">
                  <Table
                    rowKey="id"
                    dataSource={shareReqs}
                    pagination={false}
                    columns={[
                      { title: 'Request', dataIndex: 'shareAccountId', width: 120 },
                      { title: 'Type', dataIndex: 'requestType', width: 110, render: (t: string) => <Tag color={t === 'UPGRADE' ? 'green' : 'orange'}>{t}</Tag> },
                      { title: 'Shares', dataIndex: 'shareCount', align: 'right' as const },
                      { title: 'Status', dataIndex: 'status', width: 100, render: statusTag },
                      {
                        title: 'Actions',
                        render: (_: unknown, r: ShareRequest) =>
                          r.status === 'Pending' ? (
                            <Space>
                              <Button size="small" type="primary" onClick={async () => { await api(`/api/share-accounts/requests/${r.id}/decide?approve=true`, { method: 'POST' }); await load(); }}>Approve</Button>
                              <Button size="small" danger onClick={async () => { await api(`/api/share-accounts/requests/${r.id}/decide?approve=false`, { method: 'POST' }); await load(); }}>Reject</Button>
                            </Space>
                          ) : null,
                      },
                    ]}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'vaults',
            label: 'Vaults',
            children: (
              <Card title="Vaults" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('vault')}>New Vault</Button>}>
                <Table
                  rowKey="id"
                  dataSource={vaults}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 100 },
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Location', dataIndex: 'location' },
                    { title: 'Type', dataIndex: 'type', width: 90, render: (t: string) => <Tag>{t}</Tag> },
                    { title: 'Status', dataIndex: 'status', width: 100, render: statusTag },
                    { title: 'Actions', render: (_: unknown, r: Vault) => r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => verify(`/api/vaults/${r.id}/verify`)}>Verify</Button> : null },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'paymentmodes',
            label: 'Payment Modes',
            children: (
              <Card title="Payment Modes" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('mode')}>New Payment Mode</Button>}>
                <Table
                  rowKey="id"
                  dataSource={paymentModes}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 100 },
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Type', dataIndex: 'paymentType', width: 110, render: (t: string) => <Tag color={t === 'CASH' ? 'gold' : 'blue'}>{t}</Tag> },
                    { title: 'Description', dataIndex: 'description' },
                    { title: 'Status', dataIndex: 'status', width: 100, render: statusTag },
                    { title: 'Actions', render: (_: unknown, r: PaymentMode) => r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => verify(`/api/payment-modes/${r.id}/verify`)}>Verify</Button> : null },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'currencies',
            label: 'Currencies',
            children: (
              <Card title="Currencies" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen('currency')}>New Currency</Button>}>
                <Table
                  rowKey="id"
                  dataSource={currencies}
                  pagination={false}
                  columns={[
                    { title: 'Code', dataIndex: 'code', width: 80 },
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Notes', dataIndex: 'notesLabel', width: 90 },
                    { title: 'Cents', dataIndex: 'centsLabel', width: 90 },
                    { title: 'Rate', dataIndex: 'exchangeRate', align: 'right' as const },
                    { title: 'Status', dataIndex: 'status', width: 100, render: statusTag },
                    { title: 'Actions', render: (_: unknown, r: Currency) => r.status === 'Pending' ? <Button size="small" type="primary" onClick={() => verify(`/api/currencies/${r.id}/verify`)}>Verify</Button> : null },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Account modal */}
      <Modal title="New Savings Account" open={open === 'account'} onCancel={() => setOpen(null)} onOk={() => submit('/api/accounts')} okText="Create Account" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Member ID" name="memberId" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Product (Saving) ID" name="productId" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Account Type" name="accountType" initialValue="Saving"><Select options={['Saving', 'Current', 'Fixed'].map((t) => ({ label: t, value: t }))} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Currency ID" name="currencyId" initialValue={1}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Share modal */}
      <Modal title="New Share Account" open={open === 'share'} onCancel={() => setOpen(null)} onOk={() => submit('/api/share-accounts')} okText="Create Share" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Member ID" name="memberId" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Share Category ID" name="categoryId" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Saving Account ID" name="savingAccountId"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Share Count" name="shareCount" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Vault modal */}
      <Modal title="New Vault" open={open === 'vault'} onCancel={() => setOpen(null)} onOk={() => submit('/api/vaults')} okText="Create Vault" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Location" name="location"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Type" name="type" initialValue="BRANCH"><Select options={[{ label: 'Branch', value: 'BRANCH' }, { label: 'Head Office', value: 'HEAD' }, { label: 'Bank', value: 'BANK' }]} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Payment Mode modal */}
      <Modal title="New Payment Mode" open={open === 'mode'} onCancel={() => setOpen(null)} onOk={() => submit('/api/payment-modes')} okText="Create Mode" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Payment Type" name="paymentType" initialValue="CASH"><Select options={[{ label: 'Cash', value: 'CASH' }, { label: 'Non-Cash', value: 'NON_CASH' }]} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Description" name="description"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Currency modal */}
      <Modal title="New Currency" open={open === 'currency'} onCancel={() => setOpen(null)} onOk={() => submit('/api/currencies')} okText="Create Currency" confirmLoading={saving}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Notes Label" name="notesLabel"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Cents Label" name="centsLabel"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Exchange Rate" name="exchangeRate" initialValue={1}><InputNumber style={{ width: '100%' }} min={0.000001} step={0.01} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </ProCard>
  );
}