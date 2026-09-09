export type CsvRow = Record<string, unknown>;

export function parseCsv(text: string): CsvRow[] {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const num = (s: string) => {
    const t = s.trim().replace(/^"|"$/g, '');
    return t !== '' && !Number.isNaN(Number(t)) ? Number(t) : t;
  };
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      const v = cells[i] ?? '';
      row[h] = v === '' ? null : num(v);
    });
    return row;
  });
}

export function buildCsv(data: CsvRow[]): string {
  const headers = data.length ? Object.keys(data[0]) : [];
  return [
    headers.join(','),
    ...data.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(','),
    ),
  ].join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}