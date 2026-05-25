import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// The purge endpoint must reject anything without the correct CRON_SECRET so it
// can't be triggered externally to delete data. These reject paths return
// before any DB call, so no DB mock is needed.
describe('/api/cron/purge auth', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/purge'));
    expect(res.status).toBe(401);
  });

  it('rejects a request with a wrong bearer token', async () => {
    const req = new NextRequest('http://localhost/api/cron/purge', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
