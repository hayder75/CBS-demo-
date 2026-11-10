import { delay, http, HttpResponse } from 'msw';
import type { AuditTrailEntry } from '../../types';

type AuditSeed = Omit<AuditTrailEntry, 'hash' | 'prevHash'>;

interface VerifyResult {
  valid: boolean;
  checked: number;
  brokenAt?: string;
}

const GENESIS = 'GENESIS';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const hex8 = (n: number) => (n >>> 0).toString(16).padStart(8, '0');

const mockHash = (input: string): string => {
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  let c = 0x85ebca6b;
  let d = 0xc2b2ae35;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    a = Math.imul(a ^ code, 16777619);
    b = Math.imul(b ^ code, 2246822519);
    c = Math.imul(c ^ code, 3266489917);
    d = Math.imul(d ^ code, 668265263);
  }
  return hex8(a) + hex8(b) + hex8(c) + hex8(d);
};

const payloadOf = (entry: AuditSeed): string =>
  [
    entry.actor,
    entry.action,
    entry.entity,
    entry.entityId,
    entry.field ?? '',
    entry.oldValue ?? '',
    entry.newValue ?? '',
    entry.detail ?? '',
    entry.ip ?? '',
    entry.occurredAt,
  ].join('|');

const seeds: AuditSeed[] = [
  {
    id: 'aud-001', actor: 'Workineh Tola', action: 'CREATE', entity: 'User', entityId: 'u-14',
    detail: 'Created user account kaleab.desta with role TELLER', ip: '10.10.4.21', occurredAt: '2026-10-28T08:12:00.000Z',
  },
  {
    id: 'aud-002', actor: 'Workineh Tola', action: 'UPDATE', entity: 'User', entityId: 'u-12',
    field: 'status', oldValue: 'Active', newValue: 'Suspended', detail: 'Suspended user after repeated failed logins',
    ip: '10.10.4.21', occurredAt: '2026-10-28T08:45:00.000Z',
  },
  {
    id: 'aud-003', actor: 'Kaleab Desta', action: 'CREATE', entity: 'Member', entityId: 'm-1042',
    detail: 'Registered new member Hana Bekele at Atote branch', ip: '10.10.4.22', occurredAt: '2026-10-28T09:20:00.000Z',
  },
  {
    id: 'aud-004', actor: 'Kaleab Desta', action: 'UPDATE', entity: 'Member', entityId: 'm-1042',
    field: 'phone', oldValue: '+251911045781', newValue: '+251912045781', detail: 'Member contact number corrected',
    ip: '10.10.4.22', occurredAt: '2026-10-29T10:05:00.000Z',
  },
  {
    id: 'aud-005', actor: 'Tigist Fikre', action: 'APPROVE', entity: 'Loan', entityId: 'LN-2026-0088',
    field: 'status', oldValue: 'Under Appraisal', newValue: 'Approved', detail: 'Credit committee approval granted',
    ip: '10.10.4.10', occurredAt: '2026-10-29T11:30:00.000Z',
  },
  {
    id: 'aud-006', actor: 'Liya Getachew', action: 'CREATE', entity: 'Loan', entityId: 'LN-2026-0101',
    detail: 'Loan application captured for member m-1044', ip: '10.10.5.14', occurredAt: '2026-10-30T08:55:00.000Z',
  },
  {
    id: 'aud-007', actor: 'Kaleab Desta', action: 'CREATE', entity: 'SavingsAccount', entityId: 'SA-10021',
    detail: 'Opened mandatory savings account for member m-1042', ip: '10.10.4.22', occurredAt: '2026-10-30T09:40:00.000Z',
  },
  {
    id: 'aud-008', actor: 'Kaleab Desta', action: 'UPDATE', entity: 'SavingsAccount', entityId: 'SA-10021',
    field: 'status', oldValue: 'Pending', newValue: 'Active', detail: 'Account activated after KYC verification',
    ip: '10.10.4.22', occurredAt: '2026-10-31T10:15:00.000Z',
  },
  {
    id: 'aud-009', actor: 'Kaleab Desta', action: 'CREATE', entity: 'Payment', entityId: 'PMT-0004521',
    detail: 'Cash deposit of ETB 5,000 captured at till 03', ip: '10.10.4.22', occurredAt: '2026-11-01T08:10:00.000Z',
  },
  {
    id: 'aud-010', actor: 'Tigist Fikre', action: 'APPROVE', entity: 'Payment', entityId: 'PMT-0004521',
    field: 'status', oldValue: 'Pending', newValue: 'Authorized', detail: 'Deposit authorized by branch manager',
    ip: '10.10.4.10', occurredAt: '2026-11-01T09:25:00.000Z',
  },
  {
    id: 'aud-011', actor: 'Meron Tesfaye', action: 'LOGIN', entity: 'User', entityId: 'meron.tesfaye',
    detail: 'Successful login from head office workstation', ip: '10.10.4.10', occurredAt: '2026-11-02T08:35:00.000Z',
  },
  {
    id: 'aud-012', actor: 'Liya Getachew', action: 'UPDATE', entity: 'Loan', entityId: 'LN-2026-0101',
    field: 'ratePct', oldValue: '12', newValue: '13.5', detail: 'Risk-based pricing applied after appraisal',
    ip: '10.10.5.14', occurredAt: '2026-11-02T10:50:00.000Z',
  },
  {
    id: 'aud-013', actor: 'Tigist Fikre', action: 'REJECT', entity: 'Loan', entityId: 'LN-2026-0102',
    field: 'status', oldValue: 'Pending', newValue: 'Rejected', detail: 'Debt service ratio exceeds policy ceiling',
    ip: '10.10.4.10', occurredAt: '2026-11-03T09:05:00.000Z',
  },
  {
    id: 'aud-014', actor: 'Workineh Tola', action: 'DELETE', entity: 'User', entityId: 'u-09',
    detail: 'Removed duplicate user account created during migration', ip: '10.10.4.21', occurredAt: '2026-11-03T11:20:00.000Z',
  },
  {
    id: 'aud-015', actor: 'Kaleab Desta', action: 'UPDATE', entity: 'Member', entityId: 'm-1042',
    field: 'status', oldValue: 'Active', newValue: 'Dormant', detail: 'Dormancy policy applied after 12 inactive months',
    ip: '10.10.4.22', occurredAt: '2026-11-04T08:40:00.000Z',
  },
  {
    id: 'aud-016', actor: 'System', action: 'UPDATE', entity: 'SavingsAccount', entityId: 'SA-10021',
    field: 'balance', oldValue: '15400.00', newValue: '15925.00', detail: 'Monthly interest posting batch',
    ip: '127.0.0.1', occurredAt: '2026-11-04T13:10:00.000Z',
  },
  {
    id: 'aud-017', actor: 'Kaleab Desta', action: 'CREATE', entity: 'Payment', entityId: 'PMT-0004588',
    detail: 'Withdrawal of ETB 2,500 requested by member m-1031', ip: '10.10.4.22', occurredAt: '2026-11-05T09:30:00.000Z',
  },
  {
    id: 'aud-018', actor: 'Tigist Fikre', action: 'APPROVE', entity: 'Approval', entityId: 'APR-2231',
    field: 'status', oldValue: 'Pending', newValue: 'Approved', detail: 'Fee waiver approved for member m-1027',
    ip: '10.10.4.10', occurredAt: '2026-11-05T10:15:00.000Z',
  },
  {
    id: 'aud-019', actor: 'Meron Tesfaye', action: 'LOGIN', entity: 'User', entityId: 'meron.tesfaye',
    detail: 'Successful login from head office workstation', ip: '10.10.4.10', occurredAt: '2026-11-05T14:45:00.000Z',
  },
  {
    id: 'aud-020', actor: 'Liya Getachew', action: 'UPDATE', entity: 'Loan', entityId: 'LN-2026-0101',
    field: 'termMonths', oldValue: '24', newValue: '18', detail: 'Tenor shortened at member request',
    ip: '10.10.5.14', occurredAt: '2026-11-06T08:20:00.000Z',
  },
  {
    id: 'aud-021', actor: 'Workineh Tola', action: 'CREATE', entity: 'User', entityId: 'u-15',
    detail: 'Created auditor account for Meron Tesfaye', ip: '10.10.4.21', occurredAt: '2026-11-06T10:40:00.000Z',
  },
  {
    id: 'aud-022', actor: 'Tigist Fikre', action: 'REJECT', entity: 'Approval', entityId: 'APR-2234',
    field: 'status', oldValue: 'Pending', newValue: 'Rejected', detail: 'Supporting documents were incomplete',
    ip: '10.10.4.10', occurredAt: '2026-11-06T15:05:00.000Z',
  },
  {
    id: 'aud-023', actor: 'Kaleab Desta', action: 'UPDATE', entity: 'Payment', entityId: 'PMT-0004588',
    field: 'status', oldValue: 'Pending', newValue: 'Authorized', detail: 'Withdrawal authorized at the teller window',
    ip: '10.10.4.22', occurredAt: '2026-11-07T09:10:00.000Z',
  },
  {
    id: 'aud-024', actor: 'Workineh Tola', action: 'UPDATE', entity: 'User', entityId: 'u-15',
    field: 'passwordHash', oldValue: '***', newValue: '***', detail: 'Password rotated; value redacted in the audit trail',
    ip: '10.10.4.21', occurredAt: '2026-11-07T11:35:00.000Z',
  },
  {
    id: 'aud-025', actor: 'Meron Tesfaye', action: 'DELETE', entity: 'SavingsAccount', entityId: 'SA-09984',
    detail: 'Closed duplicate account flagged by reconciliation', ip: '10.10.4.10', occurredAt: '2026-11-08T08:25:00.000Z',
  },
  {
    id: 'aud-026', actor: 'System', action: 'UPDATE', entity: 'Loan', entityId: 'LN-2026-0088',
    field: 'balance', oldValue: '182000.00', newValue: '176500.00', detail: 'Repayment applied through standing order',
    ip: '127.0.0.1', occurredAt: '2026-11-08T10:00:00.000Z',
  },
  {
    id: 'aud-027', actor: 'Kaleab Desta', action: 'CREATE', entity: 'Member', entityId: 'm-1043',
    detail: 'Registered new member Yonas Tadesse at Atote branch', ip: '10.10.4.22', occurredAt: '2026-11-09T09:15:00.000Z',
  },
  {
    id: 'aud-028', actor: 'Tigist Fikre', action: 'APPROVE', entity: 'Loan', entityId: 'LN-2026-0103',
    field: 'status', oldValue: 'Under Appraisal', newValue: 'Approved', detail: 'Approved with collateral margin of 140%',
    ip: '10.10.4.10', occurredAt: '2026-11-09T11:50:00.000Z',
  },
  {
    id: 'aud-029', actor: 'Meron Tesfaye', action: 'LOGIN', entity: 'User', entityId: 'meron.tesfaye',
    detail: 'Successful login from head office workstation', ip: '10.10.4.10', occurredAt: '2026-11-10T08:05:00.000Z',
  },
  {
    id: 'aud-030', actor: 'Workineh Tola', action: 'UPDATE', entity: 'User', entityId: 'u-14',
    field: 'status', oldValue: 'Active', newValue: 'Locked', detail: 'Account locked after failed login attempts',
    ip: '10.10.4.21', occurredAt: '2026-11-10T09:30:00.000Z',
  },
];

