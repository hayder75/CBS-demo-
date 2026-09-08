import { describe, expect, it } from 'vitest';
import { fmtETB, fmtNum, fmtDate } from './format';

describe('fmtETB', () => {
  it('formats with ETB currency and no decimals', () => {
    expect(fmtETB(1245000)).toContain('1,245,000');
  });

  it('handles zero', () => {
    expect(fmtETB(0)).toContain('0');
  });

  it('handles negative amounts', () => {
    expect(fmtETB(-500)).toContain('-');
  });
});

describe('fmtNum', () => {
  it('formats thousands separators with 2 decimals', () => {
    expect(fmtNum(1234.5)).toContain('1,234.5');
  });
});

describe('fmtDate', () => {
  it('formats ISO dates to en-GB', () => {
    expect(fmtDate('2026-09-05')).toBe('05/09/2026');
  });

  it('returns em dash for missing dates', () => {
    expect(fmtDate(undefined)).toBe('—');
    expect(fmtDate('')).toBe('—');
  });
});