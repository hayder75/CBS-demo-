import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowRightOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { AuditAction, AuditTrailEntry } from '../types';
import { buildCsv, downloadCsv } from '../utils/csv';
import { colors } from '../theme';

interface VerifyResult {
  valid: boolean;
  checked: number;
  brokenAt?: string;
}

const ACTIONS: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT'];

const ENTITIES = ['Member', 'Loan', 'SavingsAccount', 'Payment', 'Approval', 'User'];

const actionColor: Record<AuditAction, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'geekblue',
  APPROVE: 'cyan',
  REJECT: 'volcano',
};

const mono = { fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" };

const truncated = (value?: string) => (value && value.length > 16 ? `${value.slice(0, 16)}…` : value ?? '—');

const fmtWhen = (value: string) => new Date(value).toLocaleString('en-GB');

export default function AuditTrail() {
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<VerifyResult | null>(null);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | undefined>();
  const [entity, setEntity] = useState<string | undefined>();
  const [actor, setActor] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (action) params.set('action', action);
      if (entity) params.set('entity', entity);
      if (actor) params.set('actor', actor);
      if (range) {
        params.set('from', range[0].format('YYYY-MM-DD'));
        params.set('to', range[1].format('YYYY-MM-DD'));
      }
      const query = params.toString();
      try {
        const [rows, actorRows] = await Promise.all([
          api<AuditTrailEntry[]>(`/api/audit-trail${query ? `?${query}` : ''}`),
          api<string[]>('/api/audit-trail/actors'),
        ]);
        if (!active) return;
        setEntries(rows);
        setActors(actorRows);
      } catch (e) {
        if (active) message.error((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load().catch(() => {});
    return () => {
      active = false;
    };
  }, [search, action, entity, actor, range, refreshKey]);

  const updates = useMemo(() => entries.filter((entry) => entry.action === 'UPDATE').length, [entries]);
  const deletes = useMemo(() => entries.filter((entry) => entry.action === 'DELETE').length, [entries]);
  const distinctActors = useMemo(() => new Set(entries.map((entry) => entry.actor)).size, [entries]);

  const resetFilters = () => {
    setSearch('');
    setAction(undefined);
    setEntity(undefined);
    setActor(undefined);
    setRange(null);
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const result = await api<VerifyResult>('/api/audit-trail/verify');
      setVerification(result);
      if (result.valid) {
        message.success(`Hash chain verified across ${result.checked} events`);
      } else {
        message.error(`Hash chain broken at ${result.brokenAt ?? 'an unknown event'}`);
      }
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setVerifying(false);
    }
  };

  const exportCsv = () => {
    if (entries.length === 0) {
      message.warning('There are no events to export');
      return;
    }
    const rows = entries.map((entry) => ({
      id: entry.id,
      occurredAt: entry.occurredAt,
      actor: entry.actor,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      field: entry.field ?? '',
      oldValue: entry.oldValue ?? '',
      newValue: entry.newValue ?? '',
      detail: entry.detail ?? '',
      ip: entry.ip ?? '',
      hash: entry.hash,
      prevHash: entry.prevHash ?? '',
    }));
    downloadCsv(`audit-trail-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(rows));
    message.success(`Exported ${rows.length} audit events`);
  };

  const columns: ColumnsType<AuditTrailEntry> = [
    { title: 'When', dataIndex: 'occurredAt', width: 175, render: (value: string) => fmtWhen(value) },
    { title: 'Actor', dataIndex: 'actor', width: 155 },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 110,
      render: (value: AuditAction) => <Tag color={actionColor[value]}>{value}</Tag>,
    },
    { title: 'Entity', dataIndex: 'entity', width: 135 },
    { title: 'Ref', dataIndex: 'entityId', width: 140 },
    {
      title: 'Field',
      dataIndex: 'field',
      width: 130,
      render: (value?: string) => (value ? <Tag>{value}</Tag> : '—'),
    },
    { title: 'Detail', dataIndex: 'detail', ellipsis: true },
    {
      title: 'Hash',
      dataIndex: 'hash',
      width: 140,
      render: (value: string) => (
        <Tooltip title={value}>
          <Typography.Text code style={{ ...mono, fontSize: 12 }}>
            {truncated(value)}
          </Typography.Text>
        </Tooltip>
      ),
    },
  ];

  const expandedRow = (entry: AuditTrailEntry) => (
    <Row gutter={[20, 16]}>
      <Col xs={24} lg={10}>
        <div className="soft-panel" style={{ height: '100%' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
            FIELD DIFF
          </Typography.Text>
          {entry.field ? (
            <div style={{ marginTop: 10 }}>
              <Tag color="blue">{entry.field}</Tag>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <Typography.Text delete type="danger" style={{ ...mono, fontSize: 12 }}>
                  {entry.oldValue ?? '—'}
                </Typography.Text>
                <ArrowRightOutlined style={{ color: colors.text3 }} />
                <Typography.Text strong style={{ ...mono, fontSize: 12, color: colors.success }}>
                  {entry.newValue ?? '—'}
                </Typography.Text>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              <Typography.Text type="secondary">No field-level change recorded for this event.</Typography.Text>
            </div>
          )}
        </div>
      </Col>
      <Col xs={24} lg={14}>
        <Descriptions size="small" column={1} bordered={false}>
          <Descriptions.Item label="Detail">{entry.detail || '—'}</Descriptions.Item>
          <Descriptions.Item label="IP address">{entry.ip || '—'}</Descriptions.Item>
          <Descriptions.Item label="Hash">
            <Typography.Text copyable style={{ ...mono, fontSize: 12, wordBreak: 'break-all' }}>
              {entry.hash}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Previous hash">
            <Typography.Text copyable style={{ ...mono, fontSize: 12, wordBreak: 'break-all' }}>
              {entry.prevHash ?? 'GENESIS'}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Col>
    </Row>
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Audit Trail"
        subtitle="Immutable, hash-chained record of every change with field-level before and after values"
        extra={
          <Space wrap>
            <Button
              icon={<SafetyCertificateOutlined />}
              loading={verifying}
              onClick={() => verify().catch(() => {})}
            >
              Verify Integrity
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => setRefreshKey((value) => value + 1)}>
              Refresh
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Events"
            value={entries.length}
            icon={<FileTextOutlined style={{ color: colors.primary }} />}
            caption="Matching the current filters"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Updates"
            value={updates}
            icon={<EditOutlined style={{ color: colors.info }} />}
            caption="Field-level modifications"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Deletes"
            value={deletes}
            icon={<DeleteOutlined style={{ color: colors.danger }} />}
            caption="Removed records"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Actors"
            value={actors.length || distinctActors}
            icon={<TeamOutlined style={{ color: colors.success }} />}
            caption="Distinct users on record"
          />
        </Col>
      </Row>

      {verification && (
        <Alert
          type={verification.valid ? 'success' : 'error'}
          showIcon
          closable
          onClose={() => setVerification(null)}
          message={
            verification.valid
              ? `Hash chain intact across ${verification.checked} events`
              : `Hash chain broken at ${verification.brokenAt ?? 'an unknown event'}`
          }
          description={
            verification.valid
              ? 'Every event hash matches its predecessor. The trail has not been altered since it was written.'
              : `The recomputed digest does not match the stored hash for event ${verification.brokenAt ?? 'unknown'}. Investigate immediately.`
          }
        />
      )}

      <Card title="Event Filters">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12} xl={6}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search actor, entity or detail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Col>
          <Col xs={12} md={6} xl={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Action"
              value={action}
              onChange={(value) => setAction(value as AuditAction | undefined)}
              options={ACTIONS.map((value) => ({ label: value, value }))}
            />
          </Col>
          <Col xs={12} md={6} xl={3}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Entity"
              value={entity}
              onChange={(value) => setEntity(value as string | undefined)}
              options={ENTITIES.map((value) => ({ label: value, value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              showSearch
              style={{ width: '100%' }}
              placeholder="Actor"
              value={actor}
              onChange={(value) => setActor(value as string | undefined)}
              options={actors.map((value) => ({ label: value, value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={5}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={range}
              onChange={(value) => setRange(value && value[0] && value[1] ? [value[0], value[1]] : null)}
            />
          </Col>
          <Col xs={24} xl={3}>
            <Button block onClick={resetFilters}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Immutable Event Log">
        <Table<AuditTrailEntry>
          rowKey="id"
          loading={loading}
          dataSource={entries}
          columns={columns}
          expandable={{ expandedRowRender: expandedRow, expandRowByClick: true }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} events`,
          }}
          locale={{
            emptyText: (
              <Empty description="No audit events match these filters" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ),
          }}
        />
        <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0, fontSize: 12 }}>
          Each event stores its own SHA-style digest and the digest of the preceding event. Expanding a row reveals
          the field-level before and after values, source IP and both hashes. Passwords, keys, secrets and tokens are
          redacted before they are written.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
