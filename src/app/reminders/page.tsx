'use client';

import { useMemo, useState, useEffect } from 'react';
import { Member } from '@/lib/types';

// Anchor "today" in Calgary's timezone so the default doesn't drift by a day
// when the page is rendered from a UTC headless browser or a non-Mountain
// locale. Falls back to today if today is already Tuesday.
function nextTuesdayIso(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Edmonton',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const day = weekdayMap[get('weekday')] ?? 0;
  const daysUntilTue = (2 - day + 7) % 7;
  const utc = new Date(Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
  ));
  utc.setUTCDate(utc.getUTCDate() + daysUntilTue);
  return utc.toISOString().split('T')[0];
}

// Render YYYY-MM-DD as "Tuesday, May 19" — UTC parse to dodge the
// off-by-one display bug we hit elsewhere in the app.
function formatDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// Permissive RFC-5321ish check — good enough to catch typos like missing @,
// not a security boundary. Mail clients handle the rest.
function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

interface SpeakerRow {
  id: string;
  speakerName: string;
  speakerEmail: string;
  evaluatorName: string;
  evaluatorEmail: string;
}

function newRow(): SpeakerRow {
  return {
    id: Math.random().toString(36).slice(2, 10),
    speakerName: '',
    speakerEmail: '',
    evaluatorName: '',
    evaluatorEmail: '',
  };
}

const SUBJECT = "Reminders for Tuesday's meeting — agenda details + Basecamp feedback request";

function buildBody(rows: SpeakerRow[], dateIso: string): string {
  const dateLabel = formatDate(dateIso);
  const pairs = rows
    .filter((r) => r.speakerName.trim() && r.evaluatorName.trim())
    .map((r) => `  • ${r.speakerName.trim()}  ←→  ${r.evaluatorName.trim()}`)
    .join('\n');

  return `Hi speakers and evaluators,

Two quick reminders for our meeting on ${dateLabel}:

FOR SPEAKERS — please do both before Monday night:

1. Fill your speech details on the SpokenWord agenda form so the printed agenda is accurate and the Toastmaster can introduce you properly:
   https://spokenwordcalgary.toastmastersclubs.org/agenda.html
   Save: Pathway · Project & Time · Project Title · Speech Introduction.

2. Send a Basecamp feedback request to your assigned evaluator (see the pairing list below). This lets your evaluator focus on what you actually want feedback on, and it's the step we most often forget:
   https://app.basecamp.toastmasters.org/dashboard/feedback
   • Click "Request Feedback"
   • Club: Spoken Word Toastmasters Club
   • Member(s): your evaluator
   • Request: one line, e.g. "Please give feedback on my audience awareness in my upcoming speech."
   • Visibility: Selected member(s) only → Send

FOR EVALUATORS — please watch for that Basecamp feedback request from your speaker. If you don't get one by Monday evening, a friendly nudge is welcome.

Pairings for this meeting:
${pairs || '  • (add speaker / evaluator pairs in the table to populate this list)'}

If anyone can't make it on ${dateLabel}, please let us know ASAP so we can arrange a swap.

See you Tuesday at 6:15 PM!
Spoken Word Club`;
}

// Accent palette so each pair row carries a stable colour into the pairing
// list — helps the operator visually confirm row order matches the body.
const ACCENTS = [
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-rose-500',
];

