# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Project overview

A Next.js (App Router) + TypeScript web app for the Spoken Word Toastmasters
club. Meeting organizers create a meeting, share a link/QR code, members submit
evaluations from their phones, and each speaker is automatically emailed a
single consolidated digest of their feedback at 8 PM after the meeting.

Deployed on Vercel. Postgres via `@vercel/postgres` (Neon). Email via Resend.
Auth via signed (jose) session cookies. No ORM; SQL is hand-written with
parameterized template literals.

## Commands

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # production build
npm run lint           # ESLint
npm test               # vitest run once  ·  npm run test:watch
npm run db:init        # idempotent CREATE TABLE IF NOT EXISTS (all 8 tables)
npm run seed:members   # import roster from scripts/members.json
```

Database setup is **explicit**, not on-first-request. Run `npm run db:init`
once per environment after wiring `POSTGRES_URL`. (Earlier versions called
`/api/init` from the admin page on load; that was removed as a deploy hazard.)

## Architecture

### Data layer (`src/lib/`)

- `db.ts` — `initializeDatabase()` and all queries. Tables created:
  `meetings`, `members`, `evaluations`, `ah_um_reports`, `grammarian_reports`,
  `timer_reports`, `general_evaluator_reports`, `digest_log` (8 total). JSONB
  columns store array data (entries, tags, feedbacks). Parameterized queries
  only — never string concatenation.
- `types.ts` — TypeScript interfaces + **type guards** (`isValid*`,
  `validate*Entries`) that validate JSONB rows from the DB before use. Use
  them whenever you read a JSONB column.
- `auth.ts` — jose JWT HS256 sessions. `requireAuth(request)` returns a 401
  `NextResponse` or `null`; call it at the top of every protected handler.
  `signMeetingToken` / `verifyMeetingToken` provide light replay protection
  on public evaluation submits.
- `email.ts` — Resend wrapper. `sendSpeakerDigest` (renders + sends),
  `renderSpeakerDigest` (pure, unit-testable). `emailFrom()` reads
  `EMAIL_FROM`; replies are routed via `REPLY_TO` to the club's Gmail.
- `digest-schedule.ts` — pure `edmontonNow()` / `isSendHour()` helpers.
  The 8 PM gate the cron endpoint uses; tested without a clock mock.
- `retention.ts` — pure `RETENTION_DAYS`, `retentionCutoffIso`, `isExpired`.
- `date.ts` — meeting-date formatting helpers (`CLUB_TIME_ZONE`,
  `formatMeetingDateLong`, etc.). Postgres DATE handling is timezone-aware so
  Tuesdays don't read as Mondays in `toLocaleDateString`.

### Data (`src/data/criteria.ts`)

Static evaluation criteria by category (Opening, Delivery, Voice, Content,
Connection).

### API routes (`src/app/api/`)

Auth-gated unless noted. Most use `requireAuth` directly; submit/login/today
are public.

- `POST /api/init` — admin-only (re-runs `initializeDatabase`; prefer `npm run db:init`).
- `POST /api/login` · `POST /api/logout` · `GET /login` page — Exec sign-in.
- `GET/POST /api/meetings` · `GET /api/meetings/[id]`.
- `GET /api/meetings/today` — **public**, used by the landing page to surface the active meeting.
- `GET /api/members` · `POST /api/members` · `GET/PUT/DELETE /api/members/[id]`.
- `POST /api/evaluations` — **public** (verifies a signed meeting submit token); `GET /api/evaluations` is auth-gated.
- `GET /api/reports/[meetingId]` and CRUD on `ah-um`, `grammarian`, `timer`, `general-evaluator`.
- `POST /api/email/speaker-digest` — admin manual per-speaker send (with explicit `member_id` chosen by the admin; records to `digest_log` so the auto-send won't duplicate).
- `GET /api/cron/purge` — Vercel Cron weekly (`0 11 * * 1`). `Authorization: Bearer ${CRON_SECRET}`.
- `GET /api/cron/send-digests` — scheduled 8 PM speaker digest. Triggered by an external timezone-aware scheduler (cron-job.org) at Tuesday 20:00 America/Edmonton, also gated by `isSendHour`. Admin overrides: `?date=YYYY-MM-DD` (specific meeting, bypasses the 8 PM gate) and `?dryRun=1` (preview without sending). Always requires `CRON_SECRET`.

### Components (`src/components/`)

- `EvaluationForm.tsx` — main ballot form with QuickCriteria tag selection.
- `PersonSelect.tsx` — native `<select>` populated from the active roster, with a "Guest / other" text-input fallback and a no-roster fallback. Used in EvaluationForm, StatisticianReport, GeneralEvaluatorReport.
- `QuickCriteria.tsx` — commend/recommend/challenge tag picker.
- `StarRating.tsx` — 1–5 star input.
- `StatisticianReport.tsx`, `GeneralEvaluatorReport.tsx` — modal report forms.

### Pages (`src/app/`)

- `page.tsx` — landing (QR code + today's meeting).
- `admin/page.tsx` — admin dashboard (meetings, evaluations, exports, manual digest send).
- `evaluate/[id]/page.tsx` — public ballot form (token-protected on submit).
- `evaluate/go/page.tsx` — stable redirect to today's meeting.
- `login/page.tsx`, `reminders/page.tsx`.

## Key patterns

- **JSONB validation**: never trust JSONB rows directly. Use the
  `validate*Entries` helpers in `types.ts` before consuming.
- **CSV / email sanitization**: `sanitizeForCSV` (admin/page.tsx) prefixes
  `=, +, -, @, tab, CR` with a single quote to block formula injection;
  `sanitizeForEmail` strips CR / clamps newlines to block header injection.
- **Auth**: at the top of any non-public handler:

  ```ts
  const denied = await requireAuth(request);
  if (denied) return denied;
  ```

  Don't rely on middleware path-matching alone for API auth.

- **Scheduled digest matching**: only auto-sends to a speaker whose ballot
  `speaker_name` *exactly and uniquely* equals an active member's
  `display_name`. Guests / ambiguous / misspelled names are skipped, not
  guessed — admin sends those manually. The dedup is via `digest_log`
  `UNIQUE(meeting_id, speaker_name)`.

- **Retention**: `purgeOldMeetings()` is the only place meetings are
  deleted; CASCADE clears their children.

## Important constraints

1. **Database driver**: `@vercel/postgres`. Don't introduce an ORM. Use
   `sql\`…\`` template tags with parameterized values.
