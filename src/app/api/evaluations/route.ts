import { NextRequest, NextResponse } from 'next/server';
import { createEvaluation, getAllEvaluations } from '@/lib/db';

export async function GET() {
  try {
    const evaluations = await getAllEvaluations();
    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Failed to fetch evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      meeting_id,
      evaluator_name,
      speaker_name,
      speech_type,
      content_score,
      delivery_score,
      language_score,
      time_score,
      overall_score,
      strengths,
      improvements,
      comments,
    } = body;

    // Validate required fields
    if (!meeting_id || !evaluator_name || !speaker_name || !speech_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate scores
    const scores = [content_score, delivery_score, language_score, time_score, overall_score];
    for (const score of scores) {
      if (score < 1 || score > 5) {
        return NextResponse.json(
          { error: 'Scores must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    const evaluation = await createEvaluation({
      meeting_id,
      evaluator_name: evaluator_name.trim(),
      speaker_name: speaker_name.trim(),
      speech_type,
      content_score,
      delivery_score,
      language_score,
      time_score,
      overall_score,
      strengths: strengths?.trim() || '',
      improvements: improvements?.trim() || '',
      comments: comments?.trim() || '',
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error('Failed to create evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to create evaluation' },
      { status: 500 }
    );
  }
}
