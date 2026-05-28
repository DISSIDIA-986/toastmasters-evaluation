import { NextRequest, NextResponse } from 'next/server';
import { getMeetingById, getEvaluationsBySpeaker, getMemberById, recordDigestSent } from '@/lib/db';
import { sendSpeakerDigest } from '@/lib/email';
import { requireAuth } from '@/lib/auth';
import { formatMeetingDateLong } from '@/lib/date';
import type { Evaluation } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * Admin-only: email one speaker their bundled feedback for a meeting.
 *
 * speaker→email is resolved HERE by an explicit member_id the admin picked
 * (decision 8A: manual mapping at send time, no auto string-matching — the two
 * "Daniel" members make auto-matching a privacy hazard). The free-text
 * speaker_name selects which ballots to bundle; member_id supplies the address.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const { meeting_id, speaker_name, member_id } = await request.json();
    if (!meeting_id || !speaker_name || !member_id) {
      return NextResponse.json(
        { error: 'meeting_id, speaker_name and member_id are required' },
        { status: 400 },
      );
    }

    const [meeting, member] = await Promise.all([
      getMeetingById(meeting_id),
      getMemberById(member_id),
    ]);
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const evaluations = (await getEvaluationsBySpeaker(meeting_id, speaker_name)) as Evaluation[];
    if (evaluations.length === 0) {
      return NextResponse.json(
        { error: `No ballots found for speaker "${speaker_name}"` },
        { status: 400 },
      );
    }

    const result = await sendSpeakerDigest({
      to: member.email,
      speakerName: member.display_name,
      meetingName: meeting.name,
      meetingDate: formatMeetingDateLong(meeting.date),
      evaluations,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Send failed' }, { status: 502 });
    }
    // Record under the ballot's speaker_name (the same key the scheduled 8 PM
    // send checks) so a manual send is not duplicated by the cron.
    await recordDigestSent(meeting_id, speaker_name, member.email);
    return NextResponse.json({ ok: true, id: result.id, to: member.email, count: evaluations.length });
  } catch (error) {
    console.error('Failed to send speaker digest:', error);
    return NextResponse.json({ error: 'Failed to send digest' }, { status: 500 });
  }
}
