import { NextRequest, NextResponse } from 'next/server';
import { getMeetingById, getEvaluationsByMeeting } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meetingId = parseInt(id);

    if (isNaN(meetingId)) {
      return NextResponse.json(
        { error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    const meeting = await getMeetingById(meetingId);

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    const evaluations = await getEvaluationsByMeeting(meetingId);

    return NextResponse.json({
      ...meeting,
      evaluations,
    });
  } catch (error) {
    console.error('Failed to fetch meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}