2. **No on-demand schema bootstrap from the client**. Schema is created by
   `npm run db:init` (or the gated `POST /api/init`), not lazily.
3. **Env vars** required (see `.env.example`): `POSTGRES_URL` (+ family),
   `ADMIN_PASSWORD`, `COOKIE_SECRET` (≥16 chars), `CRON_SECRET`,
   `RESEND_API_KEY`, `EMAIL_FROM`, `REPLY_TO`.
4. **Vercel plan is Hobby** — crons capped at once per day. The 8 PM digest
   therefore can't be a native twice-daily Vercel cron; it's driven by an
   external timezone-aware scheduler (cron-job.org). If the project ever
   moves to Pro, re-adding `{ path:'/api/cron/send-digests', schedule:'0 2,3 * * *' }`
   to `vercel.json` works natively with no code change (the local-hour gate
   is already in place).
5. **JSONB columns**: always validate (see Patterns).
6. **Next.js App Router**, not Pages. Server components by default;
   `'use client'` only where needed.

## Deployment

Push to `master` → Vercel deploys production. Env vars are managed in the
Vercel dashboard. After any schema change, run `npm run db:init` against
the target environment (idempotent). The 8 PM digest trigger lives in
cron-job.org with `Authorization: Bearer ${CRON_SECRET}`; the weekly purge
runs from `vercel.json`'s `crons`.
