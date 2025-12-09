import { NextRequest, NextResponse } from 'next/server';
import {
  getAllReportsByMeeting,
  createAhUmReport,
  createGrammarianReport,
  createTimerReport,
} from '@/lib/db';

// GET all reports for a meeting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const id = parseInt(meetingId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    const reports = await getAllReportsByMeeting(id);
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST create a new report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const id = parseInt(meetingId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid meeting ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, ...data } = body;

    let result;
    switch (type) {
      case 'ah_um':
        result = await createAhUmReport({
          meeting_id: id,
          reporter_name: data.reporter_name,
          entries: data.entries || [],
        });
        break;
      case 'grammarian':
        result = await createGrammarianReport({
          meeting_id: id,
          reporter_name: data.reporter_name,
          word_of_day: data.word_of_day || '',
          word_of_day_definition: data.word_of_day_definition || '',
          entries: data.entries || [],
        });
        break;
      case 'timer':
        result = await createTimerReport({
          meeting_id: id,
          reporter_name: data.reporter_name,
          meeting_start: data.meeting_start || '',
          meeting_end: data.meeting_end || '',
          entries: data.entries || [],
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: ah_um, grammarian, or timer' },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
