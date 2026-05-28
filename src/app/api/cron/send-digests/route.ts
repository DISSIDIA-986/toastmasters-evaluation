import { NextRequest, NextResponse } from 'next/server';
import {
  getMeetingByDate,
  getEvaluationsByMeeting,
  getActiveMembers,
  hasDigestBeenSent,
  recordDigestSent,
} from '@/lib/db';
import { sendSpeakerDigest } from '@/lib/email';
import { formatMeetingDateLong } from '@/lib/date';
import { edmontonNow, isSendHour } from '@/lib/digest-schedule';
import type { Evaluation, Member } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * Scheduled speaker-digest send — Nelson's call: Option 2 (one consolidated
 * email per speaker), automatically at 8 PM after the meeting.
 *
 * Trigger: Vercel Cron `0 2,3 * * *` (see vercel.json). Vercel sends
 * `Authorization: Bearer ${CRON_SECRET}`; we reject anything else so the
 * endpoint can't be fired externally to spam members. Fires at BOTH 02:00 and
 * 03:00 UTC because 8 PM America/Edmonton is one or the other depending on DST;
 * isSendHour() gates so exactly one firing per day actually sends, at 8 PM
 * local. (A timezone-aware external scheduler hitting this once at 20:00 local
 * also passes the gate, so the trigger is swappable.)
 *
 * Adversarially reviewed:
 *  - Idempotent: digest_log UNIQUE(meeting_id, speaker_name); an already-sent
 *    speaker is skipped, so re-fires and late ballots never double-send.
 *  - Best-effort per speaker: one failed send doesn't abort the batch, and an
 *    unsent speaker stays unlogged so the next eligible run retries.
 *  - No human in the loop → only auto-send to an EXACTLY and UNIQUELY matched
 *    active member (the roster dropdown writes exact display names). Guests,
 *    ambiguous, or unmatched names are skipped for manual handling — we never
 *    guess an address.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('CRON_SECRET env var is not set — refusing to run digest send');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { dateIso, hour } = edmontonNow();
  if (!isSendHour()) {
    // Wrong half of the DST pair (or an off-hour ping) — do nothing.
    return NextResponse.json({ skipped: 'not send hour', local_hour: hour });
  }

  try {
    const meeting = await getMeetingByDate(dateIso);
    if (!meeting) {
      return NextResponse.json({ sent: 0, reason: 'no meeting today', date: dateIso });
    }

    const [evalRows, memberRows] = await Promise.all([
      getEvaluationsByMeeting(meeting.id),
      getActiveMembers(),
    ]);
    const evaluations = evalRows as Evaluation[];
    const members = memberRows as Member[];

    // Bundle every ballot by the speaker name written on it.
    const bySpeaker = new Map<string, Evaluation[]>();
    for (const e of evaluations) {
      const list = bySpeaker.get(e.speaker_name);
      if (list) list.push(e);
      else bySpeaker.set(e.speaker_name, [e]);
    }

    const meetingDate = formatMeetingDateLong(meeting.date);
    let sent = 0;
    const skipped = { already_sent: 0, no_match: 0, ambiguous: 0, send_failed: 0 };

    for (const [speakerName, evals] of bySpeaker) {
      if (await hasDigestBeenSent(meeting.id, speakerName)) {
        skipped.already_sent++;
        continue;
      }
      const matches = members.filter((m) => m.display_name === speakerName);
      if (matches.length === 0) {
        skipped.no_match++; // guest, or name not on the active roster
        continue;
      }
      if (matches.length > 1) {
        skipped.ambiguous++; // two members share a display name — don't guess
        continue;
      }
      const member = matches[0];
      const result = await sendSpeakerDigest({
        to: member.email,
        speakerName: member.display_name,
        meetingName: meeting.name,
        meetingDate,
        evaluations: evals,
      });
      if (!result.ok) {
        skipped.send_failed++;
        console.error(`Digest send failed for "${speakerName}": ${result.error}`);
        continue; // leave unlogged so a later run retries
      }
      await recordDigestSent(meeting.id, speakerName, member.email);
      sent++;
    }

    console.log(`Scheduled digests for meeting ${meeting.id}: sent=${sent}`, skipped);
    return NextResponse.json({ meeting_id: meeting.id, date: dateIso, sent, skipped });
  } catch (error) {
    console.error('Scheduled digest send failed:', error);
    return NextResponse.json({ error: 'Send failed' }, { status: 500 });
  }
}
