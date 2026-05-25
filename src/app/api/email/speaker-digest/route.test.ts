import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Admin-only send endpoint: must reject unauthenticated callers before any DB
// read or email send.
describe('/api/email/speaker-digest auth', () => {
  it('returns 401 without a session cookie', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/email/speaker-digest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ meeting_id: 1, speaker_name: 'Daniel B.', member_id: 2 }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
