import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get meetings for the current date (server time)
    // Note: This relies on the database server time matching the user's expected time zone,
    // which might be an issue if Vercel is UTC and user is elsewhere. 
    // For now, we'll fetch meetings created/dated today.
    
    // A more robust approach often involves sending the user's local date from client,
    // but for simplicity we'll check for meetings matching CURRENT_DATE in DB.
    
    const result = await sql`
      SELECT id, name, date 
      FROM meetings 
      WHERE date = CURRENT_DATE 
      ORDER BY created_at DESC
    `;

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch today\'s meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}
