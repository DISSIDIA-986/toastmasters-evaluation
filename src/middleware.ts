import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * Page-level guard: redirect the admin-only pages to /login when there's no
 * valid session. This protects the *page shell* (so unauthorized users never
 * load the admin UI). Data is independently protected by requireAuth() inside
 * each API route handler — middleware is not the only line of defense.
 *
 * API routes are intentionally NOT matched here: the public/protected split on
 * /api/* can't be done cleanly by path prefix (e.g. /api/meetings/today is
 * public but /api/meetings/[id] is protected), so each handler guards itself.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/reminders/:path*'],
};
