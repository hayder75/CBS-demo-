import { describe, expect, it } from 'vitest';
import { buildCsv } from './csv';

describe('buildCsv', () => {
  it('produces header row and quoted values', () => {
    const rows = [
      { name: 'Abebe Bekele', amount: 1200, ok: true },
      { name: 'Meseret Alemu', amount: 2400, ok: false },
    ];
    const csv = buildCsv(rows);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('name,amount,ok');
    expect(lines[1]).toBe('"Abebe Bekele",1200,true');
    expect(lines[2]).toBe('"Meseret Alemu",2400,false');
  });

  it('escapes commas inside quoted strings', () => {
    const csv = buildCsv([{ desc: 'Fuel, generator' }]);
    expect(csv).toContain('"Fuel, generator"');
  });

  it('handles missing fields as empty strings', () => {
    const csv = buildCsv([{ a: 1, b: 2 }, { a: 3 }]);
    expect(csv.split('\n')[1]).toBe('1,2');
    expect(csv.split('\n')[2]).toBe('3,""');
  });

  it('returns empty string for no data', () => {
    expect(buildCsv([])).toBe('');
  });
});