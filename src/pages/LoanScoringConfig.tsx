import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { ExperimentOutlined, SaveOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { PageHeader } from '../components/PageHeader';
import { CurrencyInput } from '../components/CurrencyInput';
import { api } from '../api/client';
import type { Member } from '../types';
import { fmtETB } from '../utils/format';
import { colors } from '../theme';

interface ScoringFactor {
  id: number;
  code: string;
  name: string;
  weight: number;
  direction: string;
  description?: string;
}
interface ScoringBand { id: number; grade: string; minScore: number; maxScore: number; pdPct: number; interestPct: number }
interface ScoringPolicy { id: number; version: number; name: string; active: boolean; minScoreAutoApprove: number; minScoreRefer: number; maxLoanToSavings: number; baseInterestPct: number; maxAmount: number; notes?: string }
interface PreviewResult { score: number; grade: string; pdPct: number; decision: string; recommendedAmount: number; recommendedTerm: number; narration: string }

export default function LoanScoringConfig() {
  const [policy, setPolicy] = useState<ScoringPolicy | null>(null);
  const [factors, setFactors] = useState<ScoringFactor[]>([]);
  const [bands, setBands] = useState<ScoringBand[]>([]);
  const [versions, setVersions] = useState<ScoringPolicy[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [form] = Form.useForm();
  const [sim] = Form.useForm();

  const load = async () => {
    const res = await api<{ policy: ScoringPolicy; factors: ScoringFactor[]; bands: ScoringBand[]; versions: ScoringPolicy[] }>('/api/loan-scoring/policy').catch(() => null);
    if (res) {
      setPolicy(res.policy);
      setFactors(res.factors);
      setBands(res.bands);
      setVersions(res.versions);
      form.setFieldsValue(res.policy);
    }
  };

  useEffect(() => { load(); api<Member[]>('/api/members').then(setMembers).catch(() => {}); /* eslint-disable-line */ }, []);

  const savePolicy = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api(`/api/loan-scoring/policy/${policy?.id}`, { method: 'PUT', body: JSON.stringify(values) });
      message.success('Policy updated');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveWeight = async (id: number, weight: number) => {
    await api(`/api/loan-scoring/factors/${id}`, { method: 'PUT', body: JSON.stringify({ weight }) });
    message.success('Weight updated');
    await load();
  };

  const runSim = async () => {
    const values = await sim.validateFields();
    try {
      const res = await api<PreviewResult>('/api/loan-scoring/preview', { method: 'POST', body: JSON.stringify(values) });
      setPreview(res);
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const decisionColor: Record<string, string> = { AUTO_APPROVE: 'green', REFER: 'gold', DECLINE: 'red' };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Loan Scoring Configuration"
        subtitle="Tune the explainable scorecard — weights, thresholds, bands — and simulate decisions"
        extra={
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={savePolicy}>Save Policy</Button>
        }
      />

      {policy && (
        <Alert
          type="info"
          showIcon
          message={`Active policy: ${policy.name} (v${policy.version})`}
          description="All changes are effective immediately for new assessments and are suitable for maker–checker review."
        />
      )}

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <Card title="Decision thresholds">
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}><Form.Item label="Auto-approve ≥ score" name="minScoreAutoApprove"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Refer ≥ score" name="minScoreRefer"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Max loan-to-savings" name="maxLoanToSavings"><InputNumber min={1} step={0.5} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={12}><Form.Item label="Base interest %" name="baseInterestPct"><InputNumber min={0} step={0.5} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={24}><Form.Item label="Maximum amount" name="maxAmount"><CurrencyInput style={{ width: '100%' }} min={0} step={10000} /></Form.Item></Col>
              </Row>
            </Form>
          </Card>

          <Card title="Grade bands" style={{ marginTop: 20 }}>
            <Table
              size="small"
              rowKey="grade"
              dataSource={bands}
              pagination={false}
              columns={[
                { title: 'Grade', dataIndex: 'grade', render: (g: string) => <Tag>{g}</Tag> },
                { title: 'Score', render: (_: unknown, r: ScoringBand) => `${r.minScore}–${r.maxScore}` },
                { title: 'PD %', dataIndex: 'pdPct', align: 'right' as const },
                { title: 'Interest %', dataIndex: 'interestPct', align: 'right' as const },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Score factors & weights">
            <Table
              size="small"
              rowKey="id"
              dataSource={factors}
              pagination={false}
              columns={[
                { title: 'Factor', dataIndex: 'name' },
                { title: 'Direction', dataIndex: 'direction', width: 110, render: (d: string) => <Tag color={d === 'POSITIVE' ? 'green' : 'red'}>{d}</Tag> },
                {
                  title: 'Weight', dataIndex: 'weight', width: 140, align: 'right' as const,
                  render: (w: number, r: ScoringFactor) => (
                    <InputNumber
                      size="small"
                      min={0} step={0.1}
                      defaultValue={w}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v !== w) saveWeight(r.id, v);
                      }}
                      style={{ width: 90 }}
                    />
                  ),
                },
              ]}
            />
            <Divider />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Weights are relative. Higher weight = more influence on the final score. This is where a future
              machine-learning job would write learned weights — no engine changes required.
            </Typography.Text>
          </Card>

          <Card title="Simulator" style={{ marginTop: 20 }} extra={<ExperimentOutlined style={{ color: colors.accent }} />}>
            <Form form={sim} layout="vertical">
              <Row gutter={16}>
                <Col span={8}><Form.Item label="Member (optional)" name="memberId"><Select allowClear showSearch optionFilterProp="label" options={members.map((m) => ({ value: Number(m.id), label: `${m.fullName} (${m.memberNo})` }))} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Avg savings" name="savingsAvgBalance" initialValue={120000}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Deposits / month" name="depositFreqMonthly" initialValue={4}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Share capital" name="shareBalance" initialValue={20000}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                <Col span={8}><Form.Item label="On-time %" name="onTimePct" initialValue={100}><InputNumber style={{ width: '100%' }} min={0} max={100} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Arrears days" name="arrearsDays" initialValue={0}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                <Col span={8}><Form.Item label="DTI %" name="dtiPct" initialValue={20}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Tenure (months)" name="tenureMonths" initialValue={24}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                <Col span={8}><Form.Item label="Collateral coverage %" name="collateralCoveragePct" initialValue={60}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
              </Row>
              <Button type="primary" icon={<ExperimentOutlined />} onClick={runSim}>Run simulation</Button>
            </Form>

            {preview && (
              <Card size="small" style={{ marginTop: 16, background: colors.primarySoft, borderColor: 'transparent' }}>
                <Space size={24} wrap>
                  <Statistic title="Score" value={preview.score} />
                  <Statistic title="Grade" value={preview.grade} />
                  <Statistic title="PD %" value={preview.pdPct} />
                  <Statistic title="Limit" value={fmtETB(preview.recommendedAmount)} />
                  <div>
                    <Typography.Text type="secondary">Decision</Typography.Text>
                    <div><Tag color={decisionColor[preview.decision]}>{preview.decision.replace('_', ' ')}</Tag></div>
                  </div>
                </Space>
                <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>{preview.narration}</Typography.Paragraph>
              </Card>
            )}
          </Card>

          {versions.length > 1 && (
            <Card title="Policy versions" style={{ marginTop: 20 }}>
              <Table
                size="small"
                rowKey="id"
                dataSource={versions}
                pagination={false}
                columns={[
                  { title: 'Version', dataIndex: 'version', render: (v: number) => `v${v}` },
                  { title: 'Name', dataIndex: 'name' },
                  { title: 'Active', dataIndex: 'active', render: (a: boolean) => (a ? <Tag color="green">Active</Tag> : '—') },
                ]}
              />
            </Card>
          )}
        </Col>
      </Row>
    </ProCard>
  );
}