const buildChain = (): AuditTrailEntry[] => {
  let prevHash = GENESIS;
  return seeds.map((seed) => {
    const hash = mockHash(prevHash + payloadOf(seed));
    const entry: AuditTrailEntry = { ...seed, hash, prevHash };
    prevHash = hash;
    return entry;
  });
};

const entries = buildChain();

const toEpoch = (value: string, endOfDay: boolean): number | null => {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = Date.parse(dateOnly && endOfDay ? `${value}T23:59:59.999Z` : value);
  return Number.isNaN(parsed) ? null : parsed;
};

const matches = (
  entry: AuditTrailEntry,
  filters: { entity?: string | null; action?: string | null; actor?: string | null; q?: string | null; from?: string | null; to?: string | null },
): boolean => {
  if (filters.entity && entry.entity.toLowerCase() !== filters.entity.toLowerCase()) return false;
  if (filters.action && entry.action.toLowerCase() !== filters.action.toLowerCase()) return false;
  if (filters.actor && entry.actor.toLowerCase() !== filters.actor.toLowerCase()) return false;
  const q = (filters.q ?? '').trim().toLowerCase();
  if (q) {
    const haystack = [entry.actor, entry.entity, entry.entityId, entry.detail, entry.field, entry.oldValue, entry.newValue]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  const occurred = Date.parse(entry.occurredAt);
  if (filters.from) {
    const from = toEpoch(filters.from, false);
    if (from !== null && occurred < from) return false;
  }
  if (filters.to) {
    const to = toEpoch(filters.to, true);
    if (to !== null && occurred > to) return false;
  }
  return true;
};

const verifyChain = (): VerifyResult => {
  let prevHash = GENESIS;
  for (const entry of entries) {
    const expected = mockHash(prevHash + payloadOf(entry));
    if (entry.prevHash !== prevHash || entry.hash !== expected) {
      return { valid: false, checked: entries.length, brokenAt: entry.id };
    }
    prevHash = entry.hash;
  }
  return { valid: true, checked: entries.length };
};

export const auditTrailHandlers = [
  http.get('/api/audit-trail', async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const filtered = entries
      .filter((entry) =>
        matches(entry, {
          entity: url.searchParams.get('entity'),
          action: url.searchParams.get('action'),
          actor: url.searchParams.get('actor'),
          q: url.searchParams.get('q'),
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
        }),
      )
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id));
    return json(filtered);
  }),

  http.get('/api/audit-trail/verify', async () => {
    await delay(250);
    return json(verifyChain());
  }),

  http.get('/api/audit-trail/actors', async () => {
    await delay(120);
    return json([...new Set(entries.map((entry) => entry.actor))].sort((a, b) => a.localeCompare(b)));
  }),
];
