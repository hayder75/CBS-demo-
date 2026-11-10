import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Row, Select, Space, Spin, Tooltip, Typography, message } from 'antd';
import {
  BankOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FundOutlined,
  PrinterOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { ExportExcelButton } from '../components/ExportExcelButton';
import { useMembers } from '../context/MembersContext';
import { api } from '../api/client';
import type { DividendRun, GaResolution, Loan, SavingsProduct, SavingsTransaction } from '../types';
import type { CsvRow } from '../utils/csv';
import type { ExcelSheet } from '../utils/excel';
import { fmtDate, fmtETB, fmtNum } from '../utils/format';
import { downloadCsv, printHtml } from '../utils/print';
import { colors } from '../theme';

type DocType = 'member-statement' | 'loan-schedule' | 'deposit-receipt' | 'ga-dividend' | 'share-register';

interface PrintableDoc {
  title: string;
  subtitle: string;
  bodyHtml: string;
  csvRows: CsvRow[];
  ready: boolean;
  empty: boolean;
  emptyText: string;
}

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'member-statement', label: 'Member Statement' },
  { value: 'loan-schedule', label: 'Loan Schedule' },
  { value: 'deposit-receipt', label: 'Deposit Receipt' },
  { value: 'ga-dividend', label: 'GA Dividend Report' },
  { value: 'share-register', label: 'Share Register' },
];

const previewCss = `
.printable-preview { font-size: 12px; color: #101828; }
.printable-preview table.grid { width: 100%; border-collapse: collapse; font-size: 12px; }
.printable-preview table.grid thead th { background: #0e7a5f; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; border: 1px solid #0a5f4a; }
.printable-preview table.grid tbody td { padding: 7px 10px; border-bottom: 1px solid #eaecf0; }
.printable-preview table.grid tbody tr:nth-child(even) td { background: #fafbfc; }
.printable-preview table.grid tfoot td { padding: 8px 10px; font-weight: 700; border-top: 2px solid #0e7a5f; background: #f0faf6; }
.printable-preview .num { text-align: right; white-space: nowrap; }
.printable-preview table.kv { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
.printable-preview table.kv th { text-align: left; color: #475467; font-weight: 600; padding: 7px 10px; width: 34%; background: #f8fafc; border: 1px solid #eaecf0; }
.printable-preview table.kv td { padding: 7px 10px; border: 1px solid #eaecf0; }
.printable-preview .receipt-amount { margin: 18px 0; padding: 18px 20px; border: 1px dashed #0e7a5f; border-radius: 10px; background: #f0faf6; display: flex; justify-content: space-between; align-items: center; }
.printable-preview .receipt-amount .label { font-size: 12px; color: #475467; font-weight: 600; }
.printable-preview .receipt-amount .value { font-size: 22px; font-weight: 800; color: #0a5f4a; }
.printable-preview .doc-note { margin-top: 14px; font-size: 11px; color: #475467; line-height: 1.6; }
.printable-preview .section-label { margin: 16px 0 8px; font-size: 13px; font-weight: 700; color: #0a5f4a; }
`;

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const r2 = (n: number) => Math.round(n * 100) / 100;
const money = (n: number) => fmtETB(n);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function excelColumnType(key: string, sample: unknown): 'string' | 'number' | 'date' {
  if (typeof sample === 'number') return 'number';
  if (/(date|joined)/i.test(key)) return 'date';
  return 'string';
}

