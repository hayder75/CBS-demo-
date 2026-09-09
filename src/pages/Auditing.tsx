import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { SavingsTransaction } from '../types';
import { fmtETB } from '../utils/format';

const auditTag = (s: string) => (
  <Tag color={s === 'Audited' ? 'green' : s === 'Discrepant' ? 'red' : 'gold'}>{s}</Tag>
);

export default function Auditing() {
  const [txns, setTxns] = useState<SavingsTransaction[]>([]);
  const [tab, setTab] = useState('Unaudited');
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [note, setNote] = useState('');

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
    { title: 'Member', dataIndex: 'memberId', width: 100 },
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

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
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