import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Show a small window around "now": one week back (so evaluators of the
    // most recent meeting can still submit late) plus the next handful of
    // upcoming Tuesdays. Ascending order so the closest upcoming meeting is
    // the first row — that's the one the homepage auto-redirects to when
    // there's nothing newer.
    //
    // The earlier implementation used DESC + 3-day lower bound, which on a
    // seeded calendar returned the latest meetings in the table (months
    // out) instead of the meetings relevant to the user clicking today.
    const result = await sql`
      SELECT id, name, date
      FROM meetings
      WHERE date >= (CURRENT_DATE - INTERVAL '7 days')
        AND date <= (CURRENT_DATE + INTERVAL '35 days')
      ORDER BY date ASC, created_at ASC
      LIMIT 5
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch recent meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}
