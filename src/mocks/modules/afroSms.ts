import { http, HttpResponse, delay } from 'msw';
import type {
  OtpSendResult,
  OtpVerifyResult,
  SmsGatewayStatus,
  SmsLogEntry,
} from '../../types';

const json = (body: unknown) =>
  HttpResponse.json(body as Parameters<typeof HttpResponse.json>[0]);

const ETHIOPIAN_MOBILE = /^\+251[79]\d{8}$/;

interface Challenge {
  code: string;
  expiresAt: number;
  attempts: number;
  purpose: string;
}

const challenges = new Map<string, Challenge>();
const lastSent = new Map<string, number>();

const nowIso = () => new Date().toISOString();

const logs: SmsLogEntry[] = [
  { id: 'sms-1', phone: '+251911000111', purpose: 'OTP', status: 'Sent', detail: 'OTP challenge sent', createdAt: '2026-11-10T08:12:00.000Z' },
  { id: 'sms-2', phone: '+251911000111', purpose: 'Verify', status: 'Verified', detail: 'Phone verified', createdAt: '2026-11-10T08:13:00.000Z' },
  { id: 'sms-3', phone: '+251922333444', purpose: 'SMS', status: 'Sent', detail: 'Deposit confirmation', createdAt: '2026-11-10T08:20:00.000Z' },
];

let counter = 100;

function normalize(raw: string): string {
  const digits = (raw ?? '').replace(/[^0-9+]/g, '');
  if (digits.startsWith('+251')) return digits;
  if (digits.startsWith('251')) return `+${digits}`;
  if (digits.startsWith('0')) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  return digits;
}

function record(phone: string, purpose: string, status: SmsLogEntry['status'], detail: string) {
  logs.unshift({ id: `sms-${++counter}`, phone, purpose, status, detail, createdAt: nowIso() });
}

export const afroSmsHandlers = [
  http.get('/api/sms/status', () => {
    const status: SmsGatewayStatus = {
      enabled: true,
      provider: 'Afro SMS (demo mode)',
      sender: 'Anchor',
      from: 'H4M1…89Ju',
      otpLength: 6,
      otpTtlSeconds: 300,
    };
    return json(status);
  }),

  http.post('/api/sms/otp/send', async ({ request }) => {
    await delay(450);
    const body = (await request.json().catch(() => ({}))) as { phone?: string; purpose?: string };
    const phone = normalize(body.phone ?? '');
    if (!ETHIOPIAN_MOBILE.test(phone)) {
      return HttpResponse.json({ message: 'Enter a valid Ethiopian mobile number' }, { status: 400 });
    }
    const previous = lastSent.get(phone) ?? 0;
    if (Date.now() - previous < 60000) {
      return HttpResponse.json({ message: 'Please wait before requesting another code' }, { status: 429 });
    }
    lastSent.set(phone, Date.now());
    const code = String(Math.floor(100000 + Math.random() * 900000));
    challenges.set(phone, {
      code,
      expiresAt: Date.now() + 300000,
      attempts: 0,
      purpose: body.purpose ?? 'Registration',
    });
    record(phone, 'OTP', 'Sent', 'OTP challenge sent');
    const result: OtpSendResult = { sent: true, phone, expiresIn: 300, devOtp: code };
    return json(result);
  }),

  http.post('/api/sms/otp/verify', async ({ request }) => {
    await delay(350);
    const body = (await request.json().catch(() => ({}))) as { phone?: string; code?: string };
    const phone = normalize(body.phone ?? '');
    const challenge = challenges.get(phone);
    if (!challenge) {
      return HttpResponse.json({ message: 'Request a new code' }, { status: 400 });
    }
    if (challenge.expiresAt < Date.now()) {
      challenges.delete(phone);
      return HttpResponse.json({ message: 'That code has expired. Request a new one.' }, { status: 400 });
    }
    if (challenge.attempts >= 5) {
      return HttpResponse.json({ message: 'Too many attempts. Request a new code.' }, { status: 429 });
    }
    if (!body.code || body.code !== challenge.code) {
      challenge.attempts += 1;
      record(phone, 'Verify', 'Failed', 'Invalid code');
      return HttpResponse.json({ message: 'That code is incorrect or has expired' }, { status: 400 });
    }
    challenges.delete(phone);
    record(phone, 'Verify', 'Verified', 'Phone verified');
    const result: OtpVerifyResult = { verified: true, phone };
    return json(result);
  }),

  http.post('/api/sms/send', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as { phone?: string; message?: string };
    const phone = normalize(body.phone ?? '');
    if (!ETHIOPIAN_MOBILE.test(phone)) {
      return HttpResponse.json({ message: 'Enter a valid Ethiopian mobile number' }, { status: 400 });
    }
    if (!body.message || !body.message.trim()) {
      return HttpResponse.json({ message: 'Message is required' }, { status: 400 });
    }
    record(phone, 'SMS', 'Sent', 'Message sent (demo)');
    return json({ sent: true, phone });
  }),

  http.get('/api/sms/logs', () => json(logs)),
];
