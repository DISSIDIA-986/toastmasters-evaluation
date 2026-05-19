'use client';

import { useMemo, useState } from 'react';

// Anchor "today" in Calgary's timezone so the default doesn't drift by a day
// when the page is rendered from a UTC headless browser or a non-Mountain
// locale. We also fall back to today if today is already Tuesday, so the
// organizer can fire the page up Tuesday morning and not have to re-pick.
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

// Render YYYY-MM-DD as "Tuesday, May 19" — parse as UTC to dodge the
// off-by-one display bug we hit elsewhere in the app when meetings rendered
// as the previous day in Mountain Time.
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

interface SpeakerRow {
  id: string;
  speaker: string;
  evaluator: string;
  sent: boolean;
}

function newRow(): SpeakerRow {
  return {
    id: Math.random().toString(36).slice(2, 10),
    speaker: '',
    evaluator: '',
    sent: false,
  };
}

const SUBJECT = "Reminders for Tuesday's meeting — agenda details + Basecamp feedback request";

function buildBody(
  speaker: string,
  evaluator: string,
  dateIso: string,
): string {
  const dateLabel = formatDate(dateIso);
  return `Hi ${speaker},

Two quick things before our meeting on ${dateLabel}:

1. Fill your speech details on the SpokenWord agenda form so the printed agenda is accurate and the Toastmaster can introduce you properly:
   https://spokenwordcalgary.toastmastersclubs.org/agenda.html
   Save: Pathway · Project & Time · Project Title · Speech Introduction.

2. Send a Basecamp feedback request to your evaluator, ${evaluator}, before the meeting. This lets ${evaluator} focus on what you actually want feedback on, and it's the step we most often forget:
   https://app.basecamp.toastmasters.org/dashboard/feedback
   • Click "Request Feedback"
   • Club: Spoken Word Toastmasters Club
   • Member(s): ${evaluator}
   • Request: one line, e.g. "Please give feedback on my audience awareness in my upcoming speech."
   • Visibility: Selected member(s) only → Send

If you can't make it on ${dateLabel}, please let us know ASAP so we can arrange a swap.

See you Tuesday at 6:15 PM!
Spoken Word Club`;
}

interface SpeakerCardProps {
  row: SpeakerRow;
  index: number;
  dateIso: string;
  canRemove: boolean;
  onChange: (patch: Partial<SpeakerRow>) => void;
  onRemove: () => void;
}

function SpeakerCard({
  row,
  index,
  dateIso,
  canRemove,
  onChange,
  onRemove,
}: SpeakerCardProps) {
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null);
  const filled = row.speaker.trim() && row.evaluator.trim() && dateIso;
  const body = useMemo(
    () => buildBody(row.speaker.trim() || '[speaker]', row.evaluator.trim() || '[evaluator]', dateIso),
    [row.speaker, row.evaluator, dateIso],
  );

  const copy = async (kind: 'subject' | 'body', text: string) => {
    if (!filled) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable — silent no-op.
    }
  };

  const openMail = () => {
    if (!filled) return;
    const mailto = `mailto:?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <section className={`bg-white rounded-2xl shadow-sm border-2 p-6 mb-6 transition-colors ${row.sent ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
      <header className="flex justify-between items-start mb-4 gap-3">
        <h2 className="text-lg font-bold text-gray-900">
          Speaker #{index + 1}{row.speaker.trim() ? ` — ${row.speaker.trim()}` : ''}
        </h2>
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={row.sent}
              onChange={(e) => onChange({ sent: e.target.checked })}
              className="w-4 h-4 accent-green-600"
            />
            Sent
          </label>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-gray-400 hover:text-red-600 transition px-2 py-1 rounded"
              aria-label="Remove speaker"
              title="Remove this speaker"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Speaker name</span>
          <input
            type="text"
            value={row.speaker}
            onChange={(e) => onChange({ speaker: e.target.value })}
            placeholder="e.g. Riho Kobayashi"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-gray-600 mb-1">Evaluator name</span>
          <input
            type="text"
            value={row.evaluator}
            onChange={(e) => onChange({ evaluator: e.target.value })}
            placeholder="e.g. Nnamdi Onaga"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
          />
        </label>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3 text-sm">
        <div className="font-semibold text-gray-700 mb-1">Subject</div>
        <div className="text-gray-900 mb-3 whitespace-pre-wrap break-words">{SUBJECT}</div>
        <div className="font-semibold text-gray-700 mb-1">Body</div>
        <div className="text-gray-800 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">
          {body}
        </div>
      </div>

      {!filled && (
        <p className="text-orange-600 text-sm mb-3">
          Fill speaker, evaluator, and date to enable copy / mail buttons.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!filled}
          onClick={() => copy('subject', SUBJECT)}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {copied === 'subject' ? 'Copied ✓' : 'Copy subject'}
        </button>
        <button
          type="button"
          disabled={!filled}
          onClick={() => copy('body', body)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {copied === 'body' ? 'Copied ✓' : 'Copy body'}
        </button>
        <button
          type="button"
          disabled={!filled}
          onClick={openMail}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Open in mail app
        </button>
      </div>
    </section>
  );
}

export default function RemindersPage() {
  const [dateIso, setDateIso] = useState<string>(() => nextTuesdayIso());
  const [rows, setRows] = useState<SpeakerRow[]>(() => [newRow(), newRow()]);

  const updateRow = (id: string, patch: Partial<SpeakerRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };
  const addRow = () => {
    setRows((prev) => [...prev, newRow()]);
  };
  const resetSent = () => {
    setRows((prev) => prev.map((r) => ({ ...r, sent: false })));
  };

  const sentCount = rows.filter((r) => r.sent).length;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Pre-Meeting Reminders
        </h1>
        <p className="text-gray-600 mb-6">
          One reminder per Prepared Speaker. Each email covers both tasks they
          need to do before Tuesday: fill the SpokenWord agenda and send a
          Basecamp feedback request to their evaluator. Nothing is sent from
          this page — it just builds the message for you to copy into your
          email client.
        </p>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Meeting date</span>
            <input
              type="date"
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
            />
          </label>
          <div className="text-sm text-gray-500 grow">
            Sent: <span className="font-semibold text-gray-800">{sentCount} / {rows.length}</span>
          </div>
          {sentCount > 0 && (
            <button
              type="button"
              onClick={resetSent}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Reset "Sent" marks
            </button>
          )}
        </section>

        {rows.map((row, i) => (
          <SpeakerCard
            key={row.id}
            row={row}
            index={i}
            dateIso={dateIso}
            canRemove={rows.length > 1}
            onChange={(patch) => updateRow(row.id, patch)}
            onRemove={() => removeRow(row.id)}
          />
        ))}

        <button
          type="button"
          onClick={addRow}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-600 font-medium hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition"
        >
          + Add another speaker
        </button>

        <footer className="text-xs text-gray-400 mt-6">
          Tip: the “Open in mail app” button uses <code>mailto:</code> and may
          be truncated by web-based mail clients. For long messages prefer
          “Copy body” and paste into a fresh message.
        </footer>
      </div>
    </main>
  );
}
