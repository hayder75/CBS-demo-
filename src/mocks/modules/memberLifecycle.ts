import { http, HttpResponse, delay } from 'msw';
import type {
  CustomFieldType,
  DormancyCandidate,
  DormancyPolicy,
  DormancyRunResult,
  ExitChecklistItem,
  MemberCustomField,
  MemberCustomValue,
  MemberExitRequest,
} from '../../types';
import { members } from '../data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const err = (message: string, status: number) => HttpResponse.json({ error: message }, { status });

const FIELD_TYPES: CustomFieldType[] = ['Text', 'Number', 'Date', 'Select', 'Boolean'];
const APPLIES_TO: MemberCustomField['appliesTo'][] = ['Individual', 'Entity', 'Both'];

const EXIT_CHECKLIST: ExitChecklistItem[] = [
  { key: 'savings_withdrawn', label: 'Savings withdrawn', done: false },
  { key: 'loans_settled', label: 'Loans fully settled', done: false },
  { key: 'shares_transferred', label: 'Shares transferred', done: false },
  { key: 'collateral_released', label: 'Collateral released', done: false },
  { key: 'guarantor_cleared', label: 'Guarantor exposure cleared', done: false },
  { key: 'kyc_retained', label: 'KYC retained', done: false },
];

const nowIso = () => new Date().toISOString();

const newChecklist = (): ExitChecklistItem[] => EXIT_CHECKLIST.map((item) => ({ ...item }));

