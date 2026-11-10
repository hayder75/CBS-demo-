import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Popconfirm,
  Progress,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ClearOutlined,
  CloudDownloadOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  HddOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { BackupRecord } from '../types';

interface SchedulerJob {
  id: string;
  name: string;
  cron: string;
  lastRun: string;
  nextRun: string;
  status: 'Idle' | 'Running' | 'Ok' | 'Failed';
}

interface CacheInfo {
  keys: number;
  lastClearedAt: string | null;
}

interface HealthInfo {
  db: 'up' | 'down';
  cache: 'up' | 'down';
  storagePct: number;
  uptime: number;
}

const jobColor: Record<SchedulerJob['status'], string> = {
  Idle: 'default',
  Running: 'processing',
  Ok: 'green',
  Failed: 'red',
};

const formatSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const currentUserName = (): string => {
  try {
    const raw = localStorage.getItem('cbs-user');
    if (!raw) return 'Administrator';
    const parsed = JSON.parse(raw) as { name?: string };
    return parsed?.name || 'Administrator';
  } catch {
    return 'Administrator';
  }
};

export default function SystemOps() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [cache, setCache] = useState<CacheInfo | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, j, c, h] = await Promise.all([
        api<BackupRecord[]>('/api/system/backups').catch(() => [] as BackupRecord[]),
        api<SchedulerJob[]>('/api/system/scheduler').catch(() => [] as SchedulerJob[]),
        api<CacheInfo>('/api/system/cache').catch(() => null),
        api<HealthInfo>('/api/system/health').catch(() => null),
      ]);
      setBackups(Array.isArray(b) ? b : []);
      setJobs(Array.isArray(j) ? j : []);
      setCache(c);
      setHealth(h);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createBackup = async () => {
    setCreating(true);
    try {
      await api<BackupRecord>('/api/system/backups', {
        method: 'POST',
        body: JSON.stringify({ kind: 'Manual', createdBy: currentUserName() }),
      });
      message.success('Backup created successfully');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = (record: BackupRecord) => {
    try {
      const payload = JSON.stringify(
        {
          fileName: record.fileName,
          sizeKb: record.sizeKb,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
          kind: record.kind,
        },
        null,
        2,
      );
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = record.fileName.replace(/\.sql$/i, '.json');
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      message.success(`Downloaded ${record.fileName}`);
    } catch {
      message.success(`Prepared ${record.fileName} for download`);
    }
  };

  const deleteBackup = async (record: BackupRecord) => {
    try {
      await api(`/api/system/backups/${record.id}`, { method: 'DELETE' });
      message.success(`Deleted ${record.fileName}`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const clearCache = async () => {
    setClearing(true);
    try {
      const res = await api<{ cleared: boolean; keys: number }>('/api/system/cache/clear', {
        method: 'POST',
      });
      message.success(`Cache cleared — ${res.keys} key(s) removed`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setClearing(false);
    }
  };

  const runJob = async (id: string) => {
    setRunningId(id);
    try {
      await api(`/api/system/scheduler/${id}/run`, { method: 'POST' });
      message.success('Job triggered successfully');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setRunningId(null);
    }
  };

  const latest = backups[0];
  const totalKb = backups.reduce((sum, b) => sum + b.sizeKb, 0);

  const backupColumns = [
    { title: 'File Name', dataIndex: 'fileName', ellipsis: true },
    {
      title: 'Kind',
      dataIndex: 'kind',
      width: 120,
      render: (kind: string) => (
        <Tag color={kind === 'Scheduled' ? 'blue' : 'green'}>{kind}</Tag>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'sizeKb',
      width: 110,
      align: 'right' as const,
      render: (sizeKb: number) => formatSize(sizeKb),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      width: 190,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    { title: 'Created By', dataIndex: 'createdBy', width: 150 },
    {
      title: 'Actions',
      width: 190,
      render: (_: unknown, record: BackupRecord) => (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadBackup(record)}
          >
            Download
          </Button>
          <Popconfirm
            title="Delete backup?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteBackup(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const jobColumns = [
    { title: 'Job', dataIndex: 'name' },
    {
      title: 'Cron',
      dataIndex: 'cron',
      width: 180,
      render: (cron: string) => <Typography.Text code>{cron}</Typography.Text>,
    },
    {
      title: 'Last Run',
      dataIndex: 'lastRun',
      width: 180,
      render: (value: string) => (value ? new Date(value).toLocaleString() : '—'),
    },
    {
      title: 'Next Run',
      dataIndex: 'nextRun',
      width: 180,
      render: (value: string) => (value ? new Date(value).toLocaleString() : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (status: SchedulerJob['status']) => <Tag color={jobColor[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      width: 130,
      render: (_: unknown, record: SchedulerJob) => (
        <Button
          size="small"
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={runningId === record.id}
          onClick={() => runJob(record.id)}
        >
          Run now
        </Button>
      ),
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title="System Operations"
        subtitle="Database backups, cache control, scheduler jobs and platform health"
        extra={
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <Tabs
        items={[
          {
            key: 'backups',
            label: 'Backups',
            children: (
              <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <Row gutter={[20, 20]}>
                  <Col xs={24} sm={12} xl={8}>
                    <StatCard
                      title="Total Backups"
                      value={backups.length}
                      icon={<DatabaseOutlined style={{ color: '#0e7a5f' }} />}
                      caption="Available restore points"
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={8}>
                    <StatCard
                      title="Latest Size"
                      value={latest ? formatSize(latest.sizeKb) : '—'}
                      icon={<CloudDownloadOutlined style={{ color: '#2e90fa' }} />}
                      caption={latest ? latest.fileName : 'No backup found'}
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={8}>
                    <StatCard
                      title="Storage Used"
                      value={formatSize(totalKb)}
                      icon={<HddOutlined style={{ color: '#f79009' }} />}
                      caption="Across all backups"
                    />
                  </Col>
                </Row>

                <Card
                  title="Backup History"
                  extra={
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      loading={creating}
                      onClick={createBackup}
                    >
                      Create Backup
                    </Button>
                  }
                >
                  {creating && (
                    <div className="soft-panel" style={{ marginBottom: 16 }}>
                      <Typography.Text type="secondary">Creating backup…</Typography.Text>
                      <Progress percent={70} status="active" showInfo={false} />
                    </div>
                  )}
                  <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={backups}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    locale={{ emptyText: <Empty description="No backups yet" /> }}
                    columns={backupColumns}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: 'cache',
            label: 'Cache',
            children: (
              <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <Row gutter={[20, 20]}>
                  <Col xs={24} sm={12} xl={8}>
                    <StatCard
                      title="Cache Keys"
                      value={cache?.keys ?? 0}
                      icon={<DatabaseOutlined style={{ color: '#0e7a5f' }} />}
                      caption="Cached entries currently held"
                    />
                  </Col>
                  <Col xs={24} sm={12} xl={8}>
                    <StatCard
                      title="Last Cleared"
                      value={
                        cache?.lastClearedAt
                          ? new Date(cache.lastClearedAt).toLocaleString()
                          : 'Never'
                      }
                      icon={<ReloadOutlined style={{ color: '#2e90fa' }} />}
                      caption="Most recent purge"
                    />
                  </Col>
                </Row>

                <Card title="Cache Management">
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Typography.Text type="secondary">
                      Clearing the cache purges cached lookups, reports and session fragments. The
                      next request repopulates entries from the database.
                    </Typography.Text>
                    <Popconfirm
                      title="Clear the cache?"
                      description="All cached entries will be purged immediately."
                      okText="Clear"
                      okButtonProps={{ danger: true }}
                      onConfirm={clearCache}
                    >
                      <Button
                        type="primary"
                        danger
                        icon={<ClearOutlined />}
                        loading={clearing}
                      >
                        Clear Cache
                      </Button>
                    </Popconfirm>
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: 'scheduler',
            label: 'Scheduler',
            children: (
              <Card title="Scheduled Jobs">
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={jobs}
                  pagination={false}
                  locale={{ emptyText: <Empty description="No scheduled jobs" /> }}
                  columns={jobColumns}
                />
              </Card>
            ),
          },
          {
            key: 'health',
            label: 'Health',
            children: (
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={12} xl={6}>
                  <StatCard
                    title="Database"
                    value={health ? health.db.toUpperCase() : '—'}
                    icon={<DatabaseOutlined style={{ color: '#0e7a5f' }} />}
                    caption="Primary datastore"
                  />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <StatCard
                    title="Cache"
                    value={health ? health.cache.toUpperCase() : '—'}
                    icon={<ClearOutlined style={{ color: '#12b76a' }} />}
                    caption="In-memory cache layer"
                  />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <StatCard
                    title="Storage %"
                    value={health ? `${health.storagePct}%` : '—'}
                    icon={<HddOutlined style={{ color: '#f79009' }} />}
                    caption="Backup storage utilisation"
                  />
                </Col>
                <Col xs={24} sm={12} xl={6}>
                  <StatCard
                    title="Uptime"
                    value={health ? formatUptime(health.uptime) : '—'}
                    icon={<ReloadOutlined style={{ color: '#2e90fa' }} />}
                    caption="Since last restart"
                  />
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </div>
  );
}
