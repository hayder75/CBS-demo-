import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChartOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  PrinterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { ExportExcelButton } from '../components/ExportExcelButton';
import { api } from '../api/client';
import type { ReportCatalog, ReportColumn, ReportDefinition, ReportResult } from '../types';
import { fmtETB } from '../utils/format';
import { buildCsv, downloadCsv } from '../utils/csv';
import type { ExcelSheet } from '../utils/excel';
import { colors } from '../theme';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Dormant', label: 'Dormant' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Closed', label: 'Closed' },
];

type RangeValue = [Dayjs | null, Dayjs | null] | null;

function cellValue(col: ReportColumn, value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (col.type === 'MONEY' && typeof value === 'number') return fmtETB(value);
  if (col.type === 'PERCENT' && typeof value === 'number') return `${value}%`;
  if (col.type === 'NUMBER' && typeof value === 'number') return value.toLocaleString();
  return String(value);
}

function excelColumnType(type: ReportColumn['type']): 'string' | 'number' | 'date' {
  if (type === 'DATE') return 'date';
  if (type === 'NUMBER' || type === 'MONEY' || type === 'PERCENT') return 'number';
  return 'string';
}

export default function Reports() {
  const [catalog, setCatalog] = useState<ReportCatalog | null>(null);
  const [category, setCategory] = useState<string>('');
  const [active, setActive] = useState<ReportDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);

  const [range, setRange] = useState<RangeValue>(null);
  const [status, setStatus] = useState<string>();
  const [office, setOffice] = useState<string>();

  useEffect(() => {
    setLoading(true);
    api<ReportCatalog>('/api/reports/catalog')
      .then((c) => {
        setCatalog(c);
        if (c.categories.length) setCategory(c.categories[0].category);
      })
      .catch(() => message.error('Failed to load report catalogue'))
      .finally(() => setLoading(false));
  }, []);

  const reports = useMemo(
    () => catalog?.categories.find((c) => c.category === category)?.reports ?? [],
    [catalog, category],
  );

  const run = async (report: ReportDefinition, withFilters = false) => {
    setActive(report);
    setRunning(true);
    const params = new URLSearchParams({ key: report.key });
    if (withFilters || range) {
      if (range?.[0]) params.set('from', range[0].format('YYYY-MM-DD'));
      if (range?.[1]) params.set('to', range[1].format('YYYY-MM-DD'));
    }
    if (status) params.set('status', status);
    if (office) params.set('office', office);
    try {
      const res = await api<ReportResult>(`/api/reports/run?${params.toString()}`);
      setResult(res);
    } catch {
      setResult(null);
      message.error('Failed to run report');
    } finally {
      setRunning(false);
    }
  };

  const columns: ColumnsType<Record<string, unknown>> = (result?.columns ?? []).map((col) => ({
    title: col.label,
    dataIndex: col.key,
    key: col.key,
    align: col.type === 'MONEY' || col.type === 'NUMBER' || col.type === 'PERCENT' ? 'right' : 'left',
    render: (v: unknown) => cellValue(col, v),
  }));

  const exportCsv = () => {
    if (!result) return;
    const rows = result.rows.map((r) => {
      const out: Record<string, unknown> = {};
      result.columns.forEach((c) => { out[c.label] = r[c.key]; });
      return out;
    });
    downloadCsv(`${result.key.replace(/\//g, '-')}.csv`, buildCsv(rows));
    message.success('Report exported to CSV');
  };

  const reportSheets = (): ExcelSheet[] =>
    result
      ? [
          {
            name: result.name,
            columns: result.columns.map((column) => ({
              header: column.label,
              key: column.key,
              type: excelColumnType(column.type),
            })),
            rows: result.rows,
          },
        ]
      : [];

  const moneySummary = useMemo(() => {
    if (!result) return null;
    return result.columns.filter((c) => c.type === 'MONEY').slice(0, 3).map((c) => ({
      label: c.label,
      total: result.rows.reduce((s, r) => s + (typeof r[c.key] === 'number' ? (r[c.key] as number) : 0), 0),
    }));
  }, [result]);

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader
        title="Reports"
        subtitle="Standard, operational and statutory reports — filter, preview and export"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} disabled={!active} loading={running} onClick={() => active && run(active, true)}>
              Refresh
            </Button>
            <Button icon={<PrinterOutlined />} disabled={!result} onClick={() => window.print()}>
              Print
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} disabled={!result} onClick={exportCsv}>
              Export CSV
            </Button>
            <ExportExcelButton
              fileName={`${result?.key.replace(/\//g, '-') ?? 'report'}.xlsx`}
              sheets={reportSheets}
            />
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={8} xl={8}>
          <StatCard
            title="Available Reports"
            value={catalog?.total ?? 0}
            icon={<FileTextOutlined style={{ color: colors.primary }} />}
            caption="Across all categories"
          />
        </Col>
        <Col xs={24} sm={8} xl={8}>
          <StatCard
            title="Rows in Preview"
            value={result?.total ?? 0}
            icon={<BarChartOutlined style={{ color: colors.info }} />}
            caption={active?.name ?? 'Select a report'}
          />
        </Col>
        <Col xs={24} sm={8} xl={8}>
          <StatCard
            title="Categories"
            value={catalog?.categories.length ?? 0}
            icon={<BarChartOutlined style={{ color: colors.success }} />}
            caption="Operational, financial, regulatory"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={7}>
          <Card title="Report Library" styles={{ body: { paddingTop: 12 } }}>
            {loading ? (
              <Spin />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Select
                  value={category}
                  onChange={setCategory}
                  style={{ width: '100%' }}
                  options={(catalog?.categories ?? []).map((c) => ({ value: c.category, label: c.name }))}
                />
                <Space direction="vertical" style={{ width: '100%' }} size={6}>
                  {reports.map((r) => (
                    <div
                      key={r.key}
                      onClick={() => run(r)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: `1.5px solid ${active?.key === r.key ? colors.primary : colors.border}`,
                        background: active?.key === r.key ? colors.primarySoft : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <Typography.Text strong style={{ fontSize: 13 }}>{r.name}</Typography.Text>
                      <div style={{ fontSize: 11, color: colors.text3 }}>{r.description}</div>
                    </div>
                  ))}
                </Space>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={17}>
          <Card
            title={active ? active.name : 'Report Preview'}
            extra={active && <Tag color="green">{active.key}</Tag>}
            styles={{ body: { minHeight: 360 } }}
          >
            {!active ? (
              <Empty description="Select a report from the library" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Space wrap>
                  {active.params.includes('from') && (
                    <DatePicker.RangePicker
                      value={range}
                      onChange={(v) => setRange(v as RangeValue)}
                      allowEmpty={[true, true]}
                    />
                  )}
                  {active.params.includes('office') && (
                    <Select
                      placeholder="All offices"
                      allowClear
                      value={office}
                      onChange={setOffice}
                      style={{ width: 160 }}
                      options={[{ value: 'HO', label: 'Head Office' }, { value: 'BR1', label: 'Branch 1' }]}
                    />
                  )}
                  {active.params.includes('status') && (
                    <Select
                      placeholder="All statuses"
                      allowClear
                      value={status}
                      onChange={setStatus}
                      style={{ width: 160 }}
                      options={STATUS_OPTIONS}
                    />
                  )}
                  {active.params.includes('asOf') && <Input placeholder="As of date" style={{ width: 140 }} disabled />}
                  <Button type="primary" icon={<PlayCircleOutlined />} loading={running} onClick={() => run(active, true)}>
                    Run
                  </Button>
                </Space>

                {moneySummary && moneySummary.length > 0 && (
                  <Space wrap>
                    {moneySummary.map((m) => (
                      <Card key={m.label} size="small" styles={{ body: { padding: '8px 14px' } }}>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{m.label} total</Typography.Text>
                        <div style={{ fontWeight: 700, color: colors.primaryStrong }}>{fmtETB(m.total)}</div>
                      </Card>
                    ))}
                  </Space>
                )}

                <Table
                  size="small"
                  rowKey={(_, i) => String(i)}
                  loading={running}
                  dataSource={result?.rows ?? []}
                  columns={columns}
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
                  locale={{ emptyText: <Empty description="No data for the selected criteria" /> }}
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </ProCard>
  );
}
