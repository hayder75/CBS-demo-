import { http, HttpResponse, delay } from 'msw';
import type {
  ReferralCode,
  ReferralRecord,
  ReferralReport,
  ReferralSettings,
} from '../../types';
import { members } from '../data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const err = (message: string, status: number) => HttpResponse.json({ error: message }, { status });

const ETHIOPIAN_MOBILE = /^\+251[79]\d{8}$/;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const normalizePhone = (raw: unknown): string => {
  const digits = String(raw ?? '').replace(/[^0-9+]/g, '');
  if (digits.startsWith('+251')) return digits;
  if (digits.startsWith('251')) return `+${digits}`;
  if (digits.startsWith('0')) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  return digits;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

let settings: ReferralSettings = {
  enabled: true,
  rewardPerReferral: 100,
  minQualifyingDeposit: 500,
  rewardMode: 'Savings',
  updatedAt: '2026-09-01T08:00:00.000Z',
};

export const referralCodes: ReferralCode[] = [
  {
    id: 'rc1',
    code: 'REF-A1B2C3',
    memberId: 'm1',
    memberName: 'Abebe Bekele',
    status: 'Active',
    uses: 2,
    rewardAmount: 100,
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'rc2',
    code: 'REF-D4E5F6',
    memberId: 'm2',
    memberName: 'Meseret Alemu',
    status: 'Active',
    uses: 2,
    rewardAmount: 150,
    createdAt: '2026-08-18T10:30:00.000Z',
  },
  {
    id: 'rc3',
    code: 'REF-G7H8I9',
    memberId: 'm3',
    memberName: 'Dawit Tesfaye',
    status: 'Active',
    uses: 1,
    rewardAmount: 100,
    createdAt: '2026-09-12T11:15:00.000Z',
  },
  {
    id: 'rc4',
    code: 'REF-J1K2L3',
    memberId: 'm4',
    memberName: 'Hanna Girma',
    status: 'Disabled',
    uses: 1,
    rewardAmount: 100,
    createdAt: '2026-07-22T14:00:00.000Z',
  },
  {
    id: 'rc5',
    code: 'REF-M4N5O6',
    memberId: 'm5',
    memberName: 'Yonas Tadesse',
    status: 'Active',
    uses: 2,
    rewardAmount: 100,
    createdAt: '2026-08-05T08:45:00.000Z',
  },
  {
    id: 'rc6',
    code: 'REF-P7Q8R9',
    memberId: 'm6',
    memberName: 'Selamawit Haile',
    status: 'Active',
    uses: 1,
    rewardAmount: 100,
    createdAt: '2026-10-01T09:20:00.000Z',
  },
];

export const referralRecords: ReferralRecord[] = [
  {
    id: 'rr1',
    code: 'REF-A1B2C3',
    referrerName: 'Abebe Bekele',
    refereeName: 'Tigist Alemu',
    refereePhone: '+251911000001',
    status: 'Pending',
    rewardAmount: 100,
    createdAt: '2026-10-01T09:10:00.000Z',
  },
  {
    id: 'rr2',
    code: 'REF-A1B2C3',
    referrerName: 'Abebe Bekele',
    refereeName: 'Bereket Tadesse',
    refereePhone: '+251911000002',
    status: 'Rewarded',
    rewardAmount: 100,
    createdAt: '2026-09-12T08:40:00.000Z',
    qualifiedAt: '2026-09-20T10:00:00.000Z',
    rewardedAt: '2026-09-25T12:30:00.000Z',
  },
  {
    id: 'rr3',
    code: 'REF-D4E5F6',
    referrerName: 'Meseret Alemu',
    refereeName: 'Hana Tesfaye',
    refereePhone: '+251911000003',
    status: 'Qualified',
    rewardAmount: 150,
    createdAt: '2026-10-05T11:05:00.000Z',
    qualifiedAt: '2026-10-12T15:20:00.000Z',
  },
  {
    id: 'rr4',
    code: 'REF-D4E5F6',
    referrerName: 'Meseret Alemu',
    refereeName: 'Yohannes Girma',
    refereePhone: '+251911000004',
    status: 'Rewarded',
    rewardAmount: 150,
    createdAt: '2026-09-02T13:15:00.000Z',
    qualifiedAt: '2026-09-10T09:45:00.000Z',
    rewardedAt: '2026-09-15T10:10:00.000Z',
  },
  {
    id: 'rr5',
    code: 'REF-G7H8I9',
    referrerName: 'Dawit Tesfaye',
    refereeName: 'Marta Kebede',
    refereePhone: '+251911000005',
    status: 'Pending',
    rewardAmount: 100,
    createdAt: '2026-10-09T16:25:00.000Z',
  },
  {
    id: 'rr6',
    code: 'REF-G7H8I9',
    referrerName: 'Dawit Tesfaye',
    refereeName: 'Abel Mekonnen',
    refereePhone: '+251911000006',
    status: 'Rejected',
    rewardAmount: 100,
    createdAt: '2026-09-18T10:35:00.000Z',
    note: 'Referee is already an existing member of the SACCO.',
  },
  {
    id: 'rr7',
    code: 'REF-M4N5O6',
    referrerName: 'Yonas Tadesse',
    refereeName: 'Sara Bekele',
    refereePhone: '+251911000007',
    status: 'Qualified',
    rewardAmount: 100,
    createdAt: '2026-10-03T09:55:00.000Z',
    qualifiedAt: '2026-10-10T14:05:00.000Z',
  },
  {
    id: 'rr8',
    code: 'REF-M4N5O6',
    referrerName: 'Yonas Tadesse',
    refereeName: 'Nahom Assefa',
    refereePhone: '+251911000008',
    status: 'Rewarded',
    rewardAmount: 100,
    createdAt: '2026-08-22T12:00:00.000Z',
    qualifiedAt: '2026-09-01T11:30:00.000Z',
    rewardedAt: '2026-09-06T09:15:00.000Z',
  },
  {
    id: 'rr9',
    code: 'REF-P7Q8R9',
    referrerName: 'Selamawit Haile',
    refereeName: 'Ruth Solomon',
    refereePhone: '+251911000009',
    status: 'Pending',
    rewardAmount: 100,
    createdAt: '2026-10-11T08:10:00.000Z',
  },
];

let codeSeq = referralCodes.length;
let recordSeq = referralRecords.length;

const memberById = (id: unknown) => members.find((m) => String(m.id) === String(id));

const buildReport = (records: ReferralRecord[]): ReferralReport => {
  const total = records.length;
  const pending = records.filter((r) => r.status === 'Pending').length;
  const qualified = records.filter((r) => r.status === 'Qualified').length;
  const rewarded = records.filter((r) => r.status === 'Rewarded').length;
  const rejected = records.filter((r) => r.status === 'Rejected').length;
  const rewardsPaid = records
    .filter((r) => r.status === 'Rewarded')
    .reduce((sum, r) => sum + r.rewardAmount, 0);
  const conversionPct = total === 0 ? 0 : round1(((qualified + rewarded) / total) * 100);

  const byReferrer = new Map<string, { memberName: string; referrals: number; rewarded: number }>();
  records.forEach((r) => {
    const name = r.referrerName || 'Unassigned';
    const entry = byReferrer.get(name) ?? { memberName: name, referrals: 0, rewarded: 0 };
    entry.referrals += 1;
    if (r.status === 'Rewarded') entry.rewarded += 1;
    byReferrer.set(name, entry);
  });

  const topReferrers = [...byReferrer.values()]
    .sort(
      (a, b) =>
        b.referrals - a.referrals ||
        b.rewarded - a.rewarded ||
        a.memberName.localeCompare(b.memberName),
    )
    .slice(0, 3);

  return {
    totalReferrals: total,
    pending,
    qualified,
    rewarded,
    rejected,
    conversionPct,
    rewardsPaid,
    topReferrers,
  };
};

const generateCode = () => {
  let candidate = '';
  do {
    candidate = 'REF-';
    for (let i = 0; i < 6; i += 1) {
      candidate += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
  } while (referralCodes.some((c) => c.code === candidate));
  return candidate;
};

const readBody = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

export const referralHandlers = [
  http.get('/api/referrals/codes', async () => {
    await delay(250);
    return json(referralCodes);
  }),

  http.post('/api/referrals/codes', async ({ request }) => {
    await delay(450);
    const body = await readBody(request);
    if (!body) return err('Invalid JSON body', 400);

    const member = memberById(body.memberId);
    if (!member) return err('Member not found', 400);
    if (referralCodes.some((c) => c.memberId === member.id && c.status === 'Active')) {
      return err('This member already has an active referral code', 400);
    }

    const hasReward = body.rewardAmount !== undefined && body.rewardAmount !== null && body.rewardAmount !== '';
    const rewardAmount = hasReward ? Number(body.rewardAmount) : settings.rewardPerReferral;
    if (!Number.isFinite(rewardAmount) || rewardAmount < 0) {
      return err('Reward amount cannot be negative', 400);
    }

    codeSeq += 1;
    const code: ReferralCode = {
      id: `rc-${Date.now()}-${codeSeq}`,
      code: generateCode(),
      memberId: member.id,
      memberName: member.fullName,
      status: 'Active',
      uses: 0,
      rewardAmount,
      createdAt: new Date().toISOString(),
    };
    referralCodes.unshift(code);
    return json(code);
  }),

  http.post('/api/referrals/codes/:id/toggle', async ({ params }) => {
    await delay(300);
    const code = referralCodes.find((c) => c.id === String(params.id));
    if (!code) return err('Referral code not found', 400);
    code.status = code.status === 'Active' ? 'Disabled' : 'Active';
    return json(code);
  }),

  http.get('/api/referrals', async () => {
    await delay(250);
    return json(referralRecords);
  }),

  http.post('/api/referrals', async ({ request }) => {
    await delay(450);
    const body = await readBody(request);
    if (!body) return err('Invalid JSON body', 400);

    const codeValue = String(body.code ?? '').trim().toUpperCase();
    const code = referralCodes.find((c) => c.code === codeValue);
    if (!code) return err('Referral code not found', 400);
    if (code.status !== 'Active') return err('This referral code is disabled', 400);

    const refereeName = String(body.refereeName ?? '').trim();
    if (!refereeName) return err('Referee name is required', 400);

    const refereePhone = normalizePhone(body.refereePhone);
    if (!ETHIOPIAN_MOBILE.test(refereePhone)) {
      return err('Enter a valid Ethiopian mobile number (+251 7/9 xxxxxxxx)', 400);
    }

    const owner = memberById(code.memberId);
    if (owner && normalizePhone(owner.phone) === refereePhone) {
      return err('A member cannot refer themselves', 400);
    }
    if (referralRecords.some((r) => normalizePhone(r.refereePhone) === refereePhone)) {
      return err('This phone number has already been referred', 400);
    }

    recordSeq += 1;
    const record: ReferralRecord = {
      id: `rr-${Date.now()}-${recordSeq}`,
      code: code.code,
      referrerName: code.memberName,
      refereeName,
      refereePhone,
      status: 'Pending',
      rewardAmount: code.rewardAmount,
      createdAt: new Date().toISOString(),
    };
    referralRecords.unshift(record);
    code.uses += 1;
    return json(record);
  }),

  http.post('/api/referrals/:id/qualify', async ({ params }) => {
    await delay(350);
    const record = referralRecords.find((r) => r.id === String(params.id));
    if (!record) return err('Referral not found', 404);
    if (record.status !== 'Pending') {
      return err(`Only pending referrals can be qualified (current: ${record.status})`, 400);
    }
    record.status = 'Qualified';
    record.qualifiedAt = new Date().toISOString();
    return json(record);
  }),

  http.post('/api/referrals/:id/reward', async ({ params }) => {
    await delay(350);
    const record = referralRecords.find((r) => r.id === String(params.id));
    if (!record) return err('Referral not found', 404);
    if (record.status !== 'Qualified') {
      return err(`Only qualified referrals can be rewarded (current: ${record.status})`, 400);
    }
    if (!settings.enabled) return err('Referral programme is disabled in settings', 400);
    record.status = 'Rewarded';
    record.rewardedAt = new Date().toISOString();
    if (!record.rewardAmount) record.rewardAmount = settings.rewardPerReferral;
    return json(record);
  }),

  http.post('/api/referrals/:id/reject', async ({ params, request }) => {
    await delay(300);
    const record = referralRecords.find((r) => r.id === String(params.id));
    if (!record) return err('Referral not found', 404);
    if (record.status !== 'Pending' && record.status !== 'Qualified') {
      return err(`Only pending or qualified referrals can be rejected (current: ${record.status})`, 400);
    }
    const body = (await request.json().catch(() => ({}))) as { note?: string };
    record.status = 'Rejected';
    if (typeof body.note === 'string' && body.note.trim()) record.note = body.note.trim();
    return json(record);
  }),

  http.get('/api/referrals/settings', async () => {
    await delay(200);
    return json(settings);
  }),

  http.post('/api/referrals/settings', async ({ request }) => {
    await delay(400);
    const body = await readBody(request);
    if (!body) return err('Invalid JSON body', 400);

    const hasReward = body.rewardPerReferral !== undefined && body.rewardPerReferral !== null;
    const rewardPerReferral = hasReward ? Number(body.rewardPerReferral) : settings.rewardPerReferral;
    if (!Number.isFinite(rewardPerReferral) || rewardPerReferral < 0) {
      return err('Reward per referral cannot be negative', 400);
    }

    const hasMin = body.minQualifyingDeposit !== undefined && body.minQualifyingDeposit !== null;
    const minQualifyingDeposit = hasMin ? Number(body.minQualifyingDeposit) : settings.minQualifyingDeposit;
    if (!Number.isFinite(minQualifyingDeposit) || minQualifyingDeposit < 0) {
      return err('Minimum qualifying deposit cannot be negative', 400);
    }

    const rewardMode = body.rewardMode ?? settings.rewardMode;
    if (rewardMode !== 'Cash' && rewardMode !== 'Savings') {
      return err('Reward mode must be Cash or Savings', 400);
    }

    if (body.enabled !== undefined && body.enabled !== null && typeof body.enabled !== 'boolean') {
      return err('enabled must be a boolean', 400);
    }

    settings = {
      enabled: typeof body.enabled === 'boolean' ? body.enabled : settings.enabled,
      rewardPerReferral,
      minQualifyingDeposit,
      rewardMode,
      updatedAt: new Date().toISOString(),
    };
    return json(settings);
  }),

  http.get('/api/referrals/report', async () => {
    await delay(200);
    return json(buildReport(referralRecords));
  }),
];
