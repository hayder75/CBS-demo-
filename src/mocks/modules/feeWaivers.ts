import { http, HttpResponse, delay } from 'msw';
import type { FeeWaiver } from '../../types';
import { charges, members } from '../data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const err = (message: string, status: number) => HttpResponse.json({ error: message }, { status });

const DEFAULT_REQUESTER = 'Tigist Fikre';

const memberById = (id: unknown) => members.find((m) => String(m.id) === String(id));

const chargeByCode = (code: unknown) => charges.find((c) => c.code === String(code));

export const feeWaivers: FeeWaiver[] = [
  {
    id: 'fw1',
    memberId: 'm1',
    memberName: 'Abebe Bekele',
    chargeCode: 'CHG-SVC',
    chargeName: 'Monthly Service Charge',
    dateFrom: '2026-08-01',
    dateTo: '2026-08-31',
    amount: 25,
    reason: 'Long-serving pensioner; August service fee waived on compassionate grounds.',
    status: 'Approved',
    requestedBy: 'Kaleab Desta',
    approvedBy: 'Tigist Fikre',
    requestedAt: '2026-08-02T09:15:00',
    decidedAt: '2026-08-02T14:20:00',
  },
  {
    id: 'fw2',
    memberId: 'm2',
    memberName: 'Meseret Alemu',
    chargeCode: 'CHG-WDL',
    chargeName: 'Withdrawal Fee',
    dateFrom: '2026-09-01',
    dateTo: '2026-09-30',
    amount: 5,
    reason: 'First withdrawal of the month for a member in good standing.',
    status: 'Pending',
    requestedBy: 'Rahel Abebe',
    requestedAt: '2026-09-05T10:40:00',
  },
  {
    id: 'fw3',
    memberId: 'm3',
    memberName: 'Dawit Tesfaye',
    chargeCode: 'CHG-PEN',
    chargeName: 'Late Payment Penalty',
    dateFrom: '2026-06-01',
    dateTo: '2026-06-30',
    amount: 1200,
    reason: 'Penalty waiver after documented medical emergency and early settlement.',
    status: 'Approved',
    requestedBy: 'Biruk Kebede',
    approvedBy: 'Tigist Fikre',
    requestedAt: '2026-07-03T08:30:00',
    decidedAt: '2026-07-03T16:05:00',
  },
  {
    id: 'fw4',
    memberId: 'm4',
    memberName: 'Hanna Girma',
    chargeCode: 'CHG-SVC',
    chargeName: 'Monthly Service Charge',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    amount: 300,
    reason: 'Institutional account service charge waiver for a dormant reactivated account.',
    status: 'Approved',
    requestedBy: 'Marta Demissie',
    approvedBy: 'Sisay Worku',
    requestedAt: '2026-07-01T11:00:00',
    decidedAt: '2026-07-02T09:10:00',
  },
  {
    id: 'fw5',
    memberId: 'm5',
    memberName: 'Yonas Tadesse',
    chargeCode: 'CHG-WDL',
    chargeName: 'Withdrawal Fee',
    dateFrom: '2026-08-10',
    dateTo: '2026-08-10',
    amount: 50,
    reason: 'Requested waiver on multiple over-the-counter withdrawals.',
    status: 'Rejected',
    requestedBy: 'Rahel Abebe',
    approvedBy: 'Tigist Fikre',
    requestedAt: '2026-08-10T13:25:00',
    decidedAt: '2026-08-11T08:00:00',
  },
  {
    id: 'fw6',
    memberId: 'm6',
    memberName: 'Selamawit Haile',
    chargeCode: 'CHG-PEN',
    chargeName: 'Late Payment Penalty',
    dateFrom: '2026-09-01',
    dateTo: '2026-09-30',
    amount: 800,
    reason: 'Waiver requested by the branch while the member is on deployment.',
    status: 'Pending',
    requestedBy: 'Tigist Fikre',
    requestedAt: '2026-09-08T09:45:00',
  },
];

let seq = feeWaivers.length;

export const feeWaiverHandlers = [
  http.get('/api/fee-waivers', async () => {
    await delay(250);
    return json(feeWaivers);
  }),

  http.post('/api/fee-waivers', async ({ request }) => {
    await delay(450);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return err('Invalid JSON body', 400);
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return err('Amount must be greater than zero', 400);
    }

    const dateFrom = String(body.dateFrom ?? '');
    const dateTo = String(body.dateTo ?? '');
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      return err('dateFrom must be on or before dateTo', 400);
    }

    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) return err('Reason is required', 400);

    const member = memberById(body.memberId);
    if (!member) return err('Member not found', 400);

    const charge = chargeByCode(body.chargeCode);
    if (!charge) return err('Charge not found', 400);

    seq += 1;
    const waiver: FeeWaiver = {
      id: `fw-${Date.now()}-${seq}`,
      memberId: member.id,
      memberName: member.fullName,
      chargeCode: charge.code,
      chargeName: charge.name,
      dateFrom,
      dateTo,
      amount,
      reason,
      status: 'Pending',
      requestedBy:
        typeof body.requestedBy === 'string' && body.requestedBy.trim()
          ? body.requestedBy
          : DEFAULT_REQUESTER,
      requestedAt: new Date().toISOString(),
    };
    feeWaivers.unshift(waiver);
    return json(waiver);
  }),

  http.post('/api/fee-waivers/:id/approve', async ({ params, request }) => {
    await delay(400);
    const waiver = feeWaivers.find((w) => w.id === params.id);
    if (!waiver) return err('Fee waiver not found', 404);

    const body = (await request.json().catch(() => ({}))) as { approvedBy?: string };
    const approvedBy =
      typeof body.approvedBy === 'string' && body.approvedBy.trim()
        ? body.approvedBy
        : DEFAULT_REQUESTER;

    if (waiver.status !== 'Pending') {
      return err(`Only pending waivers can be approved (current: ${waiver.status})`, 400);
    }
    if (approvedBy === waiver.requestedBy) {
      return err('Maker and checker must be different users', 400);
    }

    waiver.status = 'Approved';
    waiver.approvedBy = approvedBy;
    waiver.decidedAt = new Date().toISOString();
    return json(waiver);
  }),

  http.post('/api/fee-waivers/:id/reject', async ({ params, request }) => {
    await delay(400);
    const waiver = feeWaivers.find((w) => w.id === params.id);
    if (!waiver) return err('Fee waiver not found', 404);
    if (waiver.status !== 'Pending') {
      return err(`Only pending waivers can be rejected (current: ${waiver.status})`, 400);
    }
    await request.json().catch(() => ({}));
    waiver.status = 'Rejected';
    waiver.decidedAt = new Date().toISOString();
    return json(waiver);
  }),
];