function tableHtml(columns: string[], rows: (string | number)[][], numeric: number[] = [], footer?: (string | number)[]) {
  const head = `<thead><tr>${columns
    .map((c, i) => `<th class="${numeric.includes(i) ? 'num' : ''}">${esc(c)}</th>`)
    .join('')}</tr></thead>`;
  const body = `<tbody>${rows
    .map((row) => `<tr>${row.map((c, i) => `<td class="${numeric.includes(i) ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;
  const foot = footer
    ? `<tfoot><tr>${footer
        .map((c, i) => `<td class="${numeric.includes(i) ? 'num' : ''}">${esc(c)}</td>`)
        .join('')}</tr></tfoot>`
    : '';
  return `<table class="grid">${head}${body}${foot}</table>`;
}

function kvHtml(rows: [string, string][]) {
  return `<table class="kv"><tbody>${rows
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('')}</tbody></table>`;
}

function blank(title: string, subtitle: string, emptyText: string): PrintableDoc {
  return { title, subtitle, bodyHtml: '', csvRows: [], ready: false, empty: true, emptyText };
}

interface LoanScheduleRow {
  period: number;
  dueDate: string;
  principal: number;
  interest: number;
  total: number;
  paid: number;
  balance: number;
}

function buildLoanSchedule(loan: Loan): LoanScheduleRow[] {
  const n = Math.max(1, loan.termMonths);
  const monthlyRate = loan.ratePct / 100 / 12;
  const start = loan.disbursedAt ? new Date(loan.disbursedAt) : new Date();
  const rows: LoanScheduleRow[] = [];
  const reducing = loan.scheduleType === 'Reducing Balance' && monthlyRate > 0;
  const annuity = reducing ? (loan.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n)) : 0;
  const flatPrincipal = loan.amount / n;
  const flatInterest = loan.amount * monthlyRate;
  let balance = loan.amount;
  const paidTotal = loan.principalPaid + loan.interestPaid;
  let cumulative = 0;

  for (let i = 1; i <= n; i += 1) {
    let principal: number;
    let interest: number;
    if (reducing) {
      interest = balance * monthlyRate;
      principal = i === n ? balance : annuity - interest;
    } else {
      principal = flatPrincipal;
      interest = flatInterest;
    }
    principal = r2(Math.max(0, principal));
    interest = r2(Math.max(0, interest));
    balance = r2(Math.max(0, balance - principal));
    const total = r2(principal + interest);
    cumulative = r2(cumulative + total);
    const due = new Date(start);
    due.setMonth(due.getMonth() + i);
    rows.push({
      period: i,
      dueDate: due.toISOString().slice(0, 10),
      principal,
      interest,
      total,
      paid: cumulative <= paidTotal ? total : 0,
      balance,
    });
  }
  return rows;
}

export default function Printables() {
  const { members } = useMembers();
  const [docType, setDocType] = useState<DocType>('member-statement');
  const [memberId, setMemberId] = useState<string>();
  const [loanId, setLoanId] = useState<string>();
  const [txId, setTxId] = useState<string>();
  const [resolutionId, setResolutionId] = useState<string>();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [products, setProducts] = useState<SavingsProduct[]>([]);
  const [resolutions, setResolutions] = useState<GaResolution[]>([]);
  const [dividends, setDividends] = useState<DividendRun[]>([]);
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [baseLoading, setBaseLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setBaseLoading(true);
    Promise.all([
      api<Loan[]>('/api/loans').catch(() => [] as Loan[]),
      api<SavingsProduct[]>('/api/savings/products').catch(() => [] as SavingsProduct[]),
      api<GaResolution[]>('/api/ga-resolutions').catch(() => [] as GaResolution[]),
      api<DividendRun[]>('/api/shares/dividends').catch(() => [] as DividendRun[]),
    ])
      .then(([loanRows, productRows, resolutionRows, dividendRows]) => {
        if (!mounted) return;
        setLoans(loanRows);
        setProducts(productRows);
        setResolutions(resolutionRows);
        setDividends(dividendRows);
      })
      .finally(() => {
        if (mounted) setBaseLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!memberId) {
      setTransactions([]);
      return;
    }
    let mounted = true;
    setTxLoading(true);
    api<SavingsTransaction[]>(`/api/savings/transactions/${memberId}`)
      .then((rows) => {
        if (mounted) setTransactions(rows);
      })
      .catch(() => {
        if (mounted) setTransactions([]);
      })
      .finally(() => {
        if (mounted) setTxLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [memberId]);

  useEffect(() => {
    if (docType !== 'deposit-receipt') return;
    const deposits = transactions.filter((t) => t.type === 'Deposit');
    if (!deposits.some((t) => t.id === txId)) setTxId(deposits[0]?.id);
  }, [docType, transactions, txId]);

  useEffect(() => {
    if (docType === 'loan-schedule' && !loanId) {
      const scoped = memberId ? loans.find((l) => l.memberId === memberId) : undefined;
      if (scoped) setLoanId(scoped.id);
    }
  }, [docType, memberId, loanId, loans]);

  const memberOptions = useMemo(
    () => members.map((m) => ({ value: m.id, label: `${m.memberNo} · ${m.fullName}` })),
    [members],
  );

  const scopedLoans = useMemo(
    () => (memberId ? loans.filter((l) => l.memberId === memberId) : loans),
    [loans, memberId],
  );

  const loanOptions = useMemo(
    () => scopedLoans.map((l) => ({ value: l.id, label: `${l.loanNo} · ${l.memberName} · ${money(l.amount)}` })),
    [scopedLoans],
  );

  const depositOptions = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'Deposit')
        .map((t) => ({ value: t.id, label: `${fmtDate(t.date)} · ${money(t.amount)} · ${t.channel}` })),
    [transactions],
  );

  const resolutionOptions = useMemo(
    () => resolutions.map((r) => ({ value: r.id, label: `${r.ref} · FY${r.year} · ${r.status}` })),
    [resolutions],
  );

  const loading = baseLoading || (!!memberId && txLoading);

  const doc = useMemo<PrintableDoc>(() => {
    switch (docType) {
      case 'member-statement': {
        const member = members.find((m) => m.id === memberId) ?? null;
        if (!member) return blank('Member Statement', 'Select a member to generate a statement', 'No member selected');
        const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;
        const rows = transactions;
        const deposits = sum(rows.filter((t) => t.type === 'Deposit').map((t) => t.amount));
        const withdrawals = sum(
          rows.filter((t) => t.type === 'Withdrawal' || t.type === 'Transfer Out').map((t) => t.amount),
        );
        const body =
          kvHtml([
            ['Member No', member.memberNo],
            ['Full Name', member.fullName],
            ['Phone', member.phone],
            ['Status', member.status],
            ['Share Balance', money(member.shareBalance)],
            ['Savings Balance', money(member.savingsBalance)],
          ]) +
          `<div class="section-label">Transaction Ledger</div>` +
          tableHtml(
            ['Date', 'Product', 'Type', 'Channel', 'Teller', 'Amount'],
            rows.map((t) => [fmtDate(t.date), productName(t.productId), t.type, t.channel, t.teller, money(t.amount)]),
            [5],
            ['', '', '', '', 'Net Movement', money(deposits - withdrawals)],
          );
        return {
          title: `Member Statement — ${member.memberNo}`,
          subtitle: `${member.fullName} · ${rows.length} transactions`,
          bodyHtml: body,
          csvRows: rows.map((t) => ({
            Date: t.date,
            MemberNo: member.memberNo,
            Member: member.fullName,
            Product: productName(t.productId),
            Type: t.type,
            Channel: t.channel,
            Teller: t.teller,
            Amount: t.amount,
          })),
          ready: true,
          empty: rows.length === 0,
          emptyText: 'No savings transactions for this member',
        };
      }

      case 'loan-schedule': {
        const loan = loans.find((l) => l.id === loanId) ?? null;
        if (!loan) return blank('Loan Repayment Schedule', 'Select a loan facility to generate a schedule', 'No loan selected');
        const rows = buildLoanSchedule(loan);
        const body =
          kvHtml([
            ['Loan No', loan.loanNo],
            ['Member', loan.memberName],
            ['Product', loan.productName],
            ['Principal', money(loan.amount)],
            ['Interest Rate', `${loan.ratePct}% p.a.`],
            ['Term', `${loan.termMonths} months · ${loan.scheduleType}`],
            ['Outstanding Balance', money(loan.balance)],
            ['Status', loan.status],
          ]) +
          `<div class="section-label">Installment Schedule</div>` +
          tableHtml(
            ['#', 'Due Date', 'Principal', 'Interest', 'Installment', 'Paid', 'Balance'],
            rows.map((r) => [
              r.period,
              fmtDate(r.dueDate),
              money(r.principal),
              money(r.interest),
              money(r.total),
              r.paid ? money(r.paid) : '—',
              money(r.balance),
            ]),
            [2, 3, 4, 5, 6],
            [
              'Total',
              '',
              money(sum(rows.map((r) => r.principal))),
              money(sum(rows.map((r) => r.interest))),
              money(sum(rows.map((r) => r.total))),
              money(sum(rows.map((r) => r.paid))),
              money(loan.balance),
            ],
          );
        return {
          title: `Loan Schedule — ${loan.loanNo}`,
          subtitle: `${loan.memberName} · ${loan.productName}`,
          bodyHtml: body,
          csvRows: rows.map((r) => ({
            Period: r.period,
            DueDate: r.dueDate,
            LoanNo: loan.loanNo,
            Member: loan.memberName,
            Principal: r.principal,
            Interest: r.interest,
            Installment: r.total,
            Paid: r.paid,
            Balance: r.balance,
          })),
          ready: true,
          empty: rows.length === 0,
          emptyText: 'No schedule could be generated for this loan',
        };
      }

      case 'deposit-receipt': {
        const member = members.find((m) => m.id === memberId) ?? null;
        const tx = transactions.find((t) => t.id === txId) ?? null;
        if (!member || !tx) {
          return blank(
            'Deposit Receipt',
            'Select a member and a deposit transaction to issue a receipt',
            'No deposit selected',
          );
        }
        const productName = products.find((p) => p.id === tx.productId)?.name ?? tx.productId;
        const body =
          `<div class="receipt-amount"><span class="label">Amount Received</span><span class="value">${esc(
            money(tx.amount),
          )}</span></div>` +
          kvHtml([
            ['Receipt No', tx.id.toUpperCase()],
            ['Date', fmtDate(tx.date)],
            ['Member No', member.memberNo],
            ['Member Name', member.fullName],
            ['Product', productName],
            ['Channel', tx.channel],
            ['Received By', tx.teller],
            ['New Savings Balance', money(member.savingsBalance)],
          ]) +
          `<div class="doc-note">This receipt acknowledges the deposit credited to the member's savings account. Retain for your records and present it for any reconciliation enquiry.</div>`;
        return {
          title: `Deposit Receipt — ${tx.id.toUpperCase()}`,
          subtitle: `${member.fullName} · ${fmtDate(tx.date)}`,
          bodyHtml: body,
          csvRows: [
            {
              ReceiptNo: tx.id,
              Date: tx.date,
              MemberNo: member.memberNo,
              Member: member.fullName,
              Product: productName,
              Channel: tx.channel,
              Teller: tx.teller,
              Amount: tx.amount,
            },
          ],
          ready: true,
          empty: false,
          emptyText: '',
        };
      }

      case 'ga-dividend': {
        const resolution = resolutions.find((r) => r.id === resolutionId) ?? null;
        if (!resolution) {
          return blank(
            'GA Dividend Report',
            'Select a General Assembly resolution to generate the report',
            'No resolution selected',
          );
        }
        const declared = dividends.find((d) => d.year === String(resolution.year));
        const perShare = resolution.dividendPerShare || declared?.dividendPerShare || 0;
        const eligible = members.filter((m) => m.shareBalance > 0);
        const rows = eligible.map((m) => [
          m.memberNo,
          m.fullName,
          fmtNum(m.shareBalance),
          money(perShare),
          money(m.shareBalance * perShare),
        ]);
        const totalShares = sum(eligible.map((m) => m.shareBalance));
        const totalDividend = sum(eligible.map((m) => m.shareBalance * perShare));
        const body =
          kvHtml([
            ['Reference', resolution.ref],
            ['Financial Year', String(resolution.year)],
            ['Total Surplus', money(resolution.totalSurplus)],
            ['Dividend Rate', `${resolution.dividendPct}%`],
            ['Reserve Rate', `${resolution.reservePct}%`],
            ['Distributable', money(resolution.distributable)],
            ['Dividend per Share', money(perShare)],
            ['Eligible Members', String(eligible.length)],
            ['Status', resolution.status],
          ]) +
          `<div class="section-label">Projected Member Distribution</div>` +
          tableHtml(
            ['Member No', 'Member', 'Share Base', 'Rate/Share', 'Projected Dividend'],
            rows,
            [2, 3, 4],
            ['', 'Total', fmtNum(totalShares), '', money(totalDividend)],
          ) +
          (declared
            ? `<div class="doc-note">Declared dividend run for FY${declared.year}: ${money(
                declared.totalDistribution,
              )} to ${declared.eligibleMembers} members at ${money(declared.dividendPerShare)} per share (${declared.status}).</div>`
            : '');
        return {
          title: `GA Dividend Report — ${resolution.ref}`,
          subtitle: `FY${resolution.year} · ${eligible.length} eligible members`,
          bodyHtml: body,
          csvRows: eligible.map((m) => ({
            MemberNo: m.memberNo,
            Member: m.fullName,
            ShareBase: m.shareBalance,
            DividendPerShare: perShare,
            ProjectedDividend: r2(m.shareBalance * perShare),
            Year: resolution.year,
            Resolution: resolution.ref,
          })),
          ready: true,
          empty: eligible.length === 0,
          emptyText: 'No members with a share balance for this year',
        };
      }

      case 'share-register':
      default: {
        if (members.length === 0) {
          return blank('Share Register', 'Member share holdings register', 'No members available');
        }
        const scoped = memberId ? members.filter((m) => m.id === memberId) : members;
        const rows = scoped.map((m) => [
          m.memberNo,
          m.fullName,
          m.status,
          fmtDate(m.joinDate),
          fmtNum(m.shareBalance),
          money(m.savingsBalance),
        ]);
        const totalShares = sum(scoped.map((m) => m.shareBalance));
        const totalSavings = sum(scoped.map((m) => m.savingsBalance));
        const body =
          kvHtml([
            ['Scope', memberId ? 'Selected member' : 'All members'],
            ['Members', String(scoped.length)],
            ['Total Share Base', money(totalShares)],
            ['Total Savings', money(totalSavings)],
          ]) +
          tableHtml(
            ['Member No', 'Member', 'Status', 'Joined', 'Share Base', 'Savings'],
            rows,
            [4, 5],
            ['', 'Total', '', '', fmtNum(totalShares), money(totalSavings)],
          );
        return {
          title: 'Share Register',
          subtitle: `${scoped.length} members · ${money(totalShares)} total shares`,
          bodyHtml: body,
          csvRows: scoped.map((m) => ({
            MemberNo: m.memberNo,
            Member: m.fullName,
            Status: m.status,
            Joined: m.joinDate,
            ShareBase: m.shareBalance,
            SavingsBalance: m.savingsBalance,
          })),
          ready: true,
          empty: scoped.length === 0,
          emptyText: 'No members match the current selection',
        };
      }
    }
  }, [docType, memberId, loanId, txId, resolutionId, members, loans, products, transactions, resolutions, dividends]);

  const actionDisabled = loading || !doc.ready;
  const disabledHint = loading ? 'Loading data…' : doc.emptyText || 'Select a record first';

  const handlePrint = () => {
    printHtml(doc.title, doc.bodyHtml);
    message.success('Opening print dialog');
  };

  const handleExport = () => {
    if (doc.csvRows.length === 0) {
      message.warning('No rows available to export');
      return;
    }
    downloadCsv(`${slug(doc.title)}.csv`, doc.csvRows);
    message.success('Document exported to CSV');
  };

  const printableSheets = (): ExcelSheet[] => {
    if (doc.csvRows.length === 0) return [];
    const keys = Array.from(new Set(doc.csvRows.flatMap((row) => Object.keys(row))));
    return [
      {
        name: doc.title,
        columns: keys.map((key) => {
          const sample = doc.csvRows.find((row) => row[key] !== null && row[key] !== undefined)?.[key];
          return { header: key, key, type: excelColumnType(key, sample) };
        }),
        rows: doc.csvRows,
      },
    ];
  };

  const showMemberSelect = docType === 'member-statement' || docType === 'deposit-receipt' || docType === 'share-register';
  const showLoanSelect = docType === 'loan-schedule';
  const showTxSelect = docType === 'deposit-receipt';
  const showResolutionSelect = docType === 'ga-dividend';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Printables & Exports"
        subtitle="Generate statements, schedules, receipts and registers for print or CSV export"
        extra={
          <Space>
            <Tooltip title={actionDisabled ? disabledHint : 'Open a printable A4 preview'}>
              <span>
                <Button type="primary" icon={<PrinterOutlined />} disabled={actionDisabled} onClick={handlePrint}>
                  Print / PDF
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={actionDisabled ? disabledHint : 'Download the underlying rows'}>
              <span>
                <Button icon={<DownloadOutlined />} disabled={actionDisabled} onClick={handleExport}>
                  Export CSV
                </Button>
              </span>
            </Tooltip>
            <ExportExcelButton fileName={`${slug(doc.title)}.xlsx`} sheets={printableSheets} disabled={loading} />
          </Space>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Document Types"
            value={DOC_TYPES.length}
            icon={<FileTextOutlined style={{ color: colors.primary }} />}
            caption="A4 print-ready layouts"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Members"
            value={members.length}
            icon={<TeamOutlined style={{ color: colors.info }} />}
            caption="Statement & register scope"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Loan Facilities"
            value={loans.length}
            icon={<BankOutlined style={{ color: colors.success }} />}
            caption="Repayment schedules"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="GA Resolutions"
            value={resolutions.length}
            icon={<FundOutlined style={{ color: colors.accent }} />}
            caption="Dividend distributions"
          />
        </Col>
      </Row>

      <Card title="Document Builder">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Typography.Text type="secondary">Document Type</Typography.Text>
            <Select<DocType>
              style={{ width: '100%', marginTop: 6 }}
              value={docType}
              options={DOC_TYPES}
              onChange={(value) => setDocType(value)}
            />
          </Col>

          {showMemberSelect && (
            <Col xs={24} md={8}>
              <Typography.Text type="secondary">
                Member {docType === 'share-register' ? '(optional — leave blank for all)' : ''}
              </Typography.Text>
              <Select<string>
                style={{ width: '100%', marginTop: 6 }}
                placeholder="Select member"
                allowClear={docType === 'share-register'}
                showSearch
                optionFilterProp="label"
                value={memberId}
                options={memberOptions}
                onChange={(value) => setMemberId(value)}
              />
            </Col>
          )}

          {(showLoanSelect || showTxSelect) && (
            <Col xs={24} md={8}>
              <Typography.Text type="secondary">Member Filter</Typography.Text>
              <Select<string>
                style={{ width: '100%', marginTop: 6 }}
                placeholder="All members"
                allowClear
                showSearch
                optionFilterProp="label"
                value={memberId}
                options={memberOptions}
                onChange={(value) => {
                  setMemberId(value);
                  setLoanId(undefined);
                  setTxId(undefined);
                }}
              />
            </Col>
          )}

          {showLoanSelect && (
            <Col xs={24} md={8}>
              <Typography.Text type="secondary">Loan Facility</Typography.Text>
              <Select<string>
                style={{ width: '100%', marginTop: 6 }}
                placeholder={scopedLoans.length ? 'Select loan' : 'No loans for selection'}
                showSearch
                optionFilterProp="label"
                value={loanId}
                options={loanOptions}
                onChange={(value) => setLoanId(value)}
              />
            </Col>
          )}

          {showTxSelect && (
            <Col xs={24} md={8}>
              <Typography.Text type="secondary">Deposit Transaction</Typography.Text>
              <Select<string>
                style={{ width: '100%', marginTop: 6 }}
                placeholder={depositOptions.length ? 'Select deposit' : 'No deposits for selection'}
                showSearch
                optionFilterProp="label"
                value={txId}
                options={depositOptions}
                onChange={(value) => setTxId(value)}
              />
            </Col>
          )}

          {showResolutionSelect && (
            <Col xs={24} md={8}>
              <Typography.Text type="secondary">GA Resolution</Typography.Text>
              <Select<string>
                style={{ width: '100%', marginTop: 6 }}
                placeholder={resolutionOptions.length ? 'Select resolution' : 'No resolutions available'}
                value={resolutionId}
                options={resolutionOptions}
                onChange={(value) => setResolutionId(value)}
              />
            </Col>
          )}
        </Row>
      </Card>

      <Card title={`${doc.title} — Preview`}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Spin tip="Loading document data…">
              <div style={{ minHeight: 80 }} />
            </Spin>
          </div>
        ) : !doc.ready ? (
          <Empty description={doc.emptyText} />
        ) : doc.empty ? (
          <Empty description={doc.emptyText || 'No records found for this selection'} />
        ) : (
          <>
            <style>{previewCss}</style>
            <div
              className="printable-preview"
              style={{
                background: '#fff',
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: 20,
                overflowX: 'auto',
              }}
            >
              <div style={{ fontSize: 11, color: colors.text3, marginBottom: 12 }}>
                {doc.subtitle}
              </div>
              <div dangerouslySetInnerHTML={{ __html: doc.bodyHtml }} />
            </div>
          </>
        )}
      </Card>
    </Space>
  );
}
