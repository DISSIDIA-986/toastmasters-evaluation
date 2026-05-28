# Spoken Word — Toastmasters Evaluation

A web app for the Spoken Word Toastmasters club to collect and manage speech
evaluations. Meeting organizers create a meeting, share a link/QR code, members
submit feedback from their phones, and each speaker automatically gets their
feedback by email after the meeting.

Built with Next.js (App Router) + TypeScript, Postgres (Neon, via
`@vercel/postgres`), and Resend for email. Deployed on Vercel.

## Features

- **Phone-first evaluation form** — pick the evaluator and speaker from the club
  roster (with a "Guest / other" fallback), tag commend/recommend/challenge
  items, and add a comment. Dictation-friendly, high-contrast for low-vision
  members.
- **Roster dropdowns everywhere** — evaluator, speaker, and every person field in
  the Statistician and General Evaluator reports select from the imported member
  list, so names stay consistent.
- **Functionary reports** — Ah-Um Counter, Grammarian, Timer, and General
  Evaluator reports per meeting.
- **Automatic speaker digests at 8 PM** — after each Tuesday meeting, every
  speaker is emailed one consolidated digest of all their feedback at 8 PM club
  time. Idempotent: re-runs and late ballots never double-send.
- **Exec-only admin** — sign-in gates the admin dashboard, roster, and reporting.
- **Data retention** — meetings (and their evaluations/reports) past the
  retention window are purged automatically.
- **CSV export** with formula-injection sanitization.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
npm test           # vitest (run once)  ·  npm run test:watch
```

## Configuration

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `POSTGRES_URL` (+ the other `POSTGRES_*`) | Neon/Vercel Postgres connection (set automatically in Vercel when Postgres is linked). |
| `ADMIN_PASSWORD` | Exec admin sign-in password. |
| `COOKIE_SECRET` | Signs the session cookie (≥16 chars). |
| `CRON_SECRET` | Bearer token the scheduled jobs must send. |
| `RESEND_API_KEY` | Resend API key for outbound email. |
| `EMAIL_FROM` | Verified sender, e.g. `Spoken Word Club <noreply@send.yourdomain>`. |
| `REPLY_TO` | Where member replies go (the club's official Gmail). |

## Database setup

The schema lives in `initializeDatabase()` (`src/lib/db.ts`) and is created with
`CREATE TABLE IF NOT EXISTS`, so it's safe to re-run. There are no migration files.

```bash
npm run db:init        # create/refresh all tables
npm run seed:members   # import the roster from scripts/members.json
```

`members.json` is gitignored (real names + emails); see `scripts/members.example.json`
for the shape.

## Scheduled speaker digests

After each meeting, `GET /api/cron/send-digests` bundles that day's ballots by
speaker and emails each matched member one digest.

- **Trigger**: every Tuesday 20:00 `America/Edmonton`, an external timezone-aware
  scheduler ([cron-job.org](https://cron-job.org)) calls the endpoint with
  `Authorization: Bearer <CRON_SECRET>`. The endpoint re-checks the local hour as
  a second guard. (Vercel's native cron can't hit exactly 8 PM year-round on the
  Hobby plan, which caps crons at once per day — hence the external scheduler.)
- **Idempotent**: the `digest_log` table (`UNIQUE(meeting_id, speaker_name)`)
  ensures no speaker is emailed twice, even across re-fires, late ballots, or a
  manual admin send.
- **Conservative matching**: only speakers whose ballot name exactly and uniquely
  matches an active roster member are auto-sent. Guests, ambiguous, or misspelled
  names are skipped for the admin to send manually from the dashboard.
- **Admin re-send / preview**: `?date=YYYY-MM-DD` sends a specific past meeting's
  digests on demand (bypasses the 8 PM gate); `?dryRun=1` previews recipients
  without sending. Both still require `CRON_SECRET`.

## Data retention

`GET /api/cron/purge` (Vercel Cron, weekly) deletes meetings older than the
retention window; `ON DELETE CASCADE` clears their evaluations and reports.

## Deployment

Deployed on Vercel. Set the environment variables above in the Vercel project,
run `npm run db:init` once against the production database, and configure the
cron-job.org trigger for the 8 PM digest. The weekly purge runs from
`vercel.json`'s `crons`.

## Tech notes

- Server components by default; client components marked `'use client'`.
- JSONB columns store report entry arrays; type guards in `src/lib/types.ts`
  validate them before use.
- Auth is a signed (jose) session cookie checked per handler via `requireAuth`.