let seq = 100;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++seq}`;

export const memberCustomFields: MemberCustomField[] = [
  {
    id: 'cf1',
    key: 'tin',
    label: 'TIN',
    type: 'Text',
    appliesTo: 'Both',
    required: false,
    status: 'Active',
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'cf2',
    key: 'passport_no',
    label: 'Passport No',
    type: 'Text',
    appliesTo: 'Individual',
    required: false,
    status: 'Active',
    createdAt: '2026-01-05T08:05:00.000Z',
  },
  {
    id: 'cf3',
    key: 'marital_status',
    label: 'Marital Status',
    type: 'Select',
    appliesTo: 'Both',
    required: false,
    options: ['Single', 'Married', 'Divorced', 'Widowed'],
    status: 'Active',
    createdAt: '2026-01-05T08:10:00.000Z',
  },
  {
    id: 'cf4',
    key: 'source_of_funds',
    label: 'Source of Funds',
    type: 'Select',
    appliesTo: 'Both',
    required: false,
    options: ['Salary', 'Business', 'Savings', 'Investment', 'Other'],
    status: 'Active',
    createdAt: '2026-01-05T08:15:00.000Z',
  },
  {
    id: 'cf5',
    key: 'pep',
    label: 'PEP',
    type: 'Boolean',
    appliesTo: 'Individual',
    required: false,
    status: 'Active',
    createdAt: '2026-01-05T08:20:00.000Z',
  },
];

export const memberCustomValues: MemberCustomValue[] = [
  {
    id: 'cv1',
    memberId: 'm1',
    fieldId: 'cf1',
    fieldKey: 'tin',
    label: 'TIN',
    type: 'Text',
    value: '1234567890',
    updatedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'cv2',
    memberId: 'm1',
    fieldId: 'cf2',
    fieldKey: 'passport_no',
    label: 'Passport No',
    type: 'Text',
    value: 'EP1234567',
    updatedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'cv3',
    memberId: 'm1',
    fieldId: 'cf3',
    fieldKey: 'marital_status',
    label: 'Marital Status',
    type: 'Select',
    value: 'Married',
    updatedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'cv4',
    memberId: 'm1',
    fieldId: 'cf4',
    fieldKey: 'source_of_funds',
    label: 'Source of Funds',
    type: 'Select',
    value: 'Salary',
    updatedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'cv5',
    memberId: 'm1',
    fieldId: 'cf5',
    fieldKey: 'pep',
    label: 'PEP',
    type: 'Boolean',
    value: 'false',
    updatedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'cv6',
    memberId: 'm2',
    fieldId: 'cf1',
    fieldKey: 'tin',
    label: 'TIN',
    type: 'Text',
    value: '9876543210',
    updatedAt: '2026-02-03T10:30:00.000Z',
  },
  {
    id: 'cv7',
    memberId: 'm2',
    fieldId: 'cf3',
    fieldKey: 'marital_status',
    label: 'Marital Status',
    type: 'Select',
    value: 'Single',
    updatedAt: '2026-02-03T10:30:00.000Z',
  },
  {
    id: 'cv8',
    memberId: 'm2',
    fieldId: 'cf4',
    fieldKey: 'source_of_funds',
    label: 'Source of Funds',
    type: 'Select',
    value: 'Business',
    updatedAt: '2026-02-03T10:30:00.000Z',
  },
  {
    id: 'cv9',
    memberId: 'm2',
    fieldId: 'cf5',
    fieldKey: 'pep',
    label: 'PEP',
    type: 'Boolean',
    value: 'true',
    updatedAt: '2026-02-03T10:30:00.000Z',
  },
];

export const memberExitRequests: MemberExitRequest[] = [
  {
    id: 'ex1',
    memberId: 'm5',
    memberName: 'Yonas Tadesse',
    memberNo: 'MEM-10005',
    reason: 'Relocating abroad for work and closing the membership.',
    status: 'Pending',
    checklist: [
      { key: 'savings_withdrawn', label: 'Savings withdrawn', done: true },
      { key: 'loans_settled', label: 'Loans fully settled', done: true },
      { key: 'shares_transferred', label: 'Shares transferred', done: false },
      { key: 'collateral_released', label: 'Collateral released', done: false },
      { key: 'guarantor_cleared', label: 'Guarantor exposure cleared', done: false },
      { key: 'kyc_retained', label: 'KYC retained', done: true },
    ],
    requestedAt: '2026-10-02T09:15:00.000Z',
  },
  {
    id: 'ex2',
    memberId: 'm18',
    memberName: 'Robel Hailemariam',
    memberNo: 'MEM-10018',
    reason: 'Voluntary withdrawal after relocating to another region.',
    status: 'Completed',
    checklist: [
      { key: 'savings_withdrawn', label: 'Savings withdrawn', done: true },
      { key: 'loans_settled', label: 'Loans fully settled', done: true },
      { key: 'shares_transferred', label: 'Shares transferred', done: true },
      { key: 'collateral_released', label: 'Collateral released', done: true },
      { key: 'guarantor_cleared', label: 'Guarantor exposure cleared', done: true },
      { key: 'kyc_retained', label: 'KYC retained', done: true },
    ],
    requestedAt: '2026-08-12T11:00:00.000Z',
    decidedAt: '2026-08-15T14:30:00.000Z',
    completedAt: '2026-08-20T10:00:00.000Z',
  },
];

const seededWithdrawnMember = members.find((member) => member.id === 'm18');
if (seededWithdrawnMember) seededWithdrawnMember.status = 'Withdrawn';

export const dormancyPolicy: DormancyPolicy = {
  months: 12,
  autoFlagMembers: true,
  autoFlagAccounts: true,
  updatedAt: '2026-09-01T08:00:00.000Z',
};

const findMember = (id: unknown) =>
  members.find((member) => String(member.id) === String(id));

const findField = (id: unknown) =>
  memberCustomFields.find((field) => String(field.id) === String(id));

const findExit = (id: unknown) =>
  memberExitRequests.find((request) => String(request.id) === String(id));

const parseBoolean = (value: unknown): boolean | null => {
  if (value === true || value === false) return value;
  const text = String(value ?? '').trim().toLowerCase();
  if (text === 'true') return true;
  if (text === 'false') return false;
  return null;
};

const valuesForMember = (memberId: string) =>
  memberCustomValues.filter((value) => String(value.memberId) === String(memberId));

const validateValue = (field: MemberCustomField, raw: string) => {
  if (raw === '') return;
  if (field.type === 'Number') {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      throw new Error(`${field.label} must be a valid number`);
    }
  }
  if (field.type === 'Date') {
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) {
      throw new Error(`${field.label} must be a valid date`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && new Date(parsed).toISOString().slice(0, 10) !== raw) {
      throw new Error(`${field.label} must be a valid date`);
    }
  }
  if (field.type === 'Select' && !(field.options ?? []).includes(raw)) {
    throw new Error(`${field.label} must be one of: ${(field.options ?? []).join(', ')}`);
  }
  if (field.type === 'Boolean' && parseBoolean(raw) === null) {
    throw new Error(`${field.label} must be true or false`);
  }
};

const upsertValue = (memberId: string, field: MemberCustomField, raw: string, timestamp: string) => {
  const existing = memberCustomValues.find(
    (value) => String(value.memberId) === String(memberId) && String(value.fieldId) === String(field.id),
  );
  if (existing) {
    existing.fieldKey = field.key;
    existing.label = field.label;
    existing.type = field.type;
    existing.value = raw;
    existing.updatedAt = timestamp;
    return;
  }
  memberCustomValues.push({
    id: nextId('cv'),
    memberId,
    fieldId: String(field.id),
    fieldKey: field.key,
    label: field.label,
    type: field.type,
    value: raw,
    updatedAt: timestamp,
  });
};

const removeValue = (memberId: string, fieldId: unknown) => {
  const index = memberCustomValues.findIndex(
    (value) => String(value.memberId) === String(memberId) && String(value.fieldId) === String(fieldId),
  );
  if (index >= 0) memberCustomValues.splice(index, 1);
};

const updateExit = (updated: MemberExitRequest) => {
  const index = memberExitRequests.findIndex((request) => String(request.id) === String(updated.id));
  if (index >= 0) memberExitRequests.splice(index, 1, updated);
  return updated;
};

const hasOpenExit = (memberId: unknown) =>
  memberExitRequests.some(
    (request) =>
      String(request.memberId) === String(memberId) &&
      (request.status === 'Pending' || request.status === 'Approved'),
  );

const buildCandidates = (): DormancyRunResult => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - dormancyPolicy.months);
  const cutoffTime = cutoff.getTime();
  const active = members.filter((member) => member.status === 'Active');
  const candidates: DormancyCandidate[] = active
    .filter((member) => {
      const lastActivity = Date.parse(member.joinDate);
      return (
        Number.isFinite(lastActivity) &&
        lastActivity < cutoffTime &&
        Number(member.loanOutstanding ?? 0) <= 0
      );
    })
    .map((member) => ({
      memberId: String(member.id),
      memberName: member.fullName,
      memberNo: member.memberNo,
      lastActivity: member.joinDate,
      status: member.status,
      savingsBalance: member.savingsBalance,
      loanOutstanding: member.loanOutstanding,
    }));
  return {
    flagged: candidates.length,
    skipped: active.length - candidates.length,
    candidates,
  };
};

export const memberLifecycleHandlers = [
  http.get('/api/member-custom-fields', async () => {
    await delay(150);
    return json(memberCustomFields);
  }),

  http.post('/api/member-custom-fields', async ({ request }) => {
    await delay(350);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const key = String(body.key ?? '').trim();
    const label = String(body.label ?? '').trim();
    const type = String(body.type ?? '').trim() as CustomFieldType;
    const appliesTo = String(body.appliesTo ?? 'Both').trim() as MemberCustomField['appliesTo'];

    if (!key) return err('Key is required', 400);
    if (!label) return err('Label is required', 400);
    if (!FIELD_TYPES.includes(type)) return err(`Invalid field type: ${type || '(empty)'}`, 400);
    if (!APPLIES_TO.includes(appliesTo)) return err(`Invalid appliesTo value: ${appliesTo}`, 400);
    if (memberCustomFields.some((field) => field.key.toLowerCase() === key.toLowerCase())) {
      return err(`A custom field with key "${key}" already exists`, 400);
    }

    let options: string[] | undefined;
    if (type === 'Select') {
      if (!Array.isArray(body.options)) return err('Select fields require at least one option', 400);
      options = Array.from(
        new Set(
          body.options
            .map((option) => String(option ?? '').trim())
            .filter((option) => option.length > 0),
        ),
      );
      if (options.length === 0) return err('Select fields require at least one option', 400);
    }

    const required = parseBoolean(body.required);
    if (body.required !== undefined && required === null) {
      return err('required must be true or false', 400);
    }

    const field: MemberCustomField = {
      id: nextId('cf'),
      key,
      label,
      type,
      appliesTo,
      required: required ?? false,
      ...(options ? { options } : {}),
      status: 'Active',
      createdAt: nowIso(),
    };
    memberCustomFields.unshift(field);
    return json(field);
  }),

  http.post('/api/member-custom-fields/:id/toggle', async ({ params }) => {
    await delay(250);
    const field = findField(params.id);
    if (!field) return err('Custom field not found', 400);
    field.status = field.status === 'Active' ? 'Inactive' : 'Active';
    return json(field);
  }),

  http.get('/api/members/:id/custom-values', async ({ params }) => {
    await delay(150);
    return json(valuesForMember(String(params.id)));
  }),

  http.post('/api/members/:id/custom-values', async ({ params, request }) => {
    await delay(350);
    const memberId = String(params.id);
    const member = findMember(memberId);
    if (!member) return err('Member not found', 400);
    const body = (await request.json().catch(() => ({}))) as { values?: unknown };
    if (!Array.isArray(body.values)) return err('values must be an array', 400);

    const submitted = new Map<string, string>();
    for (const raw of body.values) {
      if (raw == null || typeof raw !== 'object') return err('Each value must be an object', 400);
      const entry = raw as Record<string, unknown>;
      if (entry.fieldId == null || String(entry.fieldId).trim() === '') {
        return err('fieldId is required', 400);
      }
      if (!findField(entry.fieldId)) return err(`Unknown custom field: ${String(entry.fieldId)}`, 400);
      submitted.set(String(entry.fieldId), entry.value == null ? '' : String(entry.value).trim());
    }

    for (const field of memberCustomFields) {
      if (field.status !== 'Active' || !field.required) continue;
      const value = submitted.get(String(field.id));
      if (value == null || value === '') return err(`${field.label} is required`, 400);
    }

    const timestamp = nowIso();
    for (const [fieldId, value] of submitted) {
      const field = findField(fieldId);
      if (!field) continue;
      try {
        validateValue(field, value);
      } catch (error) {
        return err((error as Error).message, 400);
      }
      if (value === '') {
        removeValue(memberId, field.id);
      } else {
        upsertValue(memberId, field, value, timestamp);
      }
    }

    return json(valuesForMember(memberId));
  }),

  http.get('/api/member-exits', async () => {
    await delay(180);
    return json(memberExitRequests);
  }),

  http.post('/api/member-exits', async ({ request }) => {
    await delay(350);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const member = findMember(body.memberId);
    if (!member) return err('Member not found', 400);
    if (member.status === 'Withdrawn') return err('This member has already withdrawn', 400);
    if (hasOpenExit(member.id)) return err('An exit request is already open for this member', 400);
    const reason = String(body.reason ?? '').trim();
    if (!reason) return err('Reason is required', 400);

    const exit: MemberExitRequest = {
      id: nextId('ex'),
      memberId: String(member.id),
      memberName: member.fullName,
      memberNo: member.memberNo,
      reason,
      status: 'Pending',
      checklist: newChecklist(),
      requestedAt: nowIso(),
    };
    memberExitRequests.unshift(exit);
    return json(exit);
  }),

  http.post('/api/member-exits/:id/checklist', async ({ params, request }) => {
    await delay(250);
    const exit = findExit(params.id);
    if (!exit) return err('Exit request not found', 404);
    if (exit.status !== 'Pending') return err(`Only pending exit requests can be edited (current: ${exit.status})`, 400);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const key = String(body.key ?? '').trim();
    if (!key) return err('Checklist key is required', 400);
    const item = exit.checklist.find((row) => row.key === key);
    if (!item) return err(`Unknown checklist item: ${key}`, 400);
    const done = parseBoolean(body.done);
    if (done === null) return err('done must be true or false', 400);
    item.done = done;
    return json(updateExit(exit));
  }),

  http.post('/api/member-exits/:id/approve', async ({ params }) => {
    await delay(300);
    const exit = findExit(params.id);
    if (!exit) return err('Exit request not found', 404);
    if (exit.status !== 'Pending') return err(`Only pending exit requests can be approved (current: ${exit.status})`, 400);
    exit.status = 'Approved';
    exit.decidedAt = nowIso();
    return json(updateExit(exit));
  }),

  http.post('/api/member-exits/:id/complete', async ({ params }) => {
    await delay(400);
    const exit = findExit(params.id);
    if (!exit) return err('Exit request not found', 404);
    if (exit.status !== 'Approved') return err(`Only approved exit requests can be completed (current: ${exit.status})`, 400);
    if (exit.checklist.some((item) => !item.done)) {
      return err('All checklist items must be completed before the exit can be completed', 400);
    }
    exit.status = 'Completed';
    exit.completedAt = nowIso();
    exit.decidedAt = exit.decidedAt ?? nowIso();
    const member = findMember(exit.memberId);
    if (member) member.status = 'Withdrawn';
    return json(updateExit(exit));
  }),

  http.post('/api/member-exits/:id/reject', async ({ params, request }) => {
    await delay(300);
    const exit = findExit(params.id);
    if (!exit) return err('Exit request not found', 404);
    if (exit.status !== 'Pending' && exit.status !== 'Approved') {
      return err(`Only pending or approved exit requests can be rejected (current: ${exit.status})`, 400);
    }
    await request.json().catch(() => ({}));
    exit.status = 'Rejected';
    exit.decidedAt = nowIso();
    return json(updateExit(exit));
  }),

  http.get('/api/dormancy/policy', async () => {
    await delay(150);
    return json(dormancyPolicy);
  }),

  http.post('/api/dormancy/policy', async ({ request }) => {
    await delay(300);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const months = Number(body.months);
    if (!Number.isInteger(months) || months < 1 || months > 60) {
      return err('months must be an integer between 1 and 60', 400);
    }
    const autoFlagMembers =
      body.autoFlagMembers === undefined
        ? dormancyPolicy.autoFlagMembers
        : parseBoolean(body.autoFlagMembers);
    const autoFlagAccounts =
      body.autoFlagAccounts === undefined
        ? dormancyPolicy.autoFlagAccounts
        : parseBoolean(body.autoFlagAccounts);
    if (autoFlagMembers === null) return err('autoFlagMembers must be true or false', 400);
    if (autoFlagAccounts === null) return err('autoFlagAccounts must be true or false', 400);
    dormancyPolicy.months = months;
    dormancyPolicy.autoFlagMembers = autoFlagMembers;
    dormancyPolicy.autoFlagAccounts = autoFlagAccounts;
    dormancyPolicy.updatedAt = nowIso();
    return json(dormancyPolicy);
  }),

  http.post('/api/dormancy/run', async () => {
    await delay(450);
    return json(buildCandidates());
  }),

  http.post('/api/dormancy/flag', async ({ request }) => {
    await delay(350);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (!Array.isArray(body.memberIds)) return err('memberIds must be an array', 400);
    let flagged = 0;
    for (const memberId of body.memberIds) {
      const member = findMember(memberId);
      if (!member) continue;
      member.status = 'Dormant';
      flagged += 1;
    }
    return json({ flagged });
  }),

  http.post('/api/dormancy/reactivate', async ({ request }) => {
    await delay(250);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const member = findMember(body.memberId);
    if (!member) return err('Member not found', 400);
    member.status = 'Active';
    return json({ memberId: String(member.id), status: member.status });
  }),
];
