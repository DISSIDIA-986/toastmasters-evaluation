/**
 * Auth + signed-token helpers for the club tool.
 *
 * Two independent token kinds, both HS256 via `jose` (Edge-compatible so
 * middleware can verify sessions):
 *
 *   1. SESSION  — proves "an Exec authenticated with the shared password".
 *                 Payload carries only { kind: 'session' }; no password, no
 *                 identity. Signed with COOKIE_SECRET, 8h expiry. Stored in an
 *                 HttpOnly/Secure/SameSite=Lax cookie.
 *
 *   2. SUBMIT   — binds a public ballot submission to one meeting. Embedded in
 *                 the (public) evaluate page and checked on POST. "Light
 *                 protection": stops drive-by API posts and cross-meeting
 *                 replay, NOT a throttle and NOT replay-proof within a meeting.
 *
 * Rotating sessions: changing ADMIN_PASSWORD only blocks new logins. To kill
 * all existing sessions you MUST rotate COOKIE_SECRET (every old JWT then
 * fails verification). See the design doc's password-rotation note.
 */
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'tm_session';
const SESSION_TTL = '8h';

function secretKey(): Uint8Array {
  const secret = process.env.COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    // Fail loud: a missing/short secret silently makes every token forgeable.
    throw new Error('COOKIE_SECRET env var is missing or too short (need >=16 chars)');
  }
  return new TextEncoder().encode(secret);
}

// ---------- Session ----------

/** Mint a signed session JWT (call after a correct password check). */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ kind: 'session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());
}

/** True iff `token` is a currently-valid (signed, unexpired) session JWT. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.kind === 'session';
  } catch {
    return false;
  }
}

/** Read + verify the session cookie off a request. */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Route-handler guard. Returns a 401 NextResponse to return early, or `null`
 * when the caller is authenticated and may proceed.
 *
 *   const denied = await requireAuth(req);
 *   if (denied) return denied;
 */
export async function requireAuth(req: NextRequest): Promise<NextResponse | null> {
  if (await isAuthenticated(req)) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ---------- Per-meeting submit token ----------

/**
 * Sign a token bound to one meeting id, embedded in the public evaluate page.
 *
 * TTL is 21d — deliberately SHORTER than the 28-day retention window
 * (see retention.ts). If a token outlived its meeting, a late submission would
 * pass token verification and then 500 on the foreign-key insert against the
 * purged meeting row. Keeping TTL < retention means a too-late submitter gets a
 * clean "token expired" 403 instead.
 */
export async function signMeetingToken(meetingId: number): Promise<string> {
  return new SignJWT({ kind: 'submit', mid: meetingId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('21d')
    .sign(secretKey());
}

/** True iff `token` is a valid submit token for exactly `meetingId`. */
export async function verifyMeetingToken(
  token: string | undefined,
  meetingId: number,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.kind === 'submit' && payload.mid === meetingId;
  } catch {
    return false;
  }
}
