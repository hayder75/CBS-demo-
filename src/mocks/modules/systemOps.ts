import { http, HttpResponse, delay } from 'msw';
import type { BackupRecord } from '../../types';

export interface SchedulerJob {
  id: string;
  name: string;
  cron: string;
  lastRun: string;
  nextRun: string;
  status: 'Idle' | 'Running' | 'Ok' | 'Failed';
}

export interface CacheInfo {
  keys: number;
  lastClearedAt: string | null;
}

export interface HealthInfo {
  db: 'up' | 'down';
  cache: 'up' | 'down';
  storagePct: number;
  uptime: number;
}

const seedBackups = (): BackupRecord[] => [
  {
    id: 'bk-seed-1',
    fileName: 'cbs_backup_20260918_230000.sql',
    sizeKb: 7420,
    createdAt: '2026-09-18T20:00:00.000Z',
    createdBy: 'Scheduler',
    kind: 'Scheduled',
  },
  {
    id: 'bk-seed-2',
    fileName: 'cbs_backup_20260917_230000.sql',
    sizeKb: 7185,
    createdAt: '2026-09-17T20:00:00.000Z',
    createdBy: 'Scheduler',
    kind: 'Scheduled',
  },
  {
    id: 'bk-seed-3',
    fileName: 'cbs_backup_20260916_141205.sql',
    sizeKb: 6903,
    createdAt: '2026-09-16T11:12:05.000Z',
    createdBy: 'Tigist Fikre',
    kind: 'Manual',
  },
  {
    id: 'bk-seed-4',
    fileName: 'cbs_backup_20260915_230000.sql',
    sizeKb: 6640,
    createdAt: '2026-09-15T20:00:00.000Z',
    createdBy: 'Scheduler',
    kind: 'Scheduled',
  },
];

const seedJobs = (): SchedulerJob[] => [
  {
    id: 'job-seed-1',
    name: 'Nightly Full Backup',
    cron: '0 0 2 * * ?',
    lastRun: '2026-09-18T23:00:00.000Z',
    nextRun: '2026-09-19T23:00:00.000Z',
    status: 'Idle',
  },
  {
    id: 'job-seed-2',
    name: 'Savings Interest Accrual',
    cron: '0 15 23 * * ?',
    lastRun: '2026-09-18T20:15:00.000Z',
    nextRun: '2026-09-19T20:15:00.000Z',
    status: 'Ok',
  },
  {
    id: 'job-seed-3',
    name: 'Loan Arrears Classification',
    cron: '0 30 1 * * ?',
    lastRun: '2026-09-18T22:30:00.000Z',
    nextRun: '2026-09-19T22:30:00.000Z',
    status: 'Ok',
  },
  {
    id: 'job-seed-4',
    name: 'Statement Dispatch',
    cron: '0 0 6 * * MON',
    lastRun: '2026-09-15T03:00:00.000Z',
    nextRun: '2026-09-22T03:00:00.000Z',
    status: 'Idle',
  },
  {
    id: 'job-seed-5',
    name: 'Cache Warmup',
    cron: '0 */30 * * * ?',
    lastRun: '2026-09-18T21:30:00.000Z',
    nextRun: '2026-09-19T22:00:00.000Z',
    status: 'Failed',
  },
];

const backups: BackupRecord[] = seedBackups();
const schedulerJobs: SchedulerJob[] = seedJobs();
const cacheState: CacheInfo = { keys: 486, lastClearedAt: null };

let backupSeq = backups.length;
let jobSeq = schedulerJobs.length;

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const pad = (n: number) => String(n).padStart(2, '0');

const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

const minuteOf = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const asString = (value: unknown) =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

export const systemOpsHandlers = [
  http.get('/api/system/backups', async () => {
    await delay(250);
    return json([...backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }),

  http.post('/api/system/backups', async ({ request }) => {
    await delay(800);
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const now = new Date();
    const minuteKey = minuteOf(now.toISOString());
    if (backups.some((b) => minuteKey != null && minuteOf(b.createdAt) === minuteKey)) {
      return HttpResponse.json(
        { error: 'A backup was already created within the last minute' },
        { status: 400 },
      );
    }

    const kind = asString(body.kind) === 'Scheduled' ? 'Scheduled' : 'Manual';
    const createdBy = asString(body.createdBy).trim() || 'System';

    const record: BackupRecord = {
      id: `bk-${Date.now()}-${++backupSeq}`,
      fileName: `cbs_backup_${stamp(now)}.sql`,
      sizeKb: Math.floor(Math.random() * 7001) + 2000,
      createdAt: now.toISOString(),
      createdBy,
      kind,
    };
    backups.unshift(record);
    return json(record);
  }),

  http.delete('/api/system/backups/:id', async ({ params }) => {
    await delay(300);
    const index = backups.findIndex((b) => b.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'Backup not found' }, { status: 404 });
    }
    const [removed] = backups.splice(index, 1);
    return json({ ok: true, removed });
  }),

  http.get('/api/system/cache', async () => {
    await delay(200);
    return json({ ...cacheState });
  }),

  http.post('/api/system/cache/clear', async () => {
    await delay(600);
    const clearedKeys = cacheState.keys;
    cacheState.keys = 0;
    cacheState.lastClearedAt = new Date().toISOString();
    return json({ cleared: true, keys: clearedKeys, clearedAt: cacheState.lastClearedAt });
  }),

  http.get('/api/system/scheduler', async () => {
    await delay(250);
    return json(schedulerJobs);
  }),

  http.post('/api/system/scheduler/:id/run', async ({ params }) => {
    await delay(700);
    const job = schedulerJobs.find((j) => j.id === params.id);
    if (!job) {
      return HttpResponse.json({ error: 'Scheduled job not found' }, { status: 404 });
    }
    job.status = 'Ok';
    job.lastRun = new Date().toISOString();
    job.nextRun = new Date(Date.now() + 86_400_000).toISOString();
    return json(job);
  }),

  http.get('/api/system/health', async () => {
    await delay(250);
    const totalKb = backups.reduce((sum, b) => sum + b.sizeKb, 0);
    const capacityKb = 200_000;
    const storagePct = Math.min(99, Math.round((totalKb / capacityKb) * 1000) / 10);
    return json({
      db: 'up',
      cache: 'up',
      storagePct,
      uptime: 1_645_200 + jobSeq * 60,
    });
  }),
];

export { backups as systemBackups, schedulerJobs as systemSchedulerJobs };
