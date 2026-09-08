import { useState } from 'react';
import { Button, Card, Col, Row, Space, Table, Tag, Typography, message } from 'antd';
import { BarChartOutlined, DownloadOutlined, FileTextOutlined, FundOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { reportRows } from '../mocks/handlers';
import { fmtETB } from '../utils/format';
import { buildCsv, downloadCsv, type CsvRow } from '../utils/csv';

const reports = [
  { key: 'members', name: 'Member Registry', desc: 'Member records, status, shares, savings', icon: <FileTextOutlined /> },
  { key: 'loans', name: 'Loan Portfolio', desc: 'Disbursements, balances, overdue, classification', icon: <FundOutlined /> },
  { key: 'approvals', name: 'Approvals Log', desc: 'Maker-checker activity and decisions', icon: <BarChartOutlined /> },
  { key: 'tills', name: 'Teller & Vault Position', desc: 'Till balances, variance, cash movements', icon: <BarChartOutlined /> },
  { key: 'dividend', name: 'Dividend History', desc: 'Declared dividends by financial year', icon: <FundOutlined /> },
];

export default function Reports() {
  const [active, setActive] = useState<string>('members');

  const download = () => {
    const data = (reportRows as Record<string, unknown[]>)[active] ?? [];
    downloadCsv(`${active}-report.csv`, buildCsv(data as CsvRow[]));
    message.success('Report exported to CSV');
  };

  const data = (reportRows as Record<string, unknown[]>)[active] ?? [];
  const headers = data.length ? Object.keys(data[0] as object) : [];

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Report Library">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {reports.map((r) => (
                <div
                  key={r.key}
                  onClick={() => setActive(r.key)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1.5px solid ${active === r.key ? '#0e7a5f' : '#eee'}`,
                    background: active === r.key ? '#f0faf6' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ color: active === r.key ? '#0e7a5f' : '#999' }}>{r.icon}</span>
                  <div>
                    <Typography.Text strong>{r.name}</Typography.Text>
                    <div style={{ fontSize: 11, color: '#999' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            title={`${reports.find((r) => r.key === active)?.name ?? ''} — Preview`}
            extra={
              <Button icon={<DownloadOutlined />} onClick={download}>
                Export CSV
              </Button>
            }
          >
            <Table
              size="small"
              rowKey={(_, i) => String(i)}
              dataSource={data}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              columns={headers.map((h) => ({
                title: h,
                dataIndex: h,
                align: typeof data[0]?.[h as keyof object] === 'number' ? ('right' as const) : undefined,
                render: (v: unknown) =>
                  typeof v === 'number' && ['amount', 'balance', 'opening', 'closing', 'expected', 'valuation'].some((k) => h.toLowerCase().includes(k))
                    ? fmtETB(v)
                    : typeof v === 'number' && ['overdue', 'shares', 'eligibleMembers'].some((k) => h.toLowerCase().includes(k))
                      ? String(v)
                      : String(v ?? '—'),
              }))}
            />
          </Card>
        </Col>
      </Row>
      <Card>
        <Space wrap>
          <Tag color="blue">Trial Balance</Tag>
          <Tag color="blue">Balance Sheet</Tag>
          <Tag color="blue">Income Statement</Tag>
          <Tag color="blue">PAR & Loan Aging</Tag>
          <Tag color="blue">Check-Off Reconciliation</Tag>
          <Tag color="blue">Audit Trail</Tag>
          <Typography.Text type="secondary">Full report package per proposal §14</Typography.Text>
        </Space>
      </Card>
    </ProCard>
  );
}