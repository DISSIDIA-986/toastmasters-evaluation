import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Roster endpoints are admin-only (PII). Both guard with requireAuth before
// any DB access, so the 401 path needs no DB mock.
describe('/api/members auth boundary', () => {
  it('GET returns 401 without a session cookie', async () => {
    const res = await GET(new NextRequest('http://localhost/api/members'));
    expect(res.status).toBe(401);
  });

  it('POST returns 401 without a session cookie', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: 'X', email: 'x@y.com' }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
