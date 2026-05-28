# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/); this project uses semver.

## [0.2.3] - 2026-05-27

### Added
- **Automatic speaker feedback at 8 PM** (Nelson's call: Option 2). After each
  meeting, every speaker is emailed one consolidated digest of all their
  feedback, sent automatically at 8 PM club time. A new `digest_log` table makes
  it idempotent — re-runs, late ballots, and manual resends never double-send.
  Only exact, unique roster matches are auto-sent; guests / ambiguous names are
  left for the admin to send manually. Triggered every Tuesday 8 PM by an external
  timezone-aware scheduler (cron-job.org) that calls the send endpoint; the
  endpoint keeps a local-time (America/Edmonton) gate so the send lands at exactly
  8 PM across daylight saving. (Vercel's native cron can't do this on the Hobby
  plan, which caps crons at once per day.)
- **Admin re-send / catch-up**: the send endpoint takes `?date=YYYY-MM-DD` to send
  a specific past meeting's digests on demand, and `?dryRun=1` to preview who would
  be emailed without sending. Both still require the cron secret.

## [0.2.2] - 2026-05-27

### Changed
- Feedback emails now set a **Reply-To** of the club's official Gmail
  (spokenwordcalgary@gmail.com), so anyone who replies reaches the Executive
  Committee inbox. Sender stays the verified club domain — no change to the
  shared Gmail account (no 2-Step Verification, no app password).

## [0.2.1] - 2026-05-27

### Fixed
- **Evaluation form readability**: placeholder text is now darker (gray-600, ~7:1
  contrast) across all forms — reported as hard to read for low-vision members.
- **Pick names, don't type them**: evaluator and speaker on the public evaluation
  form, and every person field in the Statistician and General Evaluator reports,
  are now roster dropdowns with a "Guest / other" option for non-members. Falls
  back to a text input if the roster can't load.

## [0.2.0] - 2026-05-25

Turns the tool from a public, unauthenticated evaluation collector into a club
operations tool: Executive-Committee sign-in, a member roster, in-system email,
and automatic data retention.

### Added
- **Exec sign-in.** Shared-password login (`/login`) issues a signed (jose JWT)
  HttpOnly session cookie; `/admin` and `/reminders` redirect to login without a
  valid session.
- **Server-side API guards.** `requireAuth()` protects every data endpoint
  (`GET /api/meetings`, `/api/meetings/[id]`, `GET /api/evaluations`, all
  `/api/reports/*`, and the roster + send endpoints). `/api/meetings/today` and
  public ballot submission stay open.
- **Member roster.** `members` table (display name + email + active flag), a
  deploy-time seed (`npm run seed:members`, reads a gitignored data file), and an
  admin roster manager (add / edit / activate / deactivate).
- **Roster dropdowns** for reminder recipients (native select, keyboard- and
  screen-reader-friendly; manual entry preserved for guests).
- **Speaker feedback email.** Resend integration sends each speaker a single HTML
  digest of their ballots. Admin maps each speaker to a member at send time
  (per-card send with confirmation — no bulk send, to prevent mis-sends between
  members with similar names). Guest/unmatched, sent, and failed states included.
- **Automatic retention.** A weekly Vercel cron purges meetings older than 4
  weeks (cascade-deleting their ballots), shrinking the standing PII surface.
- **Test suite.** Added Vitest (32 tests): session/token sign + verify, auth
  boundaries, retention cutoff math, and digest rendering/escaping.

### Changed
- **Schema bootstrap** moved off the public request path. The admin page no
  longer calls `/api/init` on load; schema is created at deploy via
  `npm run db:init`, and `/api/init` is now an authenticated POST.
- Public ballot submission now requires a signed per-meeting token (light
  protection against drive-by API posts and cross-meeting replay).

### Security
- Removed the unauthenticated admin surface that exposed all evaluations before
  the roster (PII) was introduced.
- Member emails are kept out of git history (gitignored seed data file).
