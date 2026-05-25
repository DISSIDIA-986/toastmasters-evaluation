import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

function jsonReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/evaluations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/evaluations auth + token boundary', () => {
  it('GET returns 401 without a session cookie (protected)', async () => {
    const res = await GET(new NextRequest('http://localhost/api/evaluations'));
    expect(res.status).toBe(401);
  });

  it('POST rejects a submission with no submit token (403, before any DB write)', async () => {
    const res = await POST(
      jsonReq({
        meeting_id: 1,
        evaluator_name: 'Tester',
        speaker_name: 'Daniel',
        speech_type: 'prepared',
        comments: 'Nice talk',
        // no submit_token
      }),
    );
    expect(res.status).toBe(403);
  });

  it('POST still 400s on missing required fields (before the token check)', async () => {
    const res = await POST(jsonReq({ meeting_id: 1 }));
    expect(res.status).toBe(400);
  });
});
