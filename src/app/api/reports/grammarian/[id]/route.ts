import { NextRequest, NextResponse } from 'next/server';
import { updateGrammarianReport, deleteGrammarianReport } from '@/lib/db';

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
    const result = await updateGrammarianReport(reportId, {
      reporter_name: body.reporter_name,
      word_of_day: body.word_of_day || '',
      word_of_day_definition: body.word_of_day_definition || '',
      entries: body.entries || [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update Grammarian report:', error);
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

    await deleteGrammarianReport(reportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete Grammarian report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
