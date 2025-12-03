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
      commend_tags = [],
      recommend_tags = [],
      challenge_tags = [],
      comments,
    } = body;

    // Validate required fields
    if (!meeting_id || !evaluator_name || !speaker_name || !speech_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate at least one feedback item
    const totalTags = (commend_tags?.length || 0) + (recommend_tags?.length || 0) + (challenge_tags?.length || 0);
    if (totalTags === 0) {
      return NextResponse.json(
        { error: 'Please select at least one feedback item' },
        { status: 400 }
      );
    }

    const evaluation = await createEvaluation({
      meeting_id,
      evaluator_name: evaluator_name.trim(),
      speaker_name: speaker_name.trim(),
      speech_type,
      commend_tags: Array.isArray(commend_tags) ? commend_tags : [],
      recommend_tags: Array.isArray(recommend_tags) ? recommend_tags : [],
      challenge_tags: Array.isArray(challenge_tags) ? challenge_tags : [],
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
