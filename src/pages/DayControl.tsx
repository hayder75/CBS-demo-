import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  ShopOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import { colors } from '../theme';
import type { BranchCob, DayControlState, EodStepStatus } from '../types';

const dayStatusColor: Record<DayControlState['status'], string> = {
  Open: 'green',
  'EOD Running': 'blue',
  'EOD Completed': 'purple',
  Closed: 'default',
};

const stepStatusColor: Record<EodStepStatus, string> = {
  Pending: 'default',
  Running: 'blue',
  Done: 'green',
  Failed: 'red',
  Skipped: 'orange',
};

export default function DayControl() {
  const [state, setState] = useState<DayControlState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<DayControlState>('/api/day-control');
      setState(data);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = () => {
    setLoading(true);
    void load();
  };

  useEffect(() => {
    api<DayControlState>('/api/day-control')
      .then(setState)
      .catch((e) => message.error((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const runMutation = async (
    key: string,
    path: string,
    body?: Record<string, unknown>,
    success?: string,
  ) => {
    setBusy(key);
    try {
      await api(path, body ? { method: 'POST', body: JSON.stringify(body) } : { method: 'POST' });
      if (success) message.success(success);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const openBranches = state ? state.branches.filter((b) => b.status === 'Open').length : 0;
  const allClosed = !!state && state.branches.length > 0 && state.branches.every((b) => b.status === 'Closed');
  const eodLocked = state?.status === 'EOD Completed' || state?.status === 'EOD Running';
  const latestRun = state?.eodRuns[0];

  const branchAction = (b: BranchCob) => {
    const isClosing = busy === `close-${b.branchId}`;
    const isReopening = busy === `reopen-${b.branchId}`;
    const disabled = eodLocked || busy !== null;
    const reason = eodLocked
      ? 'End-of-day has started; branch close-of-business can no longer change'
      : 'Another operation is in progress';
    const button =
      b.status === 'Open' ? (
        <Button
          type="primary"
          size="small"
          disabled={disabled}
          loading={isClosing}
          onClick={() =>
            void runMutation(
              `close-${b.branchId}`,
              '/api/day-control/cob/close',
              { branchId: b.branchId },
              `${b.branch} close-of-business done`,
            )
          }
        >
          Close
        </Button>
      ) : (
        <Button
          size="small"
          disabled={disabled}
          loading={isReopening}
          onClick={() =>
            void runMutation(
              `reopen-${b.branchId}`,
              '/api/day-control/cob/reopen',
              { branchId: b.branchId },
              `${b.branch} reopened`,
            )
          }
        >
          Reopen
        </Button>
      );
    return disabled ? (
      <Tooltip title={reason}>
        <span style={{ display: 'inline-block' }}>{button}</span>
      </Tooltip>
    ) : (
      button
    );
  };

  const runDisabled = !allClosed || eodLocked;
  const runReason = !allClosed
    ? 'All branches must close business before EOD can run'
    : 'EOD is already running or completed for this business date';
  const advanceDisabled = state?.status !== 'EOD Completed';
  const advanceReason =
    state?.status !== 'EOD Completed'
      ? 'End-of-day must complete before advancing the business date'
      : 'Another operation is in progress';

  const runButton = (
    <Button
      type="primary"
      icon={<PlayCircleOutlined />}
      disabled={runDisabled}
      loading={busy === 'eod'}
      onClick={() =>
        void runMutation('eod', '/api/day-control/eod/run', undefined, 'End-of-day batch completed')
      }
    >
      Run EOD
    </Button>
  );

  const advanceButton = (
    <Button
      icon={<StepForwardOutlined />}
      disabled={advanceDisabled}
      loading={busy === 'advance'}
      onClick={() =>
        void runMutation('advance', '/api/day-control/advance', undefined, 'Business date advanced')
      }
    >
      Advance Business Date
    </Button>
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Business Date & Day Control"
        subtitle="Branch close-of-business, end-of-day batch processing and business date rollover"
        extra={
          <Space>
            <Tag color={state ? dayStatusColor[state.status] : 'default'}>
              {state?.status ?? 'Loading'}
            </Tag>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
              Refresh
            </Button>
          </Space>
        }
      />

      {!state ? (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <Spin />
          </div>
        </Card>
      ) : (
        <>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="Business Date"
                value={state.businessDate}
                icon={<CalendarOutlined style={{ color: colors.primary }} />}
                caption={`Next: ${state.nextBusinessDate}`}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="Day Status"
                value={state.status}
                color={state.status === 'EOD Completed' ? colors.success : colors.primary}
                icon={<ClockCircleOutlined style={{ color: colors.info }} />}
                caption={state.lastEodDate ? `Last EOD ${state.lastEodDate}` : 'EOD not yet run'}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="Open Branches"
                value={openBranches}
                icon={<ShopOutlined style={{ color: colors.accent }} />}
                caption={`${state.branches.length - openBranches} of ${state.branches.length} closed`}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="Last EOD"
                value={state.lastEodDate ?? '—'}
                icon={<CheckCircleOutlined style={{ color: colors.success }} />}
                caption={
                  latestRun
                    ? `${latestRun.status} · ${latestRun.steps.filter((s) => s.status === 'Done').length}/${latestRun.steps.length} steps`
                    : 'No completed run'
                }
              />
            </Col>
          </Row>

          <Card
            title="Branch Close-of-Business"
            extra={
              <Tag color={allClosed ? 'green' : 'orange'}>
                {allClosed ? 'All branches closed' : `${openBranches} open`}
              </Tag>
            }
          >
            <Table<BranchCob>
              rowKey="id"
              dataSource={state.branches}
              pagination={false}
              locale={{ emptyText: <Empty description="No branches configured" /> }}
              columns={[
                {
                  title: 'Branch',
                  dataIndex: 'branch',
                  render: (v: string, r) => (
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>{v}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        ID {r.branchId}
                      </Typography.Text>
                    </Space>
                  ),
                },
                { title: 'Business Date', dataIndex: 'businessDate' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (s: BranchCob['status']) => (
                    <Tag color={s === 'Closed' ? 'green' : 'orange'}>{s}</Tag>
                  ),
                },
                {
                  title: 'Closed At',
                  dataIndex: 'closedAt',
                  render: (v?: string) => (v ? new Date(v).toLocaleString('en-GB') : '—'),
                },
                {
                  title: 'Closed By',
                  dataIndex: 'closedBy',
                  render: (v?: string) => v ?? '—',
                },
                {
                  title: 'Action',
                  key: 'action',
                  align: 'right',
                  render: (_: unknown, r: BranchCob) => branchAction(r),
                },
              ]}
            />
          </Card>

          <Card
            title="End-of-Day Batch"
            extra={latestRun ? <Tag color={dayStatusColor[state.status]}>{latestRun.status}</Tag> : null}
          >
            <Row gutter={[20, 20]}>
              <Col xs={24} lg={10}>
                <div className="soft-panel">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <div className="kpi-label">Scheduled Batch</div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Posts maintenance fees, TFS maturity, loan auto-debit, penalties, loan
                        classification, provisions and dormant statuses for {state.businessDate}.
                      </Typography.Text>
                    </div>
                    <Space wrap>
                      {runDisabled ? (
                        <Tooltip title={runReason}>
                          <span style={{ display: 'inline-block' }}>{runButton}</span>
                        </Tooltip>
                      ) : (
                        runButton
                      )}
                      {advanceDisabled ? (
                        <Tooltip title={advanceReason}>
                          <span style={{ display: 'inline-block' }}>{advanceButton}</span>
                        </Tooltip>
                      ) : (
                        advanceButton
                      )}
                    </Space>
                  </Space>
                </div>
              </Col>
              <Col xs={24} lg={14}>
                {latestRun ? (
                  <List
                    size="small"
                    header={
                      <Space wrap>
                        <Typography.Text strong>Latest run</Typography.Text>
                        <Tag>{latestRun.businessDate}</Tag>
                        <Tag
                          color={
                            latestRun.status === 'Completed'
                              ? 'green'
                              : latestRun.status === 'Failed'
                                ? 'red'
                                : 'blue'
                          }
                        >
                          {latestRun.status}
                        </Tag>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          by {latestRun.startedBy}
                        </Typography.Text>
                      </Space>
                    }
                    dataSource={latestRun.steps}
                    renderItem={(step) => (
                      <List.Item
                        extra={<Tag color={stepStatusColor[step.status]}>{step.status}</Tag>}
                      >
                        <List.Item.Meta
                          title={step.name}
                          description={
                            step.processed != null ? `${step.processed} records processed` : undefined
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No end-of-day run yet" />
                )}
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
}
