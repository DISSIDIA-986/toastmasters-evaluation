/**
 * Ballot retention policy (pure date math, no DB — so it's unit-testable).
 *
 * Motivation is data minimization (shrink the standing PII surface), NOT disk:
 * 19 members is nothing for Postgres. We keep meetings for a fixed window, then
 * the cron purges older ones; ON DELETE CASCADE clears their evaluations and
 * reports.
 */
export const RETENTION_DAYS = 28; // ~4 weekly meetings

/** Date string (YYYY-MM-DD, UTC) `days` before `now`. Meetings strictly older are purged. */
export function retentionCutoffIso(now: Date = new Date(), days: number = RETENTION_DAYS): string {
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString().slice(0, 10);
}

/**
 * True iff a meeting on `meetingDateIso` is past the retention window and should
 * be purged. A meeting exactly `days` old is KEPT (strict less-than), so the
 * boundary day is never deleted early. Lexical compare is valid for YYYY-MM-DD.
 */
export function isExpired(
  meetingDateIso: string,
  now: Date = new Date(),
  days: number = RETENTION_DAYS,
): boolean {
  return meetingDateIso < retentionCutoffIso(now, days);
}
