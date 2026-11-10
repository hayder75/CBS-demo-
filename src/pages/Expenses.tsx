import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TagsOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { api } from '../api/client';
import type { ExpenseCategory, ExpenseEntry } from '../types';
import { fmtETB, fmtDate } from '../utils/format';
import { colors } from '../theme';

const categoryStatusColor: Record<ExpenseCategory['status'], string> = {
  Pending: 'gold',
  Verified: 'green',
};

const entryStatusColor: Record<ExpenseEntry['status'], string> = {
  Posted: 'green',
  Reversed: 'red',
};

const paymentModes = ['Cash', 'Bank Transfer', 'Check', 'Digital'] as const;

export default function Expenses() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [categoryForm] = Form.useForm();
  const [entryForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [c, e] = await Promise.all([
        api<ExpenseCategory[]>('/api/expenses/categories'),
        api<ExpenseEntry[]>('/api/expenses'),
      ]);
      setCategories(c);
      setEntries(e);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const verifiedCategories = useMemo(
    () => categories.filter((c) => c.status === 'Verified'),
    [categories],
  );

  const summary = useMemo(() => {
    const posted = entries.filter((e) => e.status === 'Posted');
    const now = dayjs();
    return {
      total: posted.reduce((s, e) => s + e.amount, 0),
      thisMonth: posted
        .filter((e) => dayjs(e.date).isSame(now, 'month'))
        .reduce((s, e) => s + e.amount, 0),
      categories: categories.length,
      entries: entries.length,
    };
  }, [categories, entries]);

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          e.description.toLowerCase().includes(q) ||
          e.categoryName.toLowerCase().includes(q) ||
          e.postedBy.toLowerCase().includes(q) ||
          e.paymentMode.toLowerCase().includes(q);
        return matchesSearch && (!categoryFilter || e.categoryId === categoryFilter);
      }),
    [entries, search, categoryFilter],
  );

  const openCategory = () => {
    categoryForm.resetFields();
    setCategoryOpen(true);
  };

  const addCategory = async () => {
    const values = await categoryForm.validateFields();
    setSavingCategory(true);
    try {
      await api<ExpenseCategory>('/api/expenses/categories', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setCategoryOpen(false);
      categoryForm.resetFields();
      message.success('Expense category created — pending verification');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSavingCategory(false);
    }
  };

  const verifyCategory = async (category: ExpenseCategory) => {
    setVerifyingId(category.id);
    try {
      await api(`/api/expenses/categories/${category.id}/verify`, { method: 'POST' });
      message.success(`${category.name} verified`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setVerifyingId(null);
    }
  };

  const openEntry = () => {
    entryForm.resetFields();
    entryForm.setFieldsValue({ date: dayjs(), paymentMode: 'Cash' });
    setEntryOpen(true);
  };

  const postExpense = async () => {
    const values = await entryForm.validateFields();
    setSavingEntry(true);
    try {
      const created = await api<ExpenseEntry>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
        }),
      });
      setEntryOpen(false);
      entryForm.resetFields();
      message.success(`Expense of ${fmtETB(created.amount)} posted`);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSavingEntry(false);
    }
  };

  const reverseEntry = async (entry: ExpenseEntry) => {
    setReversingId(entry.id);
    try {
      await api(`/api/expenses/${entry.id}/reverse`, { method: 'POST' });
      message.success('Expense reversed');
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setReversingId(null);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Expenses"
        subtitle="Expense categories, GL mapping and posting with reversal control"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => load()}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openEntry}>
              Post Expense
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Total Expenses"
            value={fmtETB(summary.total)}
            icon={<DollarOutlined style={{ color: colors.primary }} />}
            caption="Posted entries only"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="This Month"
            value={fmtETB(summary.thisMonth)}
            icon={<FileTextOutlined style={{ color: colors.info }} />}
            caption="Posted this month"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Categories"
            value={summary.categories}
            icon={<TagsOutlined style={{ color: colors.accent }} />}
            caption={`${verifiedCategories.length} verified`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Entries"
            value={summary.entries}
            icon={<CheckCircleOutlined style={{ color: colors.success }} />}
            caption="All postings"
          />
        </Col>
      </Row>

      <Card
        title="Expense Categories"
        extra={
          <Button icon={<PlusOutlined />} onClick={openCategory}>
            New Category
          </Button>
        }
      >
        <Table<ExpenseCategory>
          rowKey="id"
          loading={loading}
          dataSource={categories}
          locale={{ emptyText: <Empty description="No expense categories yet" /> }}
          pagination={false}
          scroll={{ x: 720 }}
          columns={[
            { title: 'Code', dataIndex: 'code', width: 140 },
            { title: 'Name', dataIndex: 'name', ellipsis: true },
            { title: 'GL Account', dataIndex: 'glAccountCode', width: 130 },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 130,
              render: (s: ExpenseCategory['status']) => <Tag color={categoryStatusColor[s]}>{s}</Tag>,
            },
            {
              title: 'Action',
              key: 'action',
              width: 130,
              render: (_, r) =>
                r.status === 'Pending' ? (
                  <Popconfirm
                    title="Verify this category?"
                    description="Only verified categories can be selected when posting expenses."
                    onConfirm={() => verifyCategory(r)}
                  >
                    <Button
                      size="small"
                      type="link"
                      icon={<CheckCircleOutlined />}
                      loading={verifyingId === r.id}
                    >
                      Verify
                    </Button>
                  </Popconfirm>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                ),
            },
          ]}
        />
      </Card>

      <Card
        title="Expense Postings"
        extra={
          <Space>
            <Input
              placeholder="Search description, category or user"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 260 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              placeholder="Category"
              allowClear
              style={{ width: 200 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Space>
        }
      >
        <Table<ExpenseEntry>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          locale={{ emptyText: <Empty description="No expense postings found" /> }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1080 }}
          columns={[
            { title: 'Date', dataIndex: 'date', width: 120, render: fmtDate },
            { title: 'Category', dataIndex: 'categoryName', width: 170, ellipsis: true },
            { title: 'Description', dataIndex: 'description', ellipsis: true },
            { title: 'Amount', dataIndex: 'amount', align: 'right', width: 130, render: (v) => fmtETB(v) },
            { title: 'Payment Mode', dataIndex: 'paymentMode', width: 130 },
            { title: 'GL', dataIndex: 'glAccountCode', width: 90 },
            { title: 'Posted By', dataIndex: 'postedBy', width: 140, ellipsis: true },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 110,
              render: (s: ExpenseEntry['status']) => <Tag color={entryStatusColor[s]}>{s}</Tag>,
            },
            {
              title: 'Action',
              key: 'action',
              fixed: 'right',
              width: 120,
              render: (_, r) =>
                r.status === 'Posted' ? (
                  <Popconfirm
                    title="Reverse this expense?"
                    description="The reversal will be recorded against the original posting."
                    onConfirm={() => reverseEntry(r)}
                  >
                    <Button
                      size="small"
                      type="link"
                      danger
                      icon={<UndoOutlined />}
                      loading={reversingId === r.id}
                    >
                      Reverse
                    </Button>
                  </Popconfirm>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                ),
            },
          ]}
        />
      </Card>

      <Modal
        title="New Expense Category"
        open={categoryOpen}
        onCancel={() => setCategoryOpen(false)}
        onOk={addCategory}
        okText="Create Category"
        confirmLoading={savingCategory}
        width={520}
        destroyOnHidden
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Code"
            name="code"
            rules={[{ required: true, message: 'Category code required' }]}
          >
            <Input placeholder="e.g. EXP-TRAVEL" />
          </Form.Item>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Category name required' }]}
          >
            <Input placeholder="e.g. Travel & Transport" />
          </Form.Item>
          <Form.Item
            label="GL Account Code"
            name="glAccountCode"
            rules={[{ required: true, message: 'GL account code required' }]}
          >
            <Input placeholder="e.g. 3200" />
          </Form.Item>
          <Typography.Text type="secondary">
            Categories are created as Pending and must be verified before they can be used for postings.
          </Typography.Text>
        </Form>
      </Modal>

      <Modal
        title="Post Expense"
        open={entryOpen}
        onCancel={() => setEntryOpen(false)}
        onOk={postExpense}
        okText="Post Expense"
        confirmLoading={savingEntry}
        width={560}
        destroyOnHidden
      >
        <Form form={entryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Category"
            name="categoryId"
            rules={[{ required: true, message: 'Verified category required' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select a verified expense category"
              options={verifiedCategories.map((c) => ({
                label: `${c.code} — ${c.name} (GL ${c.glAccountCode})`,
                value: c.id,
              }))}
              notFoundContent="No verified categories available"
            />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, whitespace: true, message: 'Description required' }]}
          >
            <Input placeholder="e.g. October office rent" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Amount (ETB)"
                name="amount"
                rules={[{ required: true, message: 'Amount required' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0.01} step={100} placeholder="e.g. 15000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Payment Mode"
                name="paymentMode"
                rules={[{ required: true, message: 'Payment mode required' }]}
              >
                <Select options={paymentModes.map((m) => ({ label: m, value: m }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Date" name="date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="GL Account">
                <Input value="From selected category" disabled />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary">
            The GL account is inherited from the selected category. Posting increases the expense account
            balance immediately and can be reversed while still Posted.
          </Typography.Text>
        </Form>
      </Modal>
    </div>
  );
}
