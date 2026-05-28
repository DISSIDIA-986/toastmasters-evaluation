import { describe, it, expect } from 'vitest';
import { edmontonNow, isSendHour, SEND_HOUR } from './digest-schedule';

// The whole point of the two-cron-hours design is that exactly ONE of the
// 02:00/03:00 UTC firings lands on 8 PM local — and which one flips with DST.
// These tests pin that behavior so a future refactor can't silently shift the
// send to 7 PM or 9 PM half the year.
describe('edmontonNow / isSendHour (DST gate)', () => {
  it('summer (MDT, UTC-6): 02:00 UTC is 8 PM local the day before → sends', () => {
    const { dateIso, hour } = edmontonNow(new Date('2026-05-27T02:00:00Z'));
    expect(hour).toBe(SEND_HOUR);
    expect(dateIso).toBe('2026-05-26');
    expect(isSendHour(new Date('2026-05-27T02:00:00Z'))).toBe(true);
  });

  it('summer (MDT): 03:00 UTC is 9 PM local → does NOT send', () => {
    expect(edmontonNow(new Date('2026-05-27T03:00:00Z')).hour).toBe(21);
    expect(isSendHour(new Date('2026-05-27T03:00:00Z'))).toBe(false);
  });

  it('winter (MST, UTC-7): 03:00 UTC is 8 PM local the day before → sends', () => {
    const { dateIso, hour } = edmontonNow(new Date('2026-01-07T03:00:00Z'));
    expect(hour).toBe(SEND_HOUR);
    expect(dateIso).toBe('2026-01-06');
    expect(isSendHour(new Date('2026-01-07T03:00:00Z'))).toBe(true);
  });

  it('winter (MST): 02:00 UTC is 7 PM local → does NOT send', () => {
    expect(edmontonNow(new Date('2026-01-07T02:00:00Z')).hour).toBe(19);
    expect(isSendHour(new Date('2026-01-07T02:00:00Z'))).toBe(false);
  });
});
