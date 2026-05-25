/**
 * Date helpers for the meetings table.
 *
 * Postgres DATE columns arrive at JS as either a `Date` (set to UTC midnight)
 * or an ISO string like "2026-05-19". `new Date("2026-05-19")` is parsed as
 * UTC midnight, then `toLocaleDateString()` shifts back into the local
 * timezone — which makes a real Tuesday read as Monday in any timezone west
 * of UTC. These helpers parse and format in UTC so the calendar day stays
 * the calendar day.
 */

const YYMMDD = /^(\d{2})(\d{2})(\d{2})$/;
const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export const CLUB_TIME_ZONE = 'America/Edmonton';

/** Coerce a Postgres DATE value (Date object or ISO string) into a UTC-anchored Date. */
function toUtcDate(value: string | Date): Date {
  if (value instanceof Date) {
    // The @neondatabase/serverless driver builds DATE values via
    // `new Date(year, month, day)`, which is the LOCAL midnight of the
    // stored calendar day. Use local accessors here to extract the day the
    // driver intended, then re-anchor to UTC so downstream formatting with
    // `timeZone: 'UTC'` produces the same calendar day regardless of where
    // the server happens to run.
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }
  // Match the "YYYY-MM-DD" prefix; ignore any trailing time the driver may attach.
  const iso = value.slice(0, 10);
  return new Date(iso + 'T00:00:00Z');
}

/** Returns "Tuesday, May 19, 2026" — long format, no timezone shift. */
export function formatMeetingDateLong(value: string | Date): string {
  return toUtcDate(value).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Returns "5/19/2026" — short format, no timezone shift. */
export function formatMeetingDateShort(value: string | Date): string {
  return toUtcDate(value).toLocaleDateString('en-US', { timeZone: 'UTC' });
}

/** Returns "YYYY-MM-DD" for the actual calendar day stored, no timezone shift. */
export function formatMeetingDateIso(value: string | Date): string {
  const d = toUtcDate(value);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse a 6-digit yyMMdd path segment into a YYYY-MM-DD string.
 * Returns null if the input is not exactly 6 digits or does not represent
 * a real calendar day. Year prefix is hardcoded to "20" — this app is not
 * expected to outlive 2099.
 *
 * Example: parseYyMMdd("260519") -> "2026-05-19"
 */
export function parseYyMMdd(input: string): string | null {
  const m = input.match(YYMMDD);
  if (!m) return null;
  const [, yy, mm, dd] = m;
  const year = 2000 + parseInt(yy, 10);
  const month = parseInt(mm, 10);
  const day = parseInt(dd, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Validate by reconstructing — catches things like 02-30 or 04-31.
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Returns a YYMMDD path segment for a UTC-anchored Date. */
export function formatYyMMdd(value: Date): string {
  const year = String(value.getUTCFullYear()).slice(-2);
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Resolve the agenda's stable `/evaluate/go` link to the club meeting date.
 *
 * Rule:
 * - Monday through Thursday => this week's Tuesday
 * - Friday through Sunday   => next week's Tuesday
 *
 * The calculation is anchored to the club's local timezone, not the server's.
 */
export function getAgendaEvaluationTargetDate(now = new Date(), timeZone = CLUB_TIME_ZONE): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  if (!weekday || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new Error('Unable to resolve local date parts for evaluation routing');
  }

  const weekdayIndex = WEEKDAY_TO_INDEX[weekday];
  const offsetToTuesday =
    weekdayIndex >= 1 && weekdayIndex <= 4
      ? 2 - weekdayIndex
      : ((2 - weekdayIndex + 7) % 7) || 7;

  return new Date(Date.UTC(year, month - 1, day + offsetToTuesday));
}
