import { useEffect, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  List,
  Row,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowUpOutlined,
  BankOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Total Members" value={kpi.totalMembers} icon={<TeamOutlined style={{ color: '#0e7a5f' }} />} footer={`${kpi.newMembersThisMonth} new this month · ${kpi.membersGrowthPct}% YoY`} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Total Savings" value={fmtETB(kpi.totalSavings)} icon={<DollarOutlined style={{ color: '#1890ff' }} />} footer={`${fmtETB(kpi.totalDepositsThisMonth)} deposits this month · ${kpi.savingsGrowthPct}%`} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Loan Portfolio" value={fmtETB(kpi.loanPortfolio)} icon={<BankOutlined style={{ color: '#722ed1' }} />} footer={`${fmtETB(kpi.loanDisbursedThisMonth)} disbursed this month`} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Operating Surplus (MTD)" value={fmtETB(kpi.surplusThisMonth)} suffix="" icon={<ArrowUpOutlined style={{ color: '#52c41a' }} />} footer={`Income ${fmtETB(kpi.incomeThisMonth)} · Expense ${fmtETB(kpi.expenseThisMonth)}`} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Cash on Hand" value={fmtETB(kpi.cashOnHand)} icon={<DollarOutlined style={{ color: '#fa8c16' }} />} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Cash at Bank" value={fmtETB(kpi.cashAtBank)} icon={<BankOutlined style={{ color: '#13c2c2' }} />} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="PAR > 30 days" value={`${kpi.parPct}%`} icon={<WarningOutlined style={{ color: kpi.parPct > 5 ? '#f5222d' : '#faad14' }} />} footer={`${kpi.overdueLoans} overdue loans`} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Pending Approvals" value={kpi.approvalsPending} icon={<CheckSquareOutlined style={{ color: '#eb2f96' }} />} footer="Maker-checker queue" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Portfolio at Risk" extra={<Tag color="red">PAR {kpi.parPct}%</Tag>}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={par} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {par.map((row) => (
                    <Cell key={row.label} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Savings Flow (last 6 months)" extra={<DollarOutlined style={{ color: '#1890ff' }} />}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => fmtETB(Number(v))} />
                <Legend />
                <Bar dataKey="deposits" name="Deposits" fill="#0e7a5f" radius={[3, 3, 0, 0]} />
                <Bar dataKey="withdrawals" name="Withdrawals" fill="#fa8c16" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Loan Portfolio Mix" extra={<BankOutlined style={{ color: '#722ed1' }} />}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                  {mix.map((row, i) => (
                    <Cell key={row.name} fill={['#722ed1', '#1890ff', '#0e7a5f', '#fa8c16', '#eb2f96'][i % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Pending Approvals" extra={<Tag color="volcano">{approvals.length} awaiting action</Tag>}>
            <Table
              size="small"
              rowKey="id"
              dataSource={approvals}
              pagination={false}
              columns={[
                { title: 'Type', dataIndex: 'type', width: 140 },
                { title: 'Ref', dataIndex: 'ref', width: 110 },
                { title: 'Summary', dataIndex: 'summary', ellipsis: true },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  align: 'right',
                  render: (v) => fmtETB(v),
                },
                { title: 'Requested by', dataIndex: 'initiatedBy', width: 130 },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Member Notifications" extra={<SafetyCertificateOutlined />}>
            <List
              size="small"
              dataSource={notifications.slice(0, 6)}
              renderItem={(n) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={n.channel === 'SMS' ? <Tag color="green">SMS</Tag> : <Tag>Email</Tag>}
                    title={`${n.memberName} — ${n.type}`}
                    description={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{n.message}</Typography.Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Alert
        type="success"
        showIcon
        message="System status: All operations nominal"
        description="Interest posting for September scheduled for month-end. Check-off reconciliation for 2 employers has variance — see Employer Check-Off."
      />
    </ProCard>
  );
}