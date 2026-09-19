import { http, HttpResponse, delay } from 'msw';
import type { GatewaySettings, NotificationTemplate } from '../../types';

export const notificationTemplates: NotificationTemplate[] = [
  {
    id: 'nt1',
    code: 'TPL-DEP-001',
    name: 'Deposit Confirmation',
    channel: 'Email',
    event: 'Deposit',
    subject: 'Your deposit of {{amount}} has been received',
    body: 'Dear {{memberName}}, a deposit of {{amount}} to account {{accountNo}} was completed on {{date}}. Your new balance is {{balance}}.',
    enabled: true,
    updatedAt: '2026-08-14T09:15:00.000Z',
  },
  {
    id: 'nt2',
    code: 'TPL-WDL-001',
    name: 'Withdrawal Alert',
    channel: 'SMS',
    event: 'Withdrawal',
    body: 'Hi {{memberName}}, a withdrawal of {{amount}} was made from account {{accountNo}} on {{date}}. Balance: {{balance}}.',
    enabled: true,
    updatedAt: '2026-08-14T09:18:00.000Z',
  },
  {
    id: 'nt3',
    code: 'TPL-TRF-001',
    name: 'Transfer Notification',
    channel: 'Email',
    event: 'Transfer',
    subject: 'Transfer of {{amount}} completed',
    body: 'Dear {{memberName}}, your transfer of {{amount}} to {{beneficiary}} was successful. Reference {{reference}}.',
    enabled: true,
    updatedAt: '2026-08-20T11:02:00.000Z',
  },
  {
    id: 'nt4',
    code: 'TPL-LNA-001',
    name: 'Loan Approval Notice',
    channel: 'Email',
    event: 'Loan Approval',
    subject: 'Your loan {{loanNo}} is approved',
    body: 'Dear {{memberName}}, we are pleased to inform you that loan {{loanNo}} of {{amount}} has been approved. Disbursement date: {{date}}.',
    enabled: true,
    updatedAt: '2026-08-22T14:40:00.000Z',
  },
  {
    id: 'nt5',
    code: 'TPL-LNR-001',
    name: 'Loan Repayment Reminder',
    channel: 'SMS',
    event: 'Loan Reminder',
    body: 'Reminder: loan {{loanNo}} instalment of {{amount}} is due on {{date}}. Please ensure sufficient funds.',
    enabled: true,
    updatedAt: '2026-08-25T07:30:00.000Z',
  },
  {
    id: 'nt6',
    code: 'TPL-OTP-001',
    name: 'One-Time Password',
    channel: 'SMS',
    event: 'OTP',
    body: 'Your SACCO verification code is {{otp}}. It expires in {{minutes}} minutes. Never share this code.',
    enabled: false,
    updatedAt: '2026-09-01T06:05:00.000Z',
  },
];

export let notificationSettings: GatewaySettings = {
  smtpHost: 'smtp.sacco.local',
  smtpPort: 587,
  smtpUser: 'notifications@sacco.local',
  smtpSecure: true,
  smsProvider: 'AfroMessage',
  smsSenderId: 'SACCO',
  updatedAt: '2026-08-30T10:00:00.000Z',
};

let seq = notificationTemplates.length;

const json = (body: unknown) => HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const nowIso = () => new Date().toISOString();

const isBlank = (value: unknown) => typeof value !== 'string' || value.trim().length === 0;

const asString = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));

const codeTaken = (code: string, exceptId?: string) =>
  notificationTemplates.some((t) => t.code.toLowerCase() === code.trim().toLowerCase() && t.id !== exceptId);

const validChannel = (channel: string) => channel === 'Email' || channel === 'SMS';

export const notificationTemplateHandlers = [
  http.get('/api/notification-templates', async () => {
    await delay(250);
    return json(notificationTemplates);
  }),

  http.post('/api/notification-templates', async ({ request }) => {
    await delay(400);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const code = asString(body.code).trim();
    const name = asString(body.name).trim();
    const channel = asString(body.channel).trim();
    const event = asString(body.event).trim();
    const subject = asString(body.subject).trim();
    const text = asString(body.body).trim();

    if (isBlank(code)) return HttpResponse.json({ error: 'code is required' }, { status: 400 });
    if (isBlank(name)) return HttpResponse.json({ error: 'name is required' }, { status: 400 });
    if (isBlank(text)) return HttpResponse.json({ error: 'body is required' }, { status: 400 });
    if (!validChannel(channel)) return HttpResponse.json({ error: 'channel must be Email or SMS' }, { status: 400 });
    if (codeTaken(code)) return HttpResponse.json({ error: `Template code ${code} already exists` }, { status: 400 });
    if (channel === 'Email' && isBlank(subject)) {
      return HttpResponse.json({ error: 'Email templates require a subject' }, { status: 400 });
    }

    seq += 1;
    const template: NotificationTemplate = {
      id: `nt-${Date.now()}-${seq}`,
      code,
      name,
      channel: channel as NotificationTemplate['channel'],
      event,
      subject: channel === 'Email' ? subject : undefined,
      body: text,
      enabled: true,
      updatedAt: nowIso(),
    };
    notificationTemplates.unshift(template);
    return json(template);
  }),

  http.post('/api/notification-templates/:id', async ({ params, request }) => {
    await delay(400);
    const template = notificationTemplates.find((t) => t.id === params.id);
    if (!template) {
      return HttpResponse.json({ error: 'Notification template not found' }, { status: 400 });
    }
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const code = body.code === undefined ? template.code : asString(body.code).trim();
    const name = body.name === undefined ? template.name : asString(body.name).trim();
    const channel = body.channel === undefined ? template.channel : asString(body.channel).trim();
    const event = body.event === undefined ? template.event : asString(body.event).trim();
    const subject = body.subject === undefined ? (template.subject ?? '') : asString(body.subject).trim();
    const text = body.body === undefined ? template.body : asString(body.body).trim();

    if (isBlank(code)) return HttpResponse.json({ error: 'code is required' }, { status: 400 });
    if (isBlank(name)) return HttpResponse.json({ error: 'name is required' }, { status: 400 });
    if (isBlank(text)) return HttpResponse.json({ error: 'body is required' }, { status: 400 });
    if (!validChannel(channel)) return HttpResponse.json({ error: 'channel must be Email or SMS' }, { status: 400 });
    if (codeTaken(code, template.id)) {
      return HttpResponse.json({ error: `Template code ${code} already exists` }, { status: 400 });
    }
    if (channel === 'Email' && isBlank(subject)) {
      return HttpResponse.json({ error: 'Email templates require a subject' }, { status: 400 });
    }

    template.code = code;
    template.name = name;
    template.channel = channel as NotificationTemplate['channel'];
    template.event = event;
    template.subject = channel === 'Email' ? subject : undefined;
    template.body = text;
    template.updatedAt = nowIso();
    return json(template);
  }),

  http.post('/api/notification-templates/:id/toggle', async ({ params }) => {
    await delay(300);
    const template = notificationTemplates.find((t) => t.id === params.id);
    if (!template) {
      return HttpResponse.json({ error: 'Notification template not found' }, { status: 400 });
    }
    template.enabled = !template.enabled;
    template.updatedAt = nowIso();
    return json(template);
  }),

  http.get('/api/notification-settings', async () => {
    await delay(250);
    return json(notificationSettings);
  }),

  http.post('/api/notification-settings', async ({ request }) => {
    await delay(400);
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const smtpHost = asString(body.smtpHost).trim();
    const smtpPort = Number(body.smtpPort);
    if (isBlank(smtpHost)) {
      return HttpResponse.json({ error: 'SMTP host is required for the Email gateway' }, { status: 400 });
    }
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      return HttpResponse.json({ error: 'SMTP port must be between 1 and 65535' }, { status: 400 });
    }

    const smtpUser = body.smtpUser === undefined ? notificationSettings.smtpUser : asString(body.smtpUser).trim();

    const saved: GatewaySettings = {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpSecure: Boolean(body.smtpSecure),
      smsProvider: asString(body.smsProvider).trim(),
      smsSenderId: asString(body.smsSenderId).trim(),
      updatedAt: nowIso(),
    };
    notificationSettings = saved;
    return json(saved);
  }),
];
