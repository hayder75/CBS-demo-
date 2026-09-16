import { useEffect, useState } from 'react';
import { Button, Card, Col, List, Row, Space, Table, Tag, Typography } from 'antd';
import {
  ArrowUpOutlined,
  BankOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  DownloadOutlined,
  FilterOutlined,
  SafetyCertificateOutlined,
  ShareAltOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ProCard } from '@ant-design/pro-components';
import { api } from '../api/client';
import type { ApprovalItem, Kpi, Notification } from '../types';
import { fmtETB } from '../utils/format';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import { chartPalette, colors } from '../theme';

interface ParRow { label: string; value: number; color: string }
interface TrendRow { month: string; deposits: number; withdrawals: number }
interface MixRow { name: string; value: number }

export default function Dashboard() {
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [par, setPar] = useState<ParRow[]>([]);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [mix, setMix] = useState<MixRow[]>([]);

  useEffect(() => {
    api<Kpi>('/api/kpi').then(setKpi);
    api<ApprovalItem[]>('/api/approvals').then((a) =>
      setApprovals(a.filter((x) => x.status === 'Pending')),
    );
    api<Notification[]>('/api/notifications').then(setNotifications).catch(() => {});
    api<ParRow[]>('/api/portfolio-at-risk').then(setPar).catch(() => {});
    api<TrendRow[]>('/api/savings-trend').then(setTrend).catch(() => {});
    api<MixRow[]>('/api/loan-product-mix').then(setMix).catch(() => {});
  }, []);

  if (!kpi) return null;

  const mixTotal = mix.reduce((s, m) => s + m.value, 0) || 1;
  const trendTotal = trend.reduce((s, t) => s + t.deposits, 0);

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Overview"
        subtitle="SACCO performance at a glance across branches and portfolios"
        extra={
          <Space>
            <Button icon={<FilterOutlined />}>Filter</Button>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button type="primary" icon={<ShareAltOutlined />}>
              Share
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Members"
            value={kpi.totalMembers}
            icon={<TeamOutlined style={{ color: colors.primary }} />}
            delta={kpi.membersGrowthPct}
            caption={`${kpi.newMembersThisMonth} new this month`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Savings"
            value={fmtETB(kpi.totalSavings)}
            icon={<DollarOutlined style={{ color: colors.info }} />}
            delta={kpi.savingsGrowthPct}
            caption={`${fmtETB(kpi.totalDepositsThisMonth)} this month`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Loan Portfolio"
            value={fmtETB(kpi.loanPortfolio)}
            icon={<BankOutlined style={{ color: '#7a5af8' }} />}
            delta={4.2}
            caption={`${fmtETB(kpi.loanDisbursedThisMonth)} disbursed`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Operating Surplus (MTD)"
            value={fmtETB(kpi.surplusThisMonth)}
            icon={<ArrowUpOutlined style={{ color: colors.success }} />}
            delta={kpi.incomeThisMonth >= kpi.expenseThisMonth ? 6.1 : -3.4}
            caption={`Income ${fmtETB(kpi.incomeThisMonth)}`}
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Cash on Hand"
            value={fmtETB(kpi.cashOnHand)}
            icon={<DollarOutlined style={{ color: colors.accent }} />}
            caption="Teller & vault balances"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Cash at Bank"
            value={fmtETB(kpi.cashAtBank)}
            icon={<BankOutlined style={{ color: '#13c2c2' }} />}
            caption="Reconciled today"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="PAR > 30 days"
            value={`${kpi.parPct}%`}
            icon={<WarningOutlined style={{ color: kpi.parPct > 5 ? colors.danger : colors.warning }} />}
            delta={kpi.parPct > 5 ? 1.4 : -0.6}
            caption={`${kpi.overdueLoans} overdue loans`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Pending Approvals"
            value={kpi.approvalsPending}
            icon={<CheckSquareOutlined style={{ color: '#ee46bc' }} />}
            caption="Maker-checker queue"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            title="Savings Flow"
            extra={<Tag color="green">Last 6 months</Tag>}
            style={{ height: '100%' }}
          >
            <div style={{ marginBottom: 12 }}>
              <div className="kpi-value" style={{ fontSize: 24 }}>
                {fmtETB(trendTotal)}
              </div>
              <div className="kpi-caption">Total deposits in period</div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="depFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f2f5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#98a2b3' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#98a2b3' }} />
                <Tooltip
                  formatter={(v) => fmtETB(Number(v))}
                  contentStyle={{ borderRadius: 10, border: '1px solid #eaecf0', fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="deposits"
                  name="Deposits"
                  stroke={colors.primary}
                  strokeWidth={2.5}
                  fill="url(#depFill)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="withdrawals"
                  name="Withdrawals"
                  stroke={colors.accent}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Loan Portfolio Mix" style={{ height: '100%' }}>
            <div style={{ marginBottom: 8 }}>
              <div className="kpi-value" style={{ fontSize: 24 }}>
                {mix.length}
              </div>
              <div className="kpi-caption">Active loan products</div>
            </div>
            {mix.map((row, i) => (
              <div className="progress-list-row" key={row.name}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: chartPalette[i % chartPalette.length],
                    flex: '0 0 auto',
                  }}
                />
                <span className="progress-list-label" style={{ flex: '0 0 96px' }}>
                  {row.name}
                </span>
                <span className="progress-list-track">
                  <span
                    className="progress-list-fill"
                    style={{
                      width: `${Math.round((row.value / mixTotal) * 100)}%`,
                      background: chartPalette[i % chartPalette.length],
                    }}
                  />
                </span>
                <span className="progress-list-value">{row.value}%</span>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <Card title="Portfolio at Risk" extra={<Tag color="red">PAR {kpi.parPct}%</Tag>} style={{ height: '100%' }}>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={par} dataKey="value" nameKey="label" innerRadius={62} outerRadius={94} paddingAngle={3} stroke="none">
                    {par.map((row) => (
                      <Cell key={row.label} fill={row.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  top: '38%',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div className="kpi-value" style={{ fontSize: 22 }}>
                  {kpi.parPct}%
                </div>
                <div className="kpi-caption">at risk</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            title="Pending Approvals"
            extra={<Tag color="volcano">{approvals.length} awaiting action</Tag>}
            style={{ height: '100%' }}
          >
            <Table
              size="small"
              rowKey="id"
              dataSource={approvals}
              pagination={false}
              columns={[
                { title: 'Type', dataIndex: 'type', width: 150 },
                { title: 'Ref', dataIndex: 'ref', width: 110 },
                { title: 'Summary', dataIndex: 'summary', ellipsis: true },
                { title: 'Amount', dataIndex: 'amount', align: 'right', render: (v) => fmtETB(v) },
                { title: 'Requested by', dataIndex: 'initiatedBy', width: 130 },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Card title="Member Notifications" extra={<SafetyCertificateOutlined style={{ color: colors.primary }} />} style={{ height: '100%' }}>
            <List
              size="small"
              dataSource={notifications.slice(0, 6)}
              renderItem={(n) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={n.channel === 'SMS' ? <Tag color="green">SMS</Tag> : <Tag color="blue">Email</Tag>}
                    title={`${n.memberName} — ${n.type}`}
                    description={
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {n.message}
                      </Typography.Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="System Status" style={{ height: '100%' }}>
            <div className="soft-panel" style={{ marginBottom: 12 }}>
              <Space direction="vertical" size={4}>
                <Typography.Text strong style={{ fontSize: 13 }}>
                  All operations nominal
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  All core banking services are running without interruption.
                </Typography.Text>
              </Space>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#475467', fontSize: 13, lineHeight: 2 }}>
              <li>Interest posting for September scheduled for month-end.</li>
              <li>Check-off reconciliation for 2 employers has variance.</li>
              <li>3 loan appraisals awaiting credit committee review.</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </ProCard>
  );
}
