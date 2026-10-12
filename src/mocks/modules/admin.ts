import { http, HttpResponse } from 'msw';
import type { DeviceAccess, Holiday, OrgProfile, UserGroup } from '../../types';
import { users } from '../data';

let seq = 100;

const holidays: Holiday[] = [
  { id: 'h1', name: 'Ethiopian New Year (Enkutatash)', holidayDate: '2026-09-11', recurring: false, holidayType: 'Public', description: 'Start of the Ethiopian year', status: 'Active' },
  { id: 'h2', name: 'Meskel', holidayDate: '2026-09-27', recurring: false, holidayType: 'Public', description: 'Finding of the True Cross', status: 'Active' },
  { id: 'h3', name: 'Ethiopian Christmas (Genna)', holidayDate: '2027-01-07', recurring: true, holidayType: 'Public', description: 'Orthodox Christmas', status: 'Active' },
  { id: 'h4', name: 'Timket', holidayDate: '2027-01-19', recurring: true, holidayType: 'Public', description: 'Epiphany', status: 'Active' },
  { id: 'h5', name: 'Labour Day', holidayDate: '2027-05-01', recurring: true, holidayType: 'Public', description: 'International Workers Day', status: 'Active' },
  { id: 'h6', name: 'Financial Year End Close', holidayDate: '2027-07-07', recurring: true, holidayType: 'Internal', description: 'Books closed for the fiscal year', status: 'Active' },
];

const userGroups: UserGroup[] = [
  { id: 'g1', name: 'Super Admin', code: 'SUPER_ADMIN', maxLoginAttempts: 10, multipleMachineLogins: true, branchSpecific: false, multipleUsers: true, description: 'Full system access', permissions: 'members,accounts,shares,loans,finance,payments,reports,audit,admin', status: 'Verified' },
  { id: 'g2', name: 'Admin', code: 'ADMIN', maxLoginAttempts: 5, multipleMachineLogins: false, branchSpecific: false, multipleUsers: true, description: 'System administrator', permissions: 'members,accounts,shares,loans,finance,payments,reports,audit,admin', status: 'Verified' },
  { id: 'g3', name: 'Manager', code: 'MANAGER', maxLoginAttempts: 5, multipleMachineLogins: false, branchSpecific: true, multipleUsers: true, description: 'Branch manager', permissions: 'members,accounts,shares,loans,finance,payments,reports,audit', status: 'Verified' },
  { id: 'g4', name: 'Cashier', code: 'CASHIER', maxLoginAttempts: 5, multipleMachineLogins: false, branchSpecific: true, multipleUsers: true, description: 'Teller / cashier', permissions: 'members,accounts,payments', status: 'Verified' },
  { id: 'g5', name: 'Customer Service Officer', code: 'CSO', maxLoginAttempts: 5, multipleMachineLogins: false, branchSpecific: true, multipleUsers: true, description: 'Front office', permissions: 'members,accounts,shares', status: 'Verified' },
  { id: 'g6', name: 'Accountant', code: 'ACCOUNTANT', maxLoginAttempts: 5, multipleMachineLogins: false, branchSpecific: false, multipleUsers: true, description: 'Finance officer', permissions: 'finance,accounts,reports', status: 'Verified' },
  { id: 'g7', name: 'Loan Officer', code: 'LOAN_OFFICER', maxLoginAttempts: 5, multipleMachineLogins: false, branchSpecific: true, multipleUsers: true, description: 'Credit officer', permissions: 'members,loans,collateral', status: 'Verified' },
  { id: 'g8', name: 'Auditor', code: 'AUDITOR', maxLoginAttempts: 5, multipleMachineLogins: false, branchSpecific: false, multipleUsers: true, description: 'Internal auditor', permissions: 'reports,audit', status: 'Verified' },
];

const deviceAccesses: DeviceAccess[] = [
  { id: 'd1', username: 'workineh-wss', deviceName: 'Dell OptiPlex 7090', deviceId: 'DEV-A1B2C3', ipAddress: '10.10.4.21', location: 'ATOTE BRANCH', authorized: true, lastSeen: '2026-09-22T19:40:00', status: 'Authorized' },
  { id: 'd2', username: 'kabine-wss', deviceName: 'HP ProDesk 400', deviceId: 'DEV-D4E5F6', ipAddress: '10.10.4.22', location: 'AREBSEFER', authorized: true, lastSeen: '2026-09-22T18:10:00', status: 'Authorized' },
  { id: 'd3', username: 'meront-wss', deviceName: 'Lenovo ThinkCentre', deviceId: 'DEV-778899', ipAddress: '10.10.4.10', location: 'ATOTE BRANCH', authorized: true, lastSeen: '2026-09-22T19:55:00', status: 'Authorized' },
  { id: 'd4', username: 'unknown', deviceName: 'Unknown Device', deviceId: 'DEV-000000', ipAddress: '196.188.10.7', location: 'External', authorized: false, lastSeen: '2026-09-20T02:14:00', status: 'Blocked' },
];

