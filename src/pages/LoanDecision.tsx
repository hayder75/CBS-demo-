import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircleOutlined, CloseCircleOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { PageHeader } from '../components/PageHeader';
import { api } from '../api/client';
import type { Loan } from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

interface FactorRow {
  code: string;
  name: string;
  direction: string;
  weight: number;
  value: number;
  contribution: number;
}

interface ScoreResult {
  scoreRunId?: string;
  memberId: number;
  score: number;
  grade: string;
  pdPct: number;
  interestPct: number;
  decision: string;
  recommendedAmount: number;
  recommendedTerm: number;
  narration: string;
  factors: FactorRow[];
  features: Record<string, unknown>;
}

const decisionColor: Record<string, string> = {
  AUTO_APPROVE: 'green',
  REFER: 'gold',
  DECLINE: 'red',
};

const gradeColor: Record<string, string> = {
  A: '#12b76a',
  B: '#22c55e',
  C: '#f79009',
  D: '#f97316',
  E: '#f04438',
};

export default function LoanDecision() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanId, setLoanId] = useState<number | undefined>();
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState('APPROVE');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api<Loan[]>('/api/loans').then((l) => {
      setLoans(l);
      if (l.length) setLoanId(Number(l[0].id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (loanId === undefined) return;
    api<ScoreResult>(`/api/loan-scoring/loan/${loanId}`)
      .then(setResult)
      .catch(() => message.error('Failed to score loan'));
  }, [loanId]);

  const selectedLoan = useMemo(() => loans.find((l) => Number(l.id) === loanId), [loans, loanId]);

  const doOverride = async () => {
    if (!result?.scoreRunId) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api(`/api/loan-scoring/runs/${result.scoreRunId}/override`, {
        method: 'POST',
        body: JSON.stringify({ decision: overrideDecision, reason: values.reason }),
      });
      message.success('Decision recorded (officer override)');
      setOverrideOpen(false);
      form.resetFields();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const chartData = (result?.factors ?? []).map((f) => ({
    name: f.name.replace(/ .*/, ''),
    full: f.name,
    contribution: f.contribution,
  }));

  const features = result?.features ?? {};

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Loan Decision"
        subtitle="AI-assisted, explainable credit assessment — score, risk grade, recommendation"
        extra={
          <Space>
            <Select
              style={{ width: 320 }}
              value={loanId}
              onChange={(v) => setLoanId(v)}
              showSearch
              optionFilterProp="label"
              options={loans.map((l) => ({ value: Number(l.id), label: `${l.loanNo} · ${l.memberName ?? 'Member'} · ${fmtETB(l.amount)}` }))}
            />
          </Space>
        }
      />

      {!result ? (
        <Card><Empty description="Select a loan to assess" /></Card>
      ) : (
        <>
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={8}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }} size={12} align="center">
                  <Progress
                    type="dashboard"
                    percent={Math.round(result.score)}
                    strokeColor={gradeColor[result.grade] ?? colors.primary}
                    format={(p) => (
                      <span>
                        <div style={{ fontSize: 30, fontWeight: 800, color: colors.text }}>{p}</div>
                        <div style={{ fontSize: 11, color: colors.text3 }}>score / 100</div>
                      </span>
                    )}
                  />
                  <Space>
                    <Tag color={gradeColor[result.grade]} style={{ fontSize: 14, padding: '2px 10px' }}>Grade {result.grade}</Tag>
                    <Tag color={decisionColor[result.decision]}>{result.decision.replace('_', ' ')}</Tag>
                  </Space>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}><Card size="small"><Statistic title="Est. PD" value={result.pdPct} suffix="%" /></Card></Col>
                <Col xs={12} md={6}><Card size="small"><Statistic title="Interest" value={result.interestPct} suffix="%" /></Card></Col>
                <Col xs={12} md={6}><Card size="small"><Statistic title="Recommended" value={result.recommendedAmount} formatter={(v) => fmtETB(Number(v))} /></Card></Col>
                <Col xs={12} md={6}><Card size="small"><Statistic title="Tenor" value={result.recommendedTerm} suffix="mo" /></Card></Col>
              </Row>
              <Card size="small" style={{ marginTop: 16 }}>
                <Space align="start">
                  <RobotOutlined style={{ color: colors.primary, marginTop: 3 }} />
                  <Typography.Text>{result.narration}</Typography.Text>
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} lg={12}>
              <Card title="Factor contributions" extra={<ThunderboltOutlined style={{ color: colors.accent }} />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="contribution" radius={[0, 6, 6, 0]}>
                      {chartData.map((_, i) => (<Cell key={i} fill={colors.primary} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Computed features">
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="Average savings">{fmtETB(Number(features.savingsAvgBalance ?? 0))}</Descriptions.Item>
                  <Descriptions.Item label="Deposits / month">{String(features.depositFreqMonthly ?? 0)}</Descriptions.Item>
                  <Descriptions.Item label="Savings growth">{String(features.savingsGrowthPct ?? 0)}%</Descriptions.Item>
                  <Descriptions.Item label="Share capital">{fmtETB(Number(features.shareBalance ?? 0))}</Descriptions.Item>
                  <Descriptions.Item label="On-time repayment">{String(features.onTimePct ?? 0)}%</Descriptions.Item>
                  <Descriptions.Item label="Arrears">{String(features.arrearsDays ?? 0)} days</Descriptions.Item>
                  <Descriptions.Item label="Debt-to-income">{String(features.dtiPct ?? 0)}%</Descriptions.Item>
                  <Descriptions.Item label="Tenure">{String(features.tenureMonths ?? 0)} months</Descriptions.Item>
                  <Descriptions.Item label="Collateral coverage">{String(features.collateralCoveragePct ?? 0)}%</Descriptions.Item>
                  <Descriptions.Item label="KYC complete">{features.kycComplete ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>

          <Card>
            <Table
              size="small"
              rowKey="code"
              pagination={false}
              dataSource={result.factors}
              columns={[
                { title: 'Factor', dataIndex: 'name' },
                { title: 'Weight', dataIndex: 'weight', align: 'right' as const },
                { title: 'Normalised', dataIndex: 'value', align: 'right' as const, render: (v: number) => `${Math.round(v * 100)}%` },
                { title: 'Contribution', dataIndex: 'contribution', align: 'right' as const },
                {
                  title: 'Impact', dataIndex: 'contribution', align: 'center' as const,
                  render: (v: number) => <Tag color={v / 1.5 >= 1 ? 'green' : v / 1.5 >= 0.6 ? 'gold' : 'red'}>{v / 1.5 >= 1 ? 'Strong' : v / 1.5 >= 0.6 ? 'Fair' : 'Weak'}</Tag>,
                },
              ]}
            />
            <Divider />
            <Space>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { setOverrideDecision('APPROVE'); setOverrideOpen(true); }}>Approve (override)</Button>
              <Button onClick={() => { setOverrideDecision('REFER'); setOverrideOpen(true); }}>Refer</Button>
              <Button danger icon={<CloseCircleOutlined />} onClick={() => { setOverrideDecision('DECLINE'); setOverrideOpen(true); }}>Decline</Button>
              {selectedLoan && <Typography.Text type="secondary">Loan {selectedLoan.loanNo} · requested {fmtETB(selectedLoan.amount)}</Typography.Text>}
            </Space>
          </Card>
        </>
      )}

      <Modal
        title="Record Officer Decision"
        open={overrideOpen}
        onCancel={() => setOverrideOpen(false)}
        onOk={doOverride}
        okText="Confirm"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="Decision">
            <Select
              value={overrideDecision}
              onChange={setOverrideDecision}
              options={[
                { value: 'APPROVE', label: 'Approve' },
                { value: 'REFER', label: 'Refer to committee' },
                { value: 'DECLINE', label: 'Decline' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Reason" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Reason for overriding the recommendation" />
          </Form.Item>
        </Form>
      </Modal>
    </ProCard>
  );
}
