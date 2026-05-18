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
