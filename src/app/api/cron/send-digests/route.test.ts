import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// The scheduled send must reject anything without the correct CRON_SECRET so it
// can't be fired externally to spam members. These reject paths (and the date
// validation) return before any DB call, so no DB mock is needed.
describe('/api/cron/send-digests auth + validation', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/send-digests'));
    expect(res.status).toBe(401);
  });

  it('rejects a request with a wrong bearer token', async () => {
    const req = new NextRequest('http://localhost/api/cron/send-digests', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(new NextRequest('http://localhost/api/cron/send-digests'));
    expect(res.status).toBe(500);
  });

  it('rejects a malformed ?date (authorized, but bad format) before any DB call', async () => {
    const req = new NextRequest('http://localhost/api/cron/send-digests?date=yesterday', {
      headers: { authorization: 'Bearer test-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
