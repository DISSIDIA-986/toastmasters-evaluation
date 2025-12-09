import { NextRequest, NextResponse } from 'next/server';
import { updateGeneralEvaluatorReport, deleteGeneralEvaluatorReport } from '@/lib/db';

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
    const result = await updateGeneralEvaluatorReport(reportId, {
      reporter_name: body.reporter_name,
      evaluator_feedbacks: body.evaluator_feedbacks || [],
      functionary_feedbacks: body.functionary_feedbacks || [],
      meeting_highlights: body.meeting_highlights || '',
      meeting_improvements: body.meeting_improvements || '',
      overall_comments: body.overall_comments || '',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update General Evaluator report:', error);
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

    await deleteGeneralEvaluatorReport(reportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete General Evaluator report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
