import { describe, it, expect } from 'vitest';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import {
  createSessionToken,
  verifySessionToken,
  isAuthenticated,
  requireAuth,
  signMeetingToken,
  verifyMeetingToken,
  SESSION_COOKIE,
} from './auth';

const SECRET = new TextEncoder().encode(process.env.COOKIE_SECRET);

function reqWith(token?: string): NextRequest {
  const req = new NextRequest('http://localhost/api/meetings');
  if (token !== undefined) req.cookies.set(SESSION_COOKIE, token);
  return req;
}

describe('session tokens', () => {
  it('accepts a freshly-minted session token', async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  it('rejects undefined / empty', async () => {
    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken('')).toBe(false);
  });

  it('rejects a tampered token', async () => {
    const token = await createSessionToken();
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a');
    expect(await verifySessionToken(tampered)).toBe(false);
  });

  it('rejects a token signed with a different secret', async () => {
    const wrong = new TextEncoder().encode('a-totally-different-secret-key');
    const token = await new SignJWT({ kind: 'session' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(wrong);
    expect(await verifySessionToken(token)).toBe(false);
  });

  it('rejects an expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const token = await new SignJWT({ kind: 'session' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(past - 60)
      .setExpirationTime(past)
      .sign(SECRET);
    expect(await verifySessionToken(token)).toBe(false);
  });

  it('rejects a valid JWT that is not a session (wrong kind)', async () => {
    const token = await new SignJWT({ kind: 'submit', mid: 1 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(SECRET);
    expect(await verifySessionToken(token)).toBe(false);
  });
});

describe('requireAuth / isAuthenticated', () => {
  it('isAuthenticated is false with no cookie', async () => {
    expect(await isAuthenticated(reqWith())).toBe(false);
  });

  it('requireAuth returns a 401 with no cookie', async () => {
    const res = await requireAuth(reqWith());
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('requireAuth returns null (passes) with a valid cookie', async () => {
    const token = await createSessionToken();
    const res = await requireAuth(reqWith(token));
    expect(res).toBeNull();
  });
});

describe('per-meeting submit tokens', () => {
  it('verifies a token for the same meeting id', async () => {
    const token = await signMeetingToken(42);
    expect(await verifyMeetingToken(token, 42)).toBe(true);
  });

  it('rejects a token bound to a different meeting (cross-meeting replay)', async () => {
    const token = await signMeetingToken(42);
    expect(await verifyMeetingToken(token, 99)).toBe(false);
  });

  it('rejects undefined / tampered tokens', async () => {
    expect(await verifyMeetingToken(undefined, 1)).toBe(false);
    const token = await signMeetingToken(1);
    const tampered = token.slice(0, -2) + (token.endsWith('a') ? 'b' : 'a');
    expect(await verifyMeetingToken(tampered, 1)).toBe(false);
  });

  it('does not accept a session token as a submit token', async () => {
    const session = await createSessionToken();
    expect(await verifyMeetingToken(session, 1)).toBe(false);
  });
});
