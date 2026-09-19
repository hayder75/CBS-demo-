import { http, HttpResponse, delay } from 'msw';
import dayjs from 'dayjs';
import type { BranchCob, DayControlState, EodRun, EodStep, EodStepStatus } from '../../types';

const stepNames = [
  'Maintenance Fees',
  'TFS Maturity',
  'Loan Auto-Debit',
  'Penalties',
  'Loan Classification',
  'Provisions',
  'Dormant Accounts',
  'Dormant Members',
];

const buildSteps = (prefix: string, status: EodStepStatus): EodStep[] =>
  stepNames.map((name, i) => ({
    key: `${prefix}-step-${i + 1}`,
    name,
    status,
    processed: status === 'Done' ? 10 + i * 5 : 0,
  }));

let businessDate = '2026-09-15';
let nextBusinessDate = '2026-09-16';
let status: DayControlState['status'] = 'Open';
let lastEodDate: string | undefined = '2026-09-14';

const branchSeed = [
  { branchId: '1', branch: 'Head Office' },
  { branchId: '2', branch: 'Bole Branch' },
  { branchId: '3', branch: 'Piassa Branch' },
  { branchId: '4', branch: 'Grand Mexico Branch' },
];

let branches: BranchCob[] = branchSeed.map((b) => ({
  id: `cob-${b.branchId}`,
  branchId: b.branchId,
  branch: b.branch,
  businessDate,
  status: 'Open',
}));

let eodRuns: EodRun[] = [
  {
    id: 'eod-2026-09-14',
    businessDate: '2026-09-14',
    status: 'Completed',
    startedAt: '2026-09-14T18:05:00.000Z',
    completedAt: '2026-09-14T18:07:30.000Z',
    startedBy: 'Tigist Fikre',
    steps: buildSteps('eod-2026-09-14', 'Done'),
  },
];

const currentState = (): DayControlState => ({
  businessDate,
  nextBusinessDate,
  status,
  lastEodDate,
  eodRuns,
  branches,
});

const findBranch = (rawId: unknown): BranchCob | undefined => {
  const id = String(rawId ?? '');
  return branches.find((b) => b.branchId === id || b.id === id);
};

export const dayControlHandlers = [
  http.get('/api/day-control', async () => {
    await delay(200);
    return HttpResponse.json(currentState());
  }),

  http.post('/api/day-control/cob/close', async ({ request }) => {
    await delay(300);
    const body = (await request.json().catch(() => ({}))) as { branchId?: string; closedBy?: string };
    if (status === 'EOD Completed') {
      return HttpResponse.json(
        { error: 'End-of-day is already completed for the current business date' },
        { status: 400 },
      );
    }
    const branch = findBranch(body.branchId);
    if (!branch) return HttpResponse.json({ error: 'Branch not found' }, { status: 404 });
    if (branch.status === 'Closed') {
      return HttpResponse.json({ error: 'Branch close-of-business is already done' }, { status: 400 });
    }
    branch.status = 'Closed';
    branch.closedBy = body.closedBy ?? 'Tigist Fikre';
    branch.closedAt = new Date().toISOString();
    return HttpResponse.json(branch);
  }),

  http.post('/api/day-control/cob/reopen', async ({ request }) => {
    await delay(300);
    const body = (await request.json().catch(() => ({}))) as { branchId?: string };
    if (status === 'EOD Completed') {
      return HttpResponse.json(
        { error: 'Cannot reopen a branch after end-of-day is completed' },
        { status: 400 },
      );
    }
    const branch = findBranch(body.branchId);
    if (!branch) return HttpResponse.json({ error: 'Branch not found' }, { status: 404 });
    if (branch.status === 'Open') {
      return HttpResponse.json({ error: 'Branch close-of-business is already open' }, { status: 400 });
    }
    branch.status = 'Open';
    branch.closedBy = undefined;
    branch.closedAt = undefined;
    return HttpResponse.json(branch);
  }),

  http.post('/api/day-control/eod/run', async () => {
    await delay(700);
    if (status === 'EOD Running') {
      return HttpResponse.json({ error: 'An end-of-day run is already in progress' }, { status: 400 });
    }
    if (status === 'EOD Completed') {
      return HttpResponse.json({ error: 'End-of-day has already been completed' }, { status: 400 });
    }
    const openBranches = branches.filter((b) => b.status === 'Open');
    if (openBranches.length > 0) {
      return HttpResponse.json(
        { error: `Cannot run EOD: ${openBranches.length} branch(es) still open` },
        { status: 400 },
      );
    }
    const startedAt = new Date().toISOString();
    const run: EodRun = {
      id: `eod-${Date.now()}`,
      businessDate,
      status: 'Running',
      startedAt,
      startedBy: 'Tigist Fikre',
      steps: buildSteps(`eod-${Date.now()}`, 'Done'),
    };
    status = 'EOD Running';
    eodRuns = [run, ...eodRuns];
    run.status = 'Completed';
    run.completedAt = new Date().toISOString();
    lastEodDate = businessDate;
    status = 'EOD Completed';
    return HttpResponse.json(run);
  }),

  http.post('/api/day-control/advance', async () => {
    await delay(400);
    if (status !== 'EOD Completed') {
      return HttpResponse.json(
        { error: 'End-of-day must complete before advancing the business date' },
        { status: 400 },
      );
    }
    businessDate = nextBusinessDate;
    nextBusinessDate = dayjs(businessDate).add(1, 'day').format('YYYY-MM-DD');
    status = 'Open';
    lastEodDate = undefined;
    branches = branches.map((b) => ({
      ...b,
      businessDate,
      status: 'Open',
      closedBy: undefined,
      closedAt: undefined,
    }));
    return HttpResponse.json(currentState());
  }),
];
