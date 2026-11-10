import writeXlsxFile from 'write-excel-file/browser';
import type { Cell, CellObject, SheetData } from 'write-excel-file/browser';

export interface ExcelSheet {
  name: string;
  columns: { header: string; key: string; type?: 'string' | 'number' | 'boolean' | 'date' }[];
  rows: Record<string, unknown>[];
}

type ColumnType = NonNullable<ExcelSheet['columns'][number]['type']>;

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(text);
    if (dateOnly) {
      const date = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function toCell(value: unknown, type: ColumnType = 'string'): Cell {
  if (value === null || value === undefined || value === '') return null;
  switch (type) {
    case 'number': {
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return null;
    }
    case 'date': {
      const date = toDate(value);
      return date ? { value: date, type: Date, format: 'yyyy-mm-dd', align: 'center' } : null;
    }
    default:
      return { value: String(value), type: String, format: '@' };
  }
}

function headerCell(header: string, type: ColumnType = 'string'): CellObject {
  return {
    value: header,
    type: String,
    fontWeight: 'bold',
    backgroundColor: '#F2F4F7',
    textColor: '#101828',
    align: type === 'number' ? 'right' : type === 'date' ? 'center' : 'left',
    bottomBorderStyle: 'thin',
    bottomBorderColor: '#D0D5DD',
    wrap: true,
  };
}

function displayLength(value: unknown, type: ColumnType): number {
  if (value === null || value === undefined) return 0;
  if (type === 'date') return 10;
  if (type === 'boolean') return 5;
  return String(value).length;
}

function columnWidth(header: string, type: ColumnType, values: unknown[]): number {
  const longest = values.reduce<number>((max, value) => Math.max(max, displayLength(value, type)), header.length);
  const minimum = type === 'number' ? 14 : type === 'date' ? 12 : type === 'boolean' ? 10 : 10;
  return Math.min(48, Math.max(minimum, longest + 2));
}

function sanitizeSheetName(name: string, index: number, used: Set<string>): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31);
  const base = cleaned || `Sheet ${index + 1}`;
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate.toLowerCase())) {
    const tail = ` (${suffix})`;
    candidate = `${base.slice(0, 31 - tail.length)}${tail}`;
    suffix += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export async function exportExcel(fileName: string, sheets: ExcelSheet[]): Promise<void> {
  const usedNames = new Set<string>();
  const output = sheets.map((sheet, index) => {
    const headerRow = sheet.columns.map((column) => headerCell(column.header, column.type));
    const rows: SheetData = sheet.rows.map((row) =>
      sheet.columns.map((column) => toCell(row[column.key], column.type)),
    );
    const columns = sheet.columns.map((column) => ({
      width: columnWidth(column.header, column.type ?? 'string', sheet.rows.slice(0, 100).map((row) => row[column.key])),
    }));
    return {
      data: [headerRow, ...rows],
      sheet: sanitizeSheetName(sheet.name, index, usedNames),
      columns,
      dateFormat: 'yyyy-mm-dd',
      stickyRowsCount: 1,
    };
  });
  const target = fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  await writeXlsxFile(output).toFile(target);
}
