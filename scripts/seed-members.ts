/**
 * Seeds the club roster into the members table.
 *
 * Usage (from repo root):
 *   1. cp scripts/members.example.json scripts/members.json
 *   2. fill scripts/members.json with the real roster (it is gitignored — the
 *      emails are PII and must not enter git history)
 *   3. npm run db:init   # if the schema doesn't exist yet
 *   4. npx tsx scripts/seed-members.ts
 *
 * Requires POSTGRES_URL (or equivalent) in .env.local.
 *
 * Idempotent: upsert on the UNIQUE email, so re-running updates display names
 * and reactivates rather than erroring.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

import { upsertMember } from '../src/lib/db';

interface SeedMember {
  display_name: string;
  email: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  const file = resolve(process.cwd(), 'scripts/members.json');
  if (!existsSync(file)) {
    console.error(
      'scripts/members.json not found.\n' +
        'Copy scripts/members.example.json → scripts/members.json and fill in the roster.',
    );
    process.exit(1);
  }

  const raw = readFileSync(file, 'utf8');
  let members: SeedMember[];
  try {
    members = JSON.parse(raw);
  } catch {
    console.error('scripts/members.json is not valid JSON.');
    process.exit(1);
  }
  if (!Array.isArray(members)) {
    console.error('scripts/members.json must be a JSON array.');
    process.exit(1);
  }

  console.log(`Seeding ${members.length} members…\n`);
  let ok = 0;
  for (const m of members) {
    const name = (m.display_name || '').trim();
    const email = (m.email || '').trim().toLowerCase();
    if (!name || !EMAIL_RE.test(email)) {
      console.log(`  skip   invalid row: ${JSON.stringify(m)}`);
      continue;
    }
    const row = await upsertMember(name, email);
    console.log(`  upsert ${row.display_name}  →  ${row.email} (id ${row.id})`);
    ok++;
  }
  console.log(`\nDone. ${ok}/${members.length} members upserted.`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
