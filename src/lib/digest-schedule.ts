/**
 * Timing for the scheduled speaker-digest send (Nelson's request: one email per
 * speaker, automatically at 8 PM after the meeting).
 *
 * Pure + side-effect free so the DST logic is unit-testable without a clock.
 */
import { CLUB_TIME_ZONE } from './date';

/** 8 PM in the club's local timezone — when digests go out. */
export const SEND_HOUR = 20;

/**
 * The club's LOCAL calendar date (YYYY-MM-DD) and hour (0-23) for an instant.
 *
 * Why this exists: Vercel Cron fires in UTC and a single schedule cannot mean
 * "8 PM America/Edmonton" year-round — 8 PM is 02:00 UTC in summer (MDT) and
 * 03:00 UTC in winter (MST). The cron therefore fires at BOTH hours and the
 * handler sends only on the firing whose LOCAL hour equals SEND_HOUR. That
 * pins the send to exactly 8 PM local across daylight-saving changes. (A
 * timezone-aware external scheduler hitting the endpoint once at 20:00 local
 * also passes the gate, so the trigger is interchangeable.)
 */
export function edmontonNow(now: Date = new Date()): { dateIso: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLUB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0; // some ICU builds report midnight as '24'
  return { dateIso: `${get('year')}-${get('month')}-${get('day')}`, hour };
}

/** True only when it's the send hour (8 PM) in the club's timezone. */
export function isSendHour(now: Date = new Date()): boolean {
  return edmontonNow(now).hour === SEND_HOUR;
}
