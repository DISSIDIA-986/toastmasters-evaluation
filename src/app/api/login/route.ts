import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * Best-effort in-memory login rate limit. Serverless instances are ephemeral,
 * so this resets on cold starts and isn't shared across instances — it's a
 * speed bump against trivial password spraying, not a hard control. A real
 * throttle would need a shared store (intentionally out of scope for a
 * 19-member club; see design doc).
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

/** Constant-time compare via fixed-length SHA-256 digests (avoids length leak). */
function passwordMatches(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a minute.' },
      { status: 429 },
    );
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error('ADMIN_PASSWORD env var is not set');
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  let password = '';
  try {
    ({ password = '' } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (typeof password !== 'string' || !passwordMatches(password, expected)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
  });
  return res;
}
