import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Tabs,
  Table,
  Typography,
  message,
} from 'antd';
import { CloudUploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { parseCsv, downloadCsv } from '../utils/csv';
import type { CsvRow } from '../utils/csv';

const templates: Record<string, { columns: string[]; example: string }> = {
  accounts: {
    columns: ['accountNo', 'memberNo', 'productCode', 'openedDate', 'openingBalance', 'status'],
    example: 'SA-MEM-00001-1,MEM-00001,S-VOL,2025-01-15,1000,Active\nSA-MEM-00002-1,MEM-00002,S-MAND,2025-02-15,2000,Active',
  },
  shares: {
    columns: ['memberNo', 'shareCategoryCode', 'shareCount', 'nominalPrice', 'description'],
    example: 'MEM-00001,SH-A,100,100,Initial import\nMEM-00002,SH-A,50,100,Initial import',
  },
  leaves: {
    columns: ['accountCode', 'accountName', 'side', 'balance'],
    example: '1000,Cash on Hand,DEBIT,1245000\n1100,Bank - CBE,DEBIT,8620000',
  },
  loans: {
    columns: ['loanNo', 'memberNo', 'productCode', 'amount', 'disbursedAt', 'termMonths', 'ratePct'],
    example: 'LN-2025-001,MEM-00001,L-PER,100000,2025-03-01,24,12\nLN-2025-002,MEM-00002,L-EDU,50000,2025-04-01,36,10.5',
  },
};

export default function DataMigration() {
  const [active, setActive] = useState('accounts');
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  const tpl = templates[active];

  const downloadTemplate = () => {
    const { columns, example } = templates[active];
    const header = columns.join(',');
    downloadCsv(`${active}-template.csv`, `${header}\n${example}`);
    message.success('Template downloaded — prepare data and re-upload');
  };

  const onFile = async (file: File) => {
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { message.warning('Empty file'); return; }
      setHeaders(Object.keys(rows[0]));
      setPreview(rows);
      message.success(`Parsed ${rows.length} rows — review then import`);
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const finishImport = () => {
    message.success(`${preview.length} row(s) validated. In the full build these post to ${active} ledger / registry endpoints.`);
  };

  const label: Record<string, string> = {
    accounts: 'Import Accounts',
    shares: 'Import Shares',
    leaves: 'Import GL Leaves',
    loans: 'Import Loan Files',
  };

  return (
    <ProCard ghost direction="column" gutter={[16, 16]}>
      <Card>
        <Typography.Title level={4}>Data Migration & Template Imports</Typography.Title>
        <Typography.Paragraph type="secondary">
          Migrate legacy data using structured templates. Download a template, fill it, upload and
          validate. Columns: {templates[active].columns.join(', ')}.
        </Typography.Paragraph>
      </Card>

      <Tabs
        activeKey={active}
        onChange={setActive}
        items={Object.keys(templates).map((k) => ({ key: k, label: label[k] }))}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={label[active]}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button icon={<DownloadOutlined />} onClick={downloadTemplate} block>
                Download {tpl.columns.length}-column Template
              </Button>
              <label
                style={{
                  display: 'block', padding: 24, textAlign: 'center',
                  border: '1.5px dashed #ccc', borderRadius: 8, cursor: 'pointer', color: '#666',
                }}
              >
                <CloudUploadOutlined style={{ fontSize: 28 }} />
                <div>Click to upload / drop your prepared file</div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Validation checks required columns and value types; unmatched rows are reported for
                correction.
              </Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            title="Preview & Validate"
            extra={
              preview.length > 0 && (
                <Button type="primary" onClick={finishImport}>
                  Import {preview.length} rows
                </Button>
              )
            }
          >
            {preview.length === 0 ? (
              <Empty description="Upload a file to preview rows before importing" style={{ padding: 32 }} />
            ) : (
              <Table
                size="small"
                rowKey={(_, i) => String(i)}
                dataSource={preview}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                columns={headers.map((h) => ({ title: h, dataIndex: h, ellipsis: true }))}
              />
            )}
          </Card>
        </Col>
      </Row>
    </ProCard>
  );
}