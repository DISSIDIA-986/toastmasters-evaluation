import { NextRequest, NextResponse } from 'next/server';
import { updateTimerReport, deleteTimerReport } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await updateTimerReport(reportId, {
      reporter_name: body.reporter_name,
      meeting_start: body.meeting_start || '',
      meeting_end: body.meeting_end || '',
      entries: body.entries || [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update Timer report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    await deleteTimerReport(reportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete Timer report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
