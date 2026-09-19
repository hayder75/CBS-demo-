import { http, HttpResponse, delay } from 'msw';
import type { GaResolution } from '../../types';
import { members } from '../data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const err = (message: string, status: number) => HttpResponse.json({ error: message }, { status });

const round2 = (n: number) => Math.round(n * 100) / 100;

function eligibleStats() {
  const eligible = members.filter((m) => m.shareBalance > 0);
  const totalShares = eligible.reduce((s, m) => s + m.shareBalance, 0);
  return { eligibleMembers: eligible.length, totalShares };
}

interface NewResolution {
  id: string;
  ref: string;
  year: number;
  totalSurplus: number;
  dividendPct: number;
  reservePct: number;
  status: GaResolution['status'];
  createdBy: string;
  createdAt: string;
  note?: string;
  approvedBy?: string;
  approvedAt?: string;
  executedAt?: string;
}

function buildResolution(input: NewResolution): GaResolution {
  const { eligibleMembers, totalShares } = eligibleStats();
  const distributable = round2((input.totalSurplus * (input.dividendPct + input.reservePct)) / 100);
  const totalDividend = round2((input.totalSurplus * input.dividendPct) / 100);
  const totalReserve = round2((input.totalSurplus * input.reservePct) / 100);
  const dividendPerShare = totalShares > 0 ? round2(totalDividend / totalShares) : 0;
  return {
    id: input.id,
    ref: input.ref,
    year: input.year,
    totalSurplus: input.totalSurplus,
    dividendPct: input.dividendPct,
    reservePct: input.reservePct,
    distributable,
    dividendPerShare,
    eligibleMembers,
    totalDividend,
    totalReserve,
    status: input.status,
    createdBy: input.createdBy,
    approvedBy: input.approvedBy,
    createdAt: input.createdAt,
    approvedAt: input.approvedAt,
    executedAt: input.executedAt,
    note: input.note,
  };
}

let idCounter = 0;
const nextId = () => `ga-${Date.now()}-${++idCounter}`;

const seed: NewResolution[] = [
  {
    id: 'ga-2024-01',
    ref: 'GA-2024-1',
    year: 2024,
    totalSurplus: 5200000,
    dividendPct: 60,
    reservePct: 15,
    status: 'Executed',
    createdBy: 'Marta Demissie',
    createdAt: '2024-12-20T09:30:00',
    approvedBy: 'Tigist Fikre',
    approvedAt: '2025-01-10T10:15:00',
    executedAt: '2025-01-20T08:00:00',
    note: 'Approved by the 2024 General Assembly; dividends credited to withdrawable accounts.',
  },
  {
    id: 'ga-2025-01',
    ref: 'GA-2025-1',
    year: 2025,
    totalSurplus: 5800000,
    dividendPct: 65,
    reservePct: 15,
    status: 'Executed',
    createdBy: 'Marta Demissie',
    createdAt: '2025-12-18T09:00:00',
    approvedBy: 'Tigist Fikre',
    approvedAt: '2026-01-08T11:20:00',
    executedAt: '2026-01-18T08:30:00',
    note: 'Reserve top-up funded from prior year retained earnings.',
  },
  {
    id: 'ga-2026-01',
    ref: 'GA-2026-1',
    year: 2026,
    totalSurplus: 6400000,
    dividendPct: 60,
    reservePct: 15,
    status: 'Draft',
    createdBy: 'Marta Demissie',
    createdAt: '2026-09-01T09:00:00',
    note: 'Proposed distribution pending board review and General Assembly approval.',
  },
];

export const gaResolutions: GaResolution[] = seed.map(buildResolution);

export const generalAssemblyHandlers = [
  http.get('/api/ga-resolutions', () => json(gaResolutions)),

  http.post('/api/ga-resolutions', async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as Record<string, unknown>;
    const year = Number(body.year);
    const totalSurplus = Number(body.totalSurplus);
    const dividendPct = Number(body.dividendPct);
    const reservePct = Number(body.reservePct);

    if (!Number.isFinite(year) || year <= 0) return err('A valid financial year is required', 400);
    if (!Number.isFinite(totalSurplus) || totalSurplus <= 0) {
      return err('Total surplus must be greater than zero', 400);
    }
    if (!Number.isFinite(dividendPct) || dividendPct < 0 || dividendPct > 100) {
      return err('Dividend percentage must be between 0 and 100', 400);
    }
    if (!Number.isFinite(reservePct) || reservePct < 0 || reservePct > 100) {
      return err('Reserve percentage must be between 0 and 100', 400);
    }
    if (dividendPct + reservePct > 100) {
      return err('Dividend % plus reserve % cannot exceed 100%', 400);
    }
    if (gaResolutions.some((r) => r.year === year && r.status !== 'Rejected')) {
      return err(`A resolution for ${year} already exists`, 400);
    }

    const existingForYear = gaResolutions.filter((r) => r.year === year).length;
    const created = buildResolution({
      id: nextId(),
      ref: `GA-${year}-${existingForYear + 1}`,
      year,
      totalSurplus,
      dividendPct,
      reservePct,
      status: 'Draft',
      createdBy: String(body.createdBy ?? 'Kaleab Desta'),
      createdAt: new Date().toISOString(),
      note: body.note ? String(body.note) : undefined,
    });
    gaResolutions.unshift(created);
    return json(created);
  }),

  http.post('/api/ga-resolutions/:id/approve', async ({ params, request }) => {
    await delay(400);
    const resolution = gaResolutions.find((r) => r.id === params.id);
    if (!resolution) return err('Resolution not found', 404);
    const body = (await request.json().catch(() => ({}))) as { approvedBy?: string };
    const approvedBy = body.approvedBy ?? 'Tigist Fikre';
    if (resolution.status !== 'Draft') {
      return err(`Only draft resolutions can be approved (current: ${resolution.status})`, 400);
    }
    if (approvedBy === resolution.createdBy) {
      return err('Maker and checker must be different users', 400);
    }
    resolution.status = 'Approved';
    resolution.approvedBy = approvedBy;
    resolution.approvedAt = new Date().toISOString();
    return json(resolution);
  }),

  http.post('/api/ga-resolutions/:id/reject', async ({ params, request }) => {
    await delay(400);
    const resolution = gaResolutions.find((r) => r.id === params.id);
    if (!resolution) return err('Resolution not found', 404);
    if (resolution.status !== 'Draft') {
      return err(`Only draft resolutions can be rejected (current: ${resolution.status})`, 400);
    }
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    resolution.status = 'Rejected';
    if (body.reason) resolution.note = body.reason;
    return json(resolution);
  }),

  http.post('/api/ga-resolutions/:id/execute', async ({ params }) => {
    await delay(600);
    const resolution = gaResolutions.find((r) => r.id === params.id);
    if (!resolution) return err('Resolution not found', 404);
    if (resolution.status !== 'Approved') {
      return err(`Only approved resolutions can be executed (current: ${resolution.status})`, 400);
    }
    resolution.status = 'Executed';
    resolution.executedAt = new Date().toISOString();
    return json(resolution);
  }),
];
