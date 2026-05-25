import { NextRequest, NextResponse } from 'next/server';
import { purgeOldMeetings } from '@/lib/db';
import { RETENTION_DAYS } from '@/lib/retention';

export const runtime = 'nodejs';

/**
 * Scheduled purge of meetings past the retention window (data minimization).
 * Triggered by Vercel Cron (see vercel.json). Vercel sends
 * `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set in the project
 * env — we reject anything without it so the endpoint can't be triggered
 * externally to delete data.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('CRON_SECRET env var is not set — refusing to run purge');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await purgeOldMeetings();
    console.log(`Retention purge: removed ${deleted} meeting(s) older than ${RETENTION_DAYS} days`);
    return NextResponse.json({ deleted, retention_days: RETENTION_DAYS });
  } catch (error) {
    console.error('Retention purge failed:', error);
    return NextResponse.json({ error: 'Purge failed' }, { status: 500 });
  }
}
