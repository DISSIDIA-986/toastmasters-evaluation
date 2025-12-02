import { NextRequest, NextResponse } from 'next/server';
import { createMeeting, getMeetings } from '@/lib/db';

export async function GET() {
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
