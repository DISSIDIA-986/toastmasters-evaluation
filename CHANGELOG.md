# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/); this project uses semver.

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
