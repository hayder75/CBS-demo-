import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { api } from './client';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe('api client', () => {
  it('attaches the JWT from localStorage when present', async () => {
    let seen: string | null = null;
    server.use(
      http.get('/api/anything', ({ request }) => {
        seen = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    localStorage.setItem('cbs-token', 'jwt-abc');
    await api('/api/anything');
    expect(seen).toBe('Bearer jwt-abc');
  });

  it('sends no Authorization header when no token is stored', async () => {
    let seen: string | null = 'sentinel';
    server.use(
      http.get('/api/anything', ({ request }) => {
        seen = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );
    await api('/api/anything');
    expect(seen).toBeNull();
  });

  it('parses JSON responses', async () => {
    server.use(http.get('/api/kpi', () => HttpResponse.json({ totalMembers: 20 })));
    const kpi = await api<{ totalMembers: number }>('/api/kpi');
    expect(kpi.totalMembers).toBe(20);
  });

  it('throws on non-2xx responses', async () => {
    server.use(http.get('/api/missing', () => HttpResponse.json({ error: 'nope' }, { status: 404 })));
    await expect(api('/api/missing')).rejects.toThrow(/404/);
  });

  it('sends POST bodies as JSON', async () => {
    let body: unknown;
    server.use(
      http.post('/api/echo', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await api('/api/echo', { method: 'POST', body: JSON.stringify({ a: 1 }) });
    expect(body).toEqual({ a: 1 });
  });
});