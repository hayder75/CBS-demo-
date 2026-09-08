export type CsvRow = Record<string, unknown>;

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