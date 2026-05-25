/**
 * Creates the database schema. Run once per environment at deploy time:
 *
 *   npm run db:init
 *
 * Requires POSTGRES_URL (or equivalent) in .env.local — same env the app uses.
 *
 * Replaces the old pattern where the admin page called a public /api/init on
 * load. A public DDL endpoint triggered by the client was a deployment hazard
 * (anyone could run it; protecting it deadlocked fresh environments). Schema
 * creation now lives here, run explicitly. `initializeDatabase()` uses
 * CREATE TABLE IF NOT EXISTS, so re-running is safe (idempotent).
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local before importing anything that touches @vercel/postgres.
config({ path: resolve(process.cwd(), '.env.local') });

import { initializeDatabase } from '../src/lib/db';

async function main() {
  console.log('Initializing database schema…');
  await initializeDatabase();
  console.log('Done. Schema is up to date.');
}

main().catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
