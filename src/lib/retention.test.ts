import { describe, it, expect } from 'vitest';
import { retentionCutoffIso, isExpired, RETENTION_DAYS } from './retention';

const NOW = new Date('2026-05-25T12:00:00Z'); // a Monday

describe('retention cutoff', () => {
  it('cutoff is exactly RETENTION_DAYS before now (UTC date)', () => {
    expect(retentionCutoffIso(NOW)).toBe('2026-04-27'); // 2026-05-25 minus 28 days
  });
});

describe('isExpired — IRON RULE: never delete recent meetings', () => {
  it('purges a meeting older than the window', () => {
    expect(isExpired('2026-04-26', NOW)).toBe(true); // 29 days old
  });

  it('KEEPS a meeting exactly RETENTION_DAYS old (boundary, strict <)', () => {
    expect(isExpired('2026-04-27', NOW)).toBe(false); // == cutoff
  });

  it('KEEPS a recent meeting', () => {
    expect(isExpired('2026-05-19', NOW)).toBe(false); // last week
  });

  it('KEEPS a future meeting', () => {
    expect(isExpired('2026-06-02', NOW)).toBe(false);
  });

  it('uses a 28-day default window', () => {
    expect(RETENTION_DAYS).toBe(28);
  });
});
