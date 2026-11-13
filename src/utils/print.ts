import { buildCsv, type CsvRow } from './csv';

const COMPANY_NAME = 'Anchor Financials';
const COMPANY_SUB = 'Community-Based Savings & Credit Cooperative · Addis Ababa, Ethiopia';

function makeRef(prefix: string) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}-${stamp}-${rand}`;
}

const STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #101828;
    padding: 32px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { max-width: 794px; margin: 0 auto; }
  .doc-head {
    display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
    border-bottom: 3px solid #0e7a5f; padding-bottom: 14px;
  }
  .brand { display: flex; gap: 12px; align-items: center; }
  .crest {
    width: 46px; height: 46px; border-radius: 11px; flex: 0 0 auto;
    background: linear-gradient(135deg, #0e7a5f 0%, #0a5f4a 100%);
    color: #ffffff; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 20px; letter-spacing: 0.5px;
  }
  .brand-name { font-size: 19px; font-weight: 800; color: #0a5f4a; line-height: 1.2; }
  .brand-sub { font-size: 10.5px; color: #475467; margin-top: 3px; }
  .doc-meta { text-align: right; font-size: 10.5px; color: #475467; line-height: 1.6; white-space: nowrap; }
  .doc-meta .ref { display: block; font-size: 12px; font-weight: 700; color: #101828; }
  .doc-title { margin: 22px 0 4px; font-size: 17px; font-weight: 700; color: #101828; }
  .doc-sub { font-size: 11.5px; color: #475467; margin-bottom: 16px; }
  .doc-body { font-size: 11.5px; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 11px; }
  table.grid thead th {
    background: #0e7a5f; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 600;
    border: 1px solid #0a5f4a;
  }
  table.grid tbody td { padding: 7px 10px; border-bottom: 1px solid #eaecf0; vertical-align: top; }
  table.grid tbody tr:nth-child(even) td { background: #fafbfc; }
  table.grid tfoot td { padding: 8px 10px; font-weight: 700; border-top: 2px solid #0e7a5f; background: #f0faf6; }
  .num { text-align: right; white-space: nowrap; }
  table.kv { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 16px; }
  table.kv th {
    text-align: left; color: #475467; font-weight: 600; padding: 7px 10px; width: 34%;
    background: #f8fafc; border: 1px solid #eaecf0;
  }
  table.kv td { padding: 7px 10px; border: 1px solid #eaecf0; }
  .receipt-amount {
    margin: 18px 0; padding: 18px 20px; border: 1px dashed #0e7a5f; border-radius: 10px;
    background: #f0faf6; display: flex; justify-content: space-between; align-items: center;
  }
  .receipt-amount .label { font-size: 12px; color: #475467; font-weight: 600; }
  .receipt-amount .value { font-size: 22px; font-weight: 800; color: #0a5f4a; }
  .doc-note { margin-top: 14px; font-size: 10.5px; color: #475467; line-height: 1.6; }
  .sign { margin-top: 46px; display: flex; justify-content: space-between; gap: 40px; }
  .sign div { flex: 1; border-top: 1px solid #98a2b3; padding-top: 6px; font-size: 10.5px; color: #475467; }
  .doc-foot {
    margin-top: 30px; border-top: 1px solid #eaecf0; padding-top: 12px;
    display: flex; justify-content: space-between; gap: 16px; font-size: 10px; color: #98a2b3;
  }
  @media print {
    body { padding: 0; }
    .sheet { max-width: none; }
    table.grid { page-break-inside: auto; }
    table.grid tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
  }
  @page { size: A4; margin: 14mm; }
`;

function buildHtml(title: string, ref: string, bodyHtml: string) {
  const generatedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="sheet">
  <div class="doc-head">
    <div class="brand">
      <div class="crest">CBS</div>
      <div>
        <div class="brand-name">${COMPANY_NAME}</div>
        <div class="brand-sub">${COMPANY_SUB}</div>
      </div>
    </div>
    <div class="doc-meta">
      <span class="ref">Ref: ${ref}</span>
      <span>Date: ${generatedAt}</span>
    </div>
  </div>
  <div class="doc-title">${title}</div>
  <div class="doc-body">${bodyHtml}</div>
  <div class="sign">
    <div>Prepared By</div>
    <div>Checked / Authorized By</div>
  </div>
  <div class="doc-foot">
    <span>${COMPANY_NAME} · This document is system-generated and valid without alteration.</span>
    <span>Ref ${ref} · Page <span class="page-num"></span></span>
  </div>
</div>
<script>window.addEventListener('load', function () { var n = document.querySelector('.page-num'); if (n) n.textContent = '1'; });</script>
</body>
</html>`;
}

export function downloadCsv(filename: string, rows: CsvRow[] = []) {
  const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printHtml(title: string, bodyHtml: string) {
  const ref = makeRef('PRN');
  const html = buildHtml(title, ref, bodyHtml);

  const win = window.open('', '_blank', 'width=880,height=1180');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    window.setTimeout(() => {
      win.print();
    }, 350);
    return;
  }

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1500);
  }, 350);
}