const orgProfile: OrgProfile = {
  id: 'o1', name: 'Test MFI', legalName: 'Test Microfinance Institution S.C.', registrationNo: 'REG-MFI-0001',
  tin: 'TIN-0001234567', phone: '+251 11 555 0100', email: 'info@testmfi.et', address: 'Bole Road, Kirkos',
  city: 'Addis Ababa', country: 'Ethiopia', currencyCode: 'ETB', fiscalYearStart: 'Hamle 1', logoColor: '#0e7a5f', status: 'Active',
};

const body = async (request: Request) => (await request.json().catch(() => ({}))) as Record<string, unknown>;
const nid = () => String(++seq);

export const adminConsoleHandlers = [
  http.get('/api/holidays', () => HttpResponse.json([...holidays].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate)))),
  http.post('/api/holidays', async ({ request }) => {
    const b = await body(request);
    if (!b.name || !b.holidayDate) return HttpResponse.json({ error: 'name and holidayDate are required' }, { status: 400 });
    const h: Holiday = {
      id: nid(), name: String(b.name), holidayDate: String(b.holidayDate),
      recurring: Boolean(b.recurring), holidayType: (b.holidayType as Holiday['holidayType']) ?? 'Public',
      description: b.description as string | undefined, status: 'Active',
    };
    holidays.push(h);
    return HttpResponse.json(h);
  }),
  http.delete('/api/holidays/:id', ({ params }) => {
    const i = holidays.findIndex((h) => h.id === params.id);
    if (i >= 0) holidays.splice(i, 1);
    return HttpResponse.json({ ok: true });
  }),

  http.get('/api/user-groups', () => HttpResponse.json(userGroups)),
  http.post('/api/user-groups', async ({ request }) => {
    const b = await body(request);
    if (!b.name || !b.code) return HttpResponse.json({ error: 'name and code are required' }, { status: 400 });
    if (userGroups.some((g) => g.code === b.code)) return HttpResponse.json({ error: 'group code already exists' }, { status: 400 });
    const perms = Array.isArray(b.permissions) ? (b.permissions as string[]).join(',') : String(b.permissions ?? '');
    const g: UserGroup = {
      id: nid(), name: String(b.name), code: String(b.code),
      maxLoginAttempts: Number(b.maxLoginAttempts ?? 5),
      multipleMachineLogins: Boolean(b.multipleMachineLogins),
      branchSpecific: Boolean(b.branchSpecific),
      multipleUsers: b.multipleUsers === undefined ? true : Boolean(b.multipleUsers),
      description: b.description as string | undefined, permissions: perms, status: 'Pending',
    };
    userGroups.push(g);
    return HttpResponse.json(g);
  }),
  http.put('/api/user-groups/:id', async ({ params, request }) => {
    const g = userGroups.find((x) => x.id === params.id);
    if (!g) return HttpResponse.json({ error: 'not found' }, { status: 404 });
    const b = await body(request);
    if (b.name !== undefined) g.name = String(b.name);
    if (b.permissions !== undefined) g.permissions = Array.isArray(b.permissions) ? (b.permissions as string[]).join(',') : String(b.permissions);
    if (b.status !== undefined) g.status = String(b.status);
    return HttpResponse.json(g);
  }),
  http.post('/api/user-groups/:id/verify', ({ params }) => {
    const g = userGroups.find((x) => x.id === params.id);
    if (g) g.status = 'Verified';
    return HttpResponse.json(g ?? {});
  }),
  http.delete('/api/user-groups/:id', ({ params }) => {
    const i = userGroups.findIndex((g) => g.id === params.id);
    if (i >= 0) userGroups.splice(i, 1);
    return HttpResponse.json({ ok: true });
  }),

  http.get('/api/device-accesses', () => HttpResponse.json(deviceAccesses)),
  http.post('/api/device-accesses/:id/authorize', ({ params }) => {
    const d = deviceAccesses.find((x) => x.id === params.id);
    if (d) { d.authorized = true; d.status = 'Authorized'; }
    return HttpResponse.json(d ?? {});
  }),
  http.post('/api/device-accesses/:id/block', ({ params }) => {
    const d = deviceAccesses.find((x) => x.id === params.id);
    if (d) { d.authorized = false; d.status = 'Blocked'; }
    return HttpResponse.json(d ?? {});
  }),

  http.get('/api/org-profile', () => HttpResponse.json(orgProfile)),
  http.put('/api/org-profile', async ({ request }) => {
    const b = await body(request);
    Object.assign(orgProfile, b);
    return HttpResponse.json(orgProfile);
  }),

  http.post('/api/auth/users', async ({ request }) => {
    const b = await body(request);
    if (!b.username || !b.name || !b.role) return HttpResponse.json({ error: 'username, name and role are required' }, { status: 400 });
    if (users.some((u) => u.username === b.username)) return HttpResponse.json({ error: 'username already exists' }, { status: 400 });
    const u = {
      id: nid(), username: String(b.username), name: String(b.name), role: String(b.role),
      title: (b.title as string) ?? String(b.role), branch: (b.branch as string) ?? 'Head Office',
      lastLogin: null as string | null,
    };
    users.push(u as (typeof users)[number]);
    return HttpResponse.json(u);
  }),
];
