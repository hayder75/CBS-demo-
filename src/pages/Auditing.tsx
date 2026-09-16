import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  DollarOutlined,
  FileSearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { Member, SavingsTransaction } from '../types';
import { fmtETB } from '../utils/format';

const auditTag = (s: string) => (
  <Tag color={s === 'Audited' ? 'green' : s === 'Discrepant' ? 'red' : 'gold'}>{s}</Tag>
);

export default function Auditing() {
  const [txns, setTxns] = useState<SavingsTransaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState('Unaudited');
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    api<Member[]>('/api/members').then(setMembers).catch(() => {});
  }, []);

  const memberOf = (v: string) =>
    members.find((m) => String(m.id) === String(v))?.fullName ?? String(v);

  const load = async (status: string) => {
    setTxns(await api<SavingsTransaction[]>(`/api/audit/transactions?status=${status}`).catch(() => []));
  };

  useEffect(() => { load(tab); }, [tab]);

  const act = async (id: string, kind: string, extra?: Record<string, unknown>) => {
    await api(`/api/audit/transactions/${id}/${kind}`, { method: 'POST', body: JSON.stringify(extra ?? {}) });
    message.success('Updated');
    await load(tab);
  };

  const cols = [
    { title: 'Date', dataIndex: 'date', width: 110 },
    { title: 'Member', dataIndex: 'memberId', width: 130, render: memberOf },
    { title: 'Type', dataIndex: 'type', width: 130 },
    { title: 'Amount', dataIndex: 'amount', align: 'right' as const, render: (v: number) => fmtETB(v) },
    { title: 'Teller', dataIndex: 'teller', width: 130 },
    { title: 'Audit Status', dataIndex: 'auditedStatus', width: 120, render: auditTag },
    { title: 'Note', dataIndex: 'auditNote', ellipsis: true },
    {
      title: 'Actions',
      width: 280,
      render: (_: unknown, r: SavingsTransaction) => {
        const st = r.auditedStatus;
        return (
          <Space>
            {st === 'Unaudited' && (
              <>
                <Button size="small" type="primary" onClick={() => act(r.id, 'exact')}>Set Exact</Button>
                <Button size="small" danger onClick={() => act(r.id, 'discrepant')}>Discrepant</Button>
              </>
            )}
            {st === 'Discrepant' && (
              <>
                <Button size="small" type="primary" onClick={() => act(r.id, 'exact')}>Set Exact</Button>
                <Button size="small" onClick={() => act(r.id, 'unaudit')}>UnAudit</Button>
                <Button size="small" onClick={() => setNoteOpen(r.id)}>Note</Button>
              </>
            )}
            {st === 'Audited' && (
              <Button size="small" onClick={() => act(r.id, 'unaudit')}>UnAudit</Button>
            )}
          </Space>
        );
      },
    },
  ];

  const viewTotal = txns.reduce((s, t) => s + t.amount, 0);
  const discrepant = txns.filter((t) => t.auditedStatus === 'Discrepant').length;
  const audited = txns.filter((t) => t.auditedStatus === 'Audited').length;

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Auditing"
        subtitle="Maker transaction verification and discrepancy follow-up"
        extra={
          <Space>
            <Button icon={<FileSearchOutlined />}>Export Register</Button>
            <Button type="primary" onClick={() => load(tab)}>
              Refresh
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Records in View"
            value={txns.length}
            icon={<FileSearchOutlined style={{ color: '#0e7a5f' }} />}
            caption={tab}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Value in View"
            value={fmtETB(viewTotal)}
            icon={<DollarOutlined style={{ color: '#2e90fa' }} />}
            caption="Transactions under review"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Audited"
            value={audited}
            icon={<CheckCircleOutlined style={{ color: '#12b76a' }} />}
            delta={2.6}
            caption="Marked as exact match"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Discrepant"
            value={discrepant}
            icon={<WarningOutlined style={{ color: '#f04438' }} />}
            caption="Require follow-up notes"
          />
        </Col>
      </Row>

      <Card title="Auditing / Verification">
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k)}
          items={['Unaudited', 'Audited', 'Discrepant'].map((s) => ({
            key: s,
            label: s,
            children: (
              <Table
                rowKey="id"
                dataSource={txns}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                columns={cols}
              />
            ),
          }))}
        />
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
          Auditors review maker transactions: classify each as <b>Exact Match</b> or <b>Discrepant</b> with a
          reason, consistent with the Unaudited / Audited / Discrepant workflow.
        </Typography.Paragraph>
      </Card>

      <Modal
        title="Add Audit Note"
        open={!!noteOpen}
        onCancel={() => setNoteOpen(null)}
        onOk={async () => {
          if (noteOpen) { await api(`/api/audit/transactions/${noteOpen}/note`, { method: 'POST', body: JSON.stringify({ note }) }); setNote(''); setNoteOpen(null); await load(tab); }
        }}
      >
        <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Follow-up note..." />
      </Modal>
    </ProCard>
  );
}