import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

// The protected handlers call requireAuth() first and return 401 BEFORE any
// @vercel/postgres call, so this boundary test needs no DB mock.
describe('GET /api/meetings auth boundary', () => {
  it('returns 401 without a session cookie', async () => {
    const req = new NextRequest('http://localhost/api/meetings');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
