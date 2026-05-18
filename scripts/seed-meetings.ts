/**
 * Seeds 14 future Tuesday meetings into the meetings table.
 *
 * Usage (from repo root):
 *   npx tsx scripts/seed-meetings.ts
 *
 * Requires POSTGRES_URL (or equivalent) in .env.local — same env the app uses.
 *
 * Idempotent: a meeting on a given date is created only if no row already
 * exists for that date. Re-running this script after a partial seed is safe.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local before importing any module that touches @vercel/postgres.
config({ path: resolve(process.cwd(), '.env.local') });

import { sql } from '@vercel/postgres';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Returns YYYY-MM-DD in UTC (Postgres DATE expects this format). */
function isoDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Returns "Tue · May 19" — short, distinct from the page header's full format. */
function shortName(d: Date): string {
  const wd = WEEKDAY_ABBR[d.getUTCDay()];
  const mo = MONTH_ABBR[d.getUTCMonth()];
  const day = d.getUTCDate();
  return `${wd} · ${mo} ${day}`;
}

/** Builds the next N Tuesdays starting from (and including) the next Tuesday on/after `from`. */
function nextNTuesdays(from: Date, n: number): Date[] {
  // 2 = Tuesday in JS getDay() (Sunday=0).
  // Use UTC throughout to avoid timezone surprises on the boundary day.
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const dow = start.getUTCDay();
  const daysUntilTue = (2 - dow + 7) % 7; // 0..6
  start.setUTCDate(start.getUTCDate() + daysUntilTue);
  const out: Date[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start.getTime());
    d.setUTCDate(start.getUTCDate() + i * 7);
    out.push(d);
  }
  return out;
}

async function main() {
  const today = new Date();
  const tuesdays = nextNTuesdays(today, 14);

  console.log(`Seeding ${tuesdays.length} Tuesday meetings starting ${isoDate(tuesdays[0])}\n`);

  let created = 0;
  let skipped = 0;

  for (const d of tuesdays) {
    const dateStr = isoDate(d);
    const name = shortName(d);

    // Skip if a meeting already exists on this exact date.
    const existing = await sql`SELECT id, name FROM meetings WHERE date = ${dateStr} LIMIT 1`;
    if (existing.rows.length > 0) {
      console.log(`  skip   ${dateStr}  →  already exists as "${existing.rows[0].name}" (id ${existing.rows[0].id})`);
      skipped++;
      continue;
    }

    const result = await sql`
      INSERT INTO meetings (name, date)
      VALUES (${name}, ${dateStr})
      RETURNING id
    `;
    console.log(`  create ${dateStr}  →  "${name}" (id ${result.rows[0].id})`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