export default function RemindersPage() {
  const [dateIso, setDateIso] = useState<string>(() => nextTuesdayIso());
  const [rows, setRows] = useState<SpeakerRow[]>(() => [newRow(), newRow()]);
  const [copied, setCopied] = useState<'to' | 'cc' | 'body' | null>(null);

  // Active roster, used to populate the per-row member pickers. This page is
  // behind auth (middleware), so /api/members is reachable with the session.
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    fetch('/api/members')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Member[]) =>
        setMembers(Array.isArray(data) ? data.filter((m) => m.active) : []),
      )
      .catch(() => setMembers([]));
  }, []);

  const updateRow = (id: string, patch: Partial<SpeakerRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  const addRow = () => setRows((prev) => [...prev, newRow()]);

  const speakerEmails = rows
    .map((r) => r.speakerEmail.trim())
    .filter((e) => isEmail(e));
  const evaluatorEmails = rows
    .map((r) => r.evaluatorEmail.trim())
    .filter((e) => isEmail(e));
  const toLine = speakerEmails.join(', ');
  const ccLine = evaluatorEmails.join(', ');

  const body = useMemo(() => buildBody(rows, dateIso), [rows, dateIso]);

  // Soft validation: any row with a name but no email, or vice versa, is a
  // likely-incomplete entry. We don't block — operator can still copy the
  // body — but we surface a warning so missing emails aren't silent.
  const incompleteRows = rows
    .map((r, i) => ({ row: r, index: i }))
    .filter(({ row }) => {
      const hasSpeakerName = !!row.speakerName.trim();
      const hasSpeakerEmail = isEmail(row.speakerEmail);
      const hasEvaluatorName = !!row.evaluatorName.trim();
      const hasEvaluatorEmail = isEmail(row.evaluatorEmail);
      const anyFilled =
        hasSpeakerName || hasSpeakerEmail || hasEvaluatorName || hasEvaluatorEmail;
      const allFilled =
        hasSpeakerName && hasSpeakerEmail && hasEvaluatorName && hasEvaluatorEmail;
      return anyFilled && !allFilled;
    });

  const canSend = speakerEmails.length > 0 && evaluatorEmails.length > 0 && dateIso;

  const copy = async (kind: 'to' | 'cc' | 'body', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable — silent no-op.
    }
  };

  const openMail = () => {
    if (!canSend) return;
    const params = new URLSearchParams();
    params.set('subject', SUBJECT);
    if (ccLine) params.set('cc', ccLine);
    params.set('body', body);
    // Encode "to" as the pre-? portion so it works across more mail clients.
    const mailto = `mailto:${encodeURIComponent(toLine)}?${params.toString()}`;
    window.location.href = mailto;
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Pre-Meeting Reminders
        </h1>
        <p className="text-gray-600 mb-6">
          One batched reminder to all speakers and their evaluators for the
          upcoming meeting. Speakers go to <strong>To:</strong>, evaluators go to
          <strong> CC:</strong>. Add a row per Prepared Speech pair — the
          pairing list is rendered into the email body so everyone can see who
          they&apos;re paired with. Nothing is sent from this page.
        </p>

        {/* Roster table — primary entry surface. + Add speaker sits in the
            header next to the date so the control is visible alongside the
            data. */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <header className="flex flex-wrap items-end gap-4 mb-4">
            <label className="block">
              <span className="block text-xs font-medium text-gray-600 mb-1">Meeting date</span>
              <input
                type="date"
                value={dateIso}
                onChange={(e) => setDateIso(e.target.value)}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
              />
            </label>
            <div className="grow text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{rows.length}</span> speaker pair{rows.length === 1 ? '' : 's'}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
            >
              + Add speaker
            </button>
          </header>

          {members.length === 0 && (
            <p className="text-xs text-amber-600 mb-3">
              No roster loaded — add members in Admin → Roster to enable quick-pick.
              You can still type names manually.
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-2 py-2 w-10">#</th>
                  <th className="px-2 py-2">Speaker</th>
                  <th className="px-2 py-2">Evaluator</th>
                  <th className="px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const accent = ACCENTS[i % ACCENTS.length];
                  return (
                    <tr key={row.id} className="border-t border-gray-100 align-top">
                      <td className="px-2 py-3">
                        <span className={`inline-flex w-7 h-7 rounded-full text-white text-xs font-bold items-center justify-center ${accent}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-2 py-3 space-y-2">
                        <MemberPicker
                          members={members}
                          onPick={(name, email) => updateRow(row.id, { speakerName: name, speakerEmail: email })}
                        />
                        <input
                          type="text"
                          value={row.speakerName}
                          onChange={(e) => updateRow(row.id, { speakerName: e.target.value })}
                          placeholder="Speaker name"
                          className="w-full px-3 py-2 border-2 border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                        />
                        <input
                          type="email"
                          value={row.speakerEmail}
                          onChange={(e) => updateRow(row.id, { speakerEmail: e.target.value })}
                          placeholder="speaker@email.com"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full px-3 py-2 border-2 border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-xs"
                        />
                      </td>
                      <td className="px-2 py-3 space-y-2">
                        <MemberPicker
                          members={members}
                          onPick={(name, email) => updateRow(row.id, { evaluatorName: name, evaluatorEmail: email })}
                        />
                        <input
                          type="text"
                          value={row.evaluatorName}
                          onChange={(e) => updateRow(row.id, { evaluatorName: e.target.value })}
                          placeholder="Evaluator name"
                          className="w-full px-3 py-2 border-2 border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                        />
                        <input
                          type="email"
                          value={row.evaluatorEmail}
                          onChange={(e) => updateRow(row.id, { evaluatorEmail: e.target.value })}
                          placeholder="evaluator@email.com"
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full px-3 py-2 border-2 border-gray-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors text-xs"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        {rows.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="text-gray-400 hover:text-red-600 transition"
                            aria-label={`Remove row ${i + 1}`}
                          >
                            ✕
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {incompleteRows.length > 0 && (
            <p className="mt-3 text-orange-600 text-sm">
              Row{incompleteRows.length > 1 ? 's' : ''}{' '}
              {incompleteRows.map((r) => `#${r.index + 1}`).join(', ')} {incompleteRows.length > 1 ? 'are' : 'is'} partially filled — names or emails missing.
            </p>
          )}
        </section>

        {/* Single preview pane — recipients + subject + body. Recipients are
            shown verbatim so the operator can confirm before opening their
            mail client. */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Email preview</h2>

          <div className="space-y-3 mb-4 text-sm">
            <RecipientRow label="To" value={toLine} placeholder="(no speaker emails yet)" />
            <RecipientRow label="Cc" value={ccLine} placeholder="(no evaluator emails yet)" />
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Subject</div>
              <div className="text-gray-900 break-words">{SUBJECT}</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Body</div>
            <div className="text-gray-800 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">
              {body}
            </div>
          </div>

          {!canSend && (
            <p className="text-orange-600 text-sm mb-3">
              Add at least one speaker email and one evaluator email to enable
              the mail / copy buttons.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!toLine}
              onClick={() => copy('to', toLine)}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {copied === 'to' ? 'Copied ✓' : 'Copy To list'}
            </button>
            <button
              type="button"
              disabled={!ccLine}
              onClick={() => copy('cc', ccLine)}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {copied === 'cc' ? 'Copied ✓' : 'Copy Cc list'}
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => copy('body', body)}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {copied === 'body' ? 'Copied ✓' : 'Copy body'}
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={openMail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Open in mail app
            </button>
          </div>
        </section>

        <footer className="text-xs text-gray-400 mt-6">
          Tip: the “Open in mail app” button uses <code>mailto:</code> and may
          be truncated by web-based mail clients. For long messages prefer
          “Copy body” and paste into a fresh message after pasting the To /
          Cc lists.
        </footer>
      </div>
    </main>
  );
}

// Native <select> roster picker. Filling name+email from the roster avoids
// manual typing (and typos in emails). Renders nothing when the roster is
// empty so the manual text inputs are the only surface. Native select gives
// keyboard + screen-reader support for free; 19 members fits a select fine.
function MemberPicker({
  members,
  onPick,
}: {
  members: Member[];
  onPick: (name: string, email: string) => void;
}) {
  if (members.length === 0) return null;
  return (
    <select
      value=""
      onChange={(e) => {
        const m = members.find((x) => String(x.id) === e.target.value);
        if (m) onPick(m.display_name, m.email);
      }}
      aria-label="Pick a member to fill name and email"
      className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg text-sm text-gray-600 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
    >
      <option value="">Pick member…</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.display_name}
        </option>
      ))}
    </select>
  );
}

interface RecipientRowProps {
  label: string;
  value: string;
  placeholder: string;
}

function RecipientRow({ label, value, placeholder }: RecipientRowProps) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`break-words ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
        {value || placeholder}
      </div>
    </div>
  );
}
