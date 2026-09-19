import { http, HttpResponse, delay } from 'msw';

interface Challenge {
  otp: string;
  expiresAt: number;
  attempts: number;
  username: string;
}

const challenges = new Map<string, Challenge>();

const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const readBody = async (request: Request) =>
  (await request.json().catch(() => ({}))) as { username?: string; challengeId?: string; otp?: string };

const createChallenge = (username: string) => {
  const challengeId = `2fa-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const otp = generateOtp();
  challenges.set(challengeId, { otp, expiresAt: Date.now() + TTL_MS, attempts: 0, username });
  return { challengeId, otp };
};

export const twoFactorHandlers = [
  http.post('/api/auth/2fa/start', async ({ request }) => {
    await delay(500);
    const body = await readBody(request);
    const { challengeId, otp } = createChallenge(String(body.username ?? ''));
    return HttpResponse.json({ challengeId, otp, devOtp: otp, expiresIn: TTL_MS / 1000 });
  }),

  http.post('/api/auth/2fa/verify', async ({ request }) => {
    await delay(400);
    const body = await readBody(request);
    const id = String(body.challengeId ?? '');
    const challenge = challenges.get(id);
    if (!challenge) {
      return HttpResponse.json({ error: 'Challenge not found' }, { status: 400 });
    }
    if (Date.now() > challenge.expiresAt) {
      challenges.delete(id);
      return HttpResponse.json({ error: 'Code expired' }, { status: 400 });
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      return HttpResponse.json({ error: 'Too many attempts' }, { status: 429 });
    }
    if (String(body.otp ?? '') !== challenge.otp) {
      challenge.attempts += 1;
      if (challenge.attempts >= MAX_ATTEMPTS) {
        return HttpResponse.json({ error: 'Too many attempts' }, { status: 429 });
      }
      return HttpResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
    challenges.delete(id);
    return HttpResponse.json({ ok: true });
  }),

  http.post('/api/auth/2fa/resend', async ({ request }) => {
    await delay(400);
    const body = await readBody(request);
    const id = String(body.challengeId ?? '');
    const challenge = challenges.get(id);
    if (!challenge) {
      return HttpResponse.json({ error: 'Challenge not found' }, { status: 400 });
    }
    challenge.otp = generateOtp();
    challenge.expiresAt = Date.now() + TTL_MS;
    challenge.attempts = 0;
    return HttpResponse.json({
      challengeId: id,
      otp: challenge.otp,
      devOtp: challenge.otp,
      expiresIn: TTL_MS / 1000,
    });
  }),
];
