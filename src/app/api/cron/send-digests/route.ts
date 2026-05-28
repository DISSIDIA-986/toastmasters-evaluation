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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Scheduled speaker-digest send — Nelson's call: Option 2 (one consolidated
 * email per speaker), automatically at 8 PM after the meeting.
 *
 * Unattended trigger: an external scheduler (cron-job.org, timezone-aware) hits
 * this every Tuesday at 20:00 America/Edmonton with `Authorization: Bearer
 * ${CRON_SECRET}`. We reject anything else so it can't be fired externally to
 * spam members. The local-hour gate (isSendHour) is a second guard: the
 * unattended path only sends at 8 PM local even if the trigger misfires.
 *
 * Admin / test overrides (still require CRON_SECRET):
 *  - `?date=YYYY-MM-DD` targets a specific meeting instead of "today", and
 *    bypasses the 8 PM gate (an explicit date is a deliberate catch-up/re-send,
 *    not the unattended path).
 *  - `?dryRun=1` reports who WOULD be emailed without sending or logging.
 *
 * Adversarially reviewed:
 *  - Idempotent: digest_log UNIQUE(meeting_id, speaker_name); an already-sent
 *    speaker is skipped, so re-fires, late ballots, and manual resends never
 *    double-send.
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

  const params = request.nextUrl.searchParams;
  const dateParam = params.get('date');
  const dryRun = ['1', 'true', 'yes'].includes((params.get('dryRun') || '').toLowerCase());

  if (dateParam !== null && !DATE_RE.test(dateParam)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
  }

  const { dateIso: todayIso, hour } = edmontonNow();
  const dateIso = dateParam || todayIso;

  // The 8 PM gate guards only the unattended path. An explicit ?date is a
  // deliberate admin/test trigger and runs immediately.
  if (!dateParam && !isSendHour()) {
    return NextResponse.json({ skipped: 'not send hour', local_hour: hour });
  }

  try {
    const meeting = await getMeetingByDate(dateIso);
    if (!meeting) {
      return NextResponse.json({ sent: 0, reason: 'no meeting on date', date: dateIso });
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
    const wouldSend: { speaker: string; to: string; ballots: number }[] = [];

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
      if (dryRun) {
        wouldSend.push({ speaker: speakerName, to: member.email, ballots: evals.length });
        continue;
      }
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

    if (dryRun) {
      return NextResponse.json({ dryRun: true, meeting_id: meeting.id, date: dateIso, wouldSend, skipped });
    }
    console.log(`Scheduled digests for meeting ${meeting.id}: sent=${sent}`, skipped);
    return NextResponse.json({ meeting_id: meeting.id, date: dateIso, sent, skipped });
  } catch (error) {
    console.error('Scheduled digest send failed:', error);
    return NextResponse.json({ error: 'Send failed' }, { status: 500 });
  }
}
