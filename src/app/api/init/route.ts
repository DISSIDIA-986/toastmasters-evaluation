import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * Schema bootstrap is normally run at deploy via `npm run db:init`
 * (scripts/init-db.ts). This route is kept as an authenticated escape hatch so
 * an Exec can re-run initialization from a signed-in session if needed. It is
 * NO LONGER public and is NO LONGER auto-called by the admin page on load —
 * a public DDL endpoint was a deployment hazard (see design doc, codex#2).
 */
export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  try {
    await initializeDatabase();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
