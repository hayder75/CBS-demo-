import { useState } from 'react';
import { Button, Card, Col, Empty, Input, List, Row, Segmented, Space, Spin, Tag, Typography, message } from 'antd';
import { FileSearchOutlined, SearchOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { PageHeader } from '../components/PageHeader';
import { api } from '../api/client';
import { colors } from '../theme';

interface SearchHit {
  title: string;
  subtitle: string;
  detail: string;
  ref: string;
}

interface SearchResponse {
  type: string;
  query: string;
  count: number;
  results: SearchHit[];
}

const TYPES = ['Customer', 'Account', 'Share', 'GL', 'Document', 'Transaction', 'Loan'];

export default function Search() {
  const [type, setType] = useState('Customer');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);

  const run = async (nextType = type, query = q) => {
    setLoading(true);
    try {
      const res = await api<SearchResponse>(`/api/search?type=${encodeURIComponent(nextType)}&q=${encodeURIComponent(query)}`);
      setData(res);
    } catch {
      message.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProCard ghost direction="column" gutter={[20, 20]}>
      <PageHeader title="Search" subtitle="Find customers, accounts, shares, GL accounts, documents, transactions and loans" />

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Segmented options={TYPES} value={type} onChange={(v) => { const t = String(v); setType(t); run(t, q); }} />
          <Input.Search
            allowClear
            size="large"
            placeholder={`Search ${type.toLowerCase()}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onSearch={(v) => run(type, v)}
            enterButton={<Button type="primary" icon={<SearchOutlined />}>Search</Button>}
          />
        </Space>
      </Card>

      <Row gutter={[20, 20]}>
        <Col span={24}>
          <Card title={data ? `${data.count} result${data.count === 1 ? '' : 's'} · ${data.type}` : 'Results'}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : !data ? (
              <Empty description="Enter a term and search" />
            ) : data.results.length === 0 ? (
              <Empty description="No matches found" />
            ) : (
              <List
                dataSource={data.results}
                pagination={{ pageSize: 12, showSizeChanger: false }}
                renderItem={(r) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<FileSearchOutlined style={{ fontSize: 18, color: colors.primary }} />}
                      title={<Space><Typography.Text strong>{r.title}</Typography.Text><Tag>{r.subtitle}</Tag></Space>}
                      description={r.detail}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{r.ref}</Typography.Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </ProCard>
  );
}
