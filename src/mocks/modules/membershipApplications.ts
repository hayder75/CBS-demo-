import { delay, http, HttpResponse } from 'msw';
import type {
  Member,
  MembershipApplication,
  SavingsAccount,
  ShareAccount,
} from '../../types';
import { members, savingsAccounts, shareAccounts } from '../data';

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const ENTRANCE_FEE = 200;
const REGISTRATION_FEE = 50;

let applicationSeq = 5;

export const membershipApplications: MembershipApplication[] = [
  {
    id: 'ma-1',
    applicationNo: 'APP-2026-001',
    applicantType: 'Individual',
    fullName: 'Mekdes Asrat',
    faydaId: 'FAY-4820193377',
    phone: '+251 911 204 887',
    email: 'mekdes.asrat@gmail.com',
    employer: 'Ethio Telecom',
    branch: 'Bole Branch',
    shareProductId: '1',
    shareCount: 40,
    compulsoryProductId: 'sp1',
    entranceFee: ENTRANCE_FEE,
    registrationFee: REGISTRATION_FEE,
    paymentStatus: 'Paid',
    channel: 'Staff',
    status: 'Pending',
    submittedAt: '2026-09-04T09:12:00.000Z',
  },
  {
    id: 'ma-2',
    applicationNo: 'APP-2026-002',
    applicantType: 'Individual',
    fullName: 'Kalkidan Wolde',
    faydaId: 'FAY-5512340987',
    phone: '+251 912 778 341',
    email: 'kalkidan.wolde@gmail.com',
    branch: 'Piassa Branch',
    shareProductId: '1',
    shareCount: 25,
    compulsoryProductId: 'sp1',
    entranceFee: ENTRANCE_FEE,
    registrationFee: REGISTRATION_FEE,
    paymentStatus: 'Unpaid',
    channel: 'Portal',
    status: 'Pending',
    submittedAt: '2026-09-05T13:45:00.000Z',
  },
  {
    id: 'ma-3',
    applicationNo: 'APP-2026-003',
    applicantType: 'Entity',
    fullName: 'Bright Future Trading PLC',
    phone: '+251 11 662 4410',
    email: 'info@brightfuture.et',
    employer: 'Bright Future Trading PLC',
    branch: 'Head Office',
    shareProductId: '2',
    shareCount: 15,
    entranceFee: ENTRANCE_FEE,
    registrationFee: REGISTRATION_FEE,
    paymentStatus: 'Unpaid',
    channel: 'Staff',
    status: 'Pending',
    submittedAt: '2026-09-06T08:03:00.000Z',
  },
  {
    id: 'ma-4',
    applicationNo: 'APP-2026-004',
    applicantType: 'Individual',
    fullName: 'Bereket Nigussie',
    faydaId: 'FAY-7734102288',
    phone: '+251 913 556 902',
    email: 'bereket.nigussie@gmail.com',
    employer: 'Addis Ababa University',
    branch: 'Bole Branch',
    shareProductId: '1',
    shareCount: 60,
    compulsoryProductId: 'sp1',
    entranceFee: ENTRANCE_FEE,
    registrationFee: REGISTRATION_FEE,
    paymentStatus: 'Paid',
    channel: 'Staff',
    status: 'Approved',
    submittedAt: '2026-08-28T10:20:00.000Z',
    decidedBy: 'Tigist Fikre',
    decidedAt: '2026-08-29T11:00:00.000Z',
    createdMemberId: 'm4',
    createdShareAccountId: '2',
  },
  {
    id: 'ma-5',
    applicationNo: 'APP-2026-005',
    applicantType: 'Individual',
    fullName: 'Tsion Gebremariam',
    faydaId: 'FAY-9900187632',
    phone: '+251 914 320 118',
    branch: 'Grand / Mexico Branch',
    shareProductId: '1',
    shareCount: 30,
    entranceFee: ENTRANCE_FEE,
    registrationFee: REGISTRATION_FEE,
    paymentStatus: 'Unpaid',
    channel: 'Portal',
    status: 'Rejected',
    submittedAt: '2026-08-27T15:30:00.000Z',
    decidedBy: 'Tigist Fikre',
    decidedAt: '2026-08-28T09:05:00.000Z',
    rejectReason: 'Fayda ID details could not be verified.',
  },
];

const nextApplicationNo = () => `APP-2026-${String(++applicationSeq).padStart(3, '0')}`;

const asString = (v: unknown): string | undefined => (v == null ? undefined : String(v));

