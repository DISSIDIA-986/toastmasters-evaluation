import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch meetings from the last 3 days to handle timezone differences
    // and cases where the meeting might have been created a day early.
    // We order by date descending so the most relevant (latest) one comes first.
    const result = await sql`
      SELECT id, name, date 
      FROM meetings 
      WHERE date >= (CURRENT_DATE - INTERVAL '3 days')
      ORDER BY date DESC, created_at DESC
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
