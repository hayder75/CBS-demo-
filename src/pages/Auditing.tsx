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
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { Member, SavingsTransaction } from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

interface HoOverview {
  total: number;
  auditedExact: number;
  auditedDiscrepant: number;
  unaudited: number;
  byTeller: { teller: string; exact: number; discrepant: number; unaudited: number; total: number }[];
}

type TabKey = 'Unaudited' | 'Audited' | 'Discrepant' | 'HO-Overview' | 'HO-Unaudited';

const auditTag = (s: string) => (
  <Tag color={s === 'Audited' ? 'green' : s === 'Discrepant' ? 'red' : 'gold'}>{s}</Tag>
);

export default function Auditing() {
  const [txns, setTxns] = useState<SavingsTransaction[]>([]);
  const [hoTxns, setHoTxns] = useState<SavingsTransaction[]>([]);
  const [overview, setOverview] = useState<HoOverview | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<TabKey>('Unaudited');
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    api<Member[]>('/api/members').then(setMembers).catch(() => {});
  }, []);

  const memberOf = (v: string) =>
    members.find((m) => String(m.id) === String(v))?.fullName ?? String(v);

  const load = async (key: TabKey) => {
    if (key === 'HO-Overview') {
      setOverview(await api<HoOverview>('/api/audit/ho-overview').catch(() => null));
    } else if (key === 'HO-Unaudited') {
      setHoTxns(await api<SavingsTransaction[]>('/api/audit/ho/transactions?status=Unaudited').catch(() => []));
    } else {
      setTxns(await api<SavingsTransaction[]>(`/api/audit/transactions?status=${key}`).catch(() => []));
    }
  };

  useEffect(() => { load(tab); /* eslint-disable-line */ }, [tab]);

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

  const tableFor = (data: SavingsTransaction[]) => (
    <Table rowKey="id" dataSource={data} pagination={{ pageSize: 10, showSizeChanger: false }} columns={cols} />
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Auditing"
        subtitle="Maker transaction verification, discrepancy follow-up and head-office consolidation"
        extra={
          <Space>
            <Button icon={<FileSearchOutlined />}>Export Register</Button>
            <Button type="primary" onClick={() => load(tab)}>Refresh</Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title={tab.startsWith('HO') ? 'Total Transactions' : 'Records in View'}
            value={tab === 'HO-Overview' ? overview?.total ?? 0 : txns.length}
            icon={<FileSearchOutlined style={{ color: colors.primary }} />}
            caption={tab}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title={tab === 'HO-Overview' ? 'Audited Exact' : 'Value in View'}
            value={tab === 'HO-Overview' ? overview?.auditedExact ?? 0 : fmtETB(viewTotal)}
            icon={<DollarOutlined style={{ color: colors.info }} />}
            caption={tab === 'HO-Overview' ? 'Across all branches' : 'Transactions under review'}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title={tab === 'HO-Overview' ? 'Audited Discrepant' : 'Audited'}
            value={tab === 'HO-Overview' ? overview?.auditedDiscrepant ?? 0 : audited}
            icon={<CheckCircleOutlined style={{ color: colors.success }} />}
            caption={tab === 'HO-Overview' ? 'Flagged at head office' : 'Marked as exact match'}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title={tab === 'HO-Overview' ? 'Unaudited' : 'Discrepant'}
            value={tab === 'HO-Overview' ? overview?.unaudited ?? 0 : discrepant}
            icon={<WarningOutlined style={{ color: colors.danger }} />}
            caption={tab === 'HO-Overview' ? 'Awaiting verification' : 'Require follow-up notes'}
          />
        </Col>
      </Row>

      <Card title="Auditing / Verification">
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          items={[
            { key: 'Unaudited', label: 'Unaudited', children: tableFor(txns) },
            { key: 'Audited', label: 'Audited (Exact)', children: tableFor(txns) },
            { key: 'Discrepant', label: 'Audited (Discrepant)', children: tableFor(txns) },
            {
              key: 'HO-Overview',
              label: 'HO Overview',
              children: (
                <Table
                  rowKey="teller"
                  dataSource={overview?.byTeller ?? []}
                  pagination={false}
                  columns={[
                    { title: 'Teller', dataIndex: 'teller' },
                    { title: 'Exact', dataIndex: 'exact', align: 'right' as const },
                    { title: 'Discrepant', dataIndex: 'discrepant', align: 'right' as const, render: (v: number) => <Tag color={v > 0 ? 'red' : 'default'}>{v}</Tag> },
                    { title: 'Unaudited', dataIndex: 'unaudited', align: 'right' as const },
                    { title: 'Total', dataIndex: 'total', align: 'right' as const },
                  ]}
                />
              ),
            },
            { key: 'HO-Unaudited', label: 'HO Unaudited', children: tableFor(hoTxns) },
          ]}
        />
        <Typography.Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
          Auditors review maker transactions: classify each as <b>Exact Match</b> or <b>Discrepant</b> with a
          reason (Unaudited / Audited-Exact / Audited-Discrepant). The <b>HO Overview</b> consolidates across branches.
        </Typography.Paragraph>
      </Card>

      <Modal
        title="Add Audit Note"
        open={!!noteOpen}
        onCancel={() => setNoteOpen(null)}
        onOk={async () => {
          if (noteOpen) {
            await api(`/api/audit/transactions/${noteOpen}/note`, { method: 'POST', body: JSON.stringify({ note }) });
            setNote('');
            setNoteOpen(null);
            await load(tab);
          }
        }}
      >
        <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Follow-up note..." />
      </Modal>
    </div>
  );
}
