import { NextRequest, NextResponse } from 'next/server';
import { createMeeting, getMeetings } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  try {
    const meetings = await getMeetings();
    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Failed to fetch meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { name, date } = body;

    if (!name || !date) {
      return NextResponse.json(
        { error: 'Name and date are required' },
        { status: 400 }
      );
    }

    const meeting = await createMeeting(name, date);
    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Failed to create meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