export const membershipApplicationHandlers = [
  http.get('/api/membership-applications', () => json(membershipApplications)),

  http.post('/api/membership-applications', async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = asString(body.fullName)?.trim();
    const phone = asString(body.phone)?.trim();
    const shareCount = Number(body.shareCount ?? 0);
    if (!fullName) return HttpResponse.json({ error: 'fullName is required' }, { status: 400 });
    if (!phone) return HttpResponse.json({ error: 'phone is required' }, { status: 400 });
    if (!Number.isFinite(shareCount) || shareCount < 1) {
      return HttpResponse.json({ error: 'shareCount must be at least 1' }, { status: 400 });
    }
    const application: MembershipApplication = {
      id: `ma-${Date.now()}`,
      applicationNo: nextApplicationNo(),
      applicantType: body.applicantType === 'Entity' ? 'Entity' : 'Individual',
      fullName,
      faydaId: asString(body.faydaId),
      phone,
      email: asString(body.email),
      employer: asString(body.employer),
      branch: asString(body.branch) ?? 'Head Office',
      shareProductId: asString(body.shareProductId) ?? '1',
      shareCount,
      compulsoryProductId: asString(body.compulsoryProductId),
      entranceFee: ENTRANCE_FEE,
      registrationFee: REGISTRATION_FEE,
      paymentStatus: 'Unpaid',
      channel: body.channel === 'Portal' ? 'Portal' : 'Staff',
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };
    membershipApplications.unshift(application);
    return json(application);
  }),

  http.post('/api/membership-applications/:id/pay', async ({ params }) => {
    await delay(300);
    const application = membershipApplications.find((a) => a.id === params.id);
    if (!application) return HttpResponse.json({ error: 'Application not found' }, { status: 404 });
    if (application.status !== 'Pending') {
      return HttpResponse.json({ error: 'Application already decided' }, { status: 400 });
    }
    application.paymentStatus = 'Paid';
    return json(application);
  }),

  http.post('/api/membership-applications/:id/approve', async ({ params }) => {
    await delay(500);
    const application = membershipApplications.find((a) => a.id === params.id);
    if (!application) return HttpResponse.json({ error: 'Application not found' }, { status: 404 });
    if (application.status !== 'Pending') {
      return HttpResponse.json({ error: 'Application already decided' }, { status: 400 });
    }
    if (application.paymentStatus !== 'Paid') {
      return HttpResponse.json({ error: 'Payment required before approval' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const memberId = `m${members.length + 1}`;
    const member: Member = {
      id: memberId,
      memberNo: `MEM-${String(members.length + 1).padStart(5, '0')}`,
      fullName: application.fullName,
      gender: 'M',
      birthDate: '',
      phone: application.phone,
      email: application.email,
      faydaId: application.faydaId ?? '',
      kebele: '',
      woreda: '',
      city: 'Addis Ababa',
      occupation: '',
      employer: application.employer,
      status: 'Active',
      joinDate: today,
      photoColor: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
      shareBalance: 0,
      savingsBalance: 0,
      loanOutstanding: 0,
      nextOfKin: [],
      beneficiaries: [],
    };
    members.unshift(member);

    let savingsAccountId: string | undefined;
    if (application.compulsoryProductId) {
      const savingsAccount: SavingsAccount = {
        id: String(savingsAccounts.length + 1),
        accountNo: `SA-${member.memberNo}-1`,
        memberId,
        productId: application.compulsoryProductId,
        accountType: 'Saving',
        openedDate: today,
        balance: 0,
        status: 'Active',
        currencyId: '1',
        branchId: '1',
      };
      savingsAccounts.push(savingsAccount);
      savingsAccountId = savingsAccount.id;
    }

    const shareAccountId = String(shareAccounts.length + 1);
    const shareAccount: ShareAccount = {
      id: shareAccountId,
      memberId,
      categoryId: application.shareProductId,
      savingAccountId: savingsAccountId ?? '',
      shareCount: application.shareCount,
      description: `Provisioned from ${application.applicationNo}`,
      status: 'Verified',
    };
    shareAccounts.push(shareAccount);

    application.status = 'Approved';
    application.decidedBy = 'Tigist Fikre';
    application.decidedAt = new Date().toISOString();
    application.createdMemberId = memberId;
    application.createdShareAccountId = shareAccountId;
    return json(application);
  }),

  http.post('/api/membership-applications/:id/reject', async ({ params, request }) => {
    await delay(400);
    const application = membershipApplications.find((a) => a.id === params.id);
    if (!application) return HttpResponse.json({ error: 'Application not found' }, { status: 404 });
    if (application.status !== 'Pending') {
      return HttpResponse.json({ error: 'Application already decided' }, { status: 400 });
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const reason = asString(body.reason)?.trim();
    if (!reason) {
      return HttpResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }
    application.status = 'Rejected';
    application.rejectReason = reason;
    application.decidedBy = 'Tigist Fikre';
    application.decidedAt = new Date().toISOString();
    return json(application);
  }),
];
