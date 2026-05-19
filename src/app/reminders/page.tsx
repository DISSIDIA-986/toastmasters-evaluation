'use client';

import { useMemo, useState } from 'react';

// Next Tuesday at 6:25 PM Mountain Time is when our meetings start.
// Reminders are sent BEFORE the meeting, so default the date input to the
// upcoming Tuesday (or today if today already is one).
//
// Anchor "today" in Calgary's timezone so the default doesn't drift by a day
// when the page is rendered from a UTC headless browser or a non-Mountain
// locale. The earlier implementation used `new Date().getDay()` which read
// the host machine's local time and produced a Wednesday default on a UTC
// host running shortly after 18:00 MDT.
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
  // Carry the calculation in UTC so setUTCDate + toISOString stays stable
  // regardless of the host's local offset.
  const utc = new Date(Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
  ));
  utc.setUTCDate(utc.getUTCDate() + daysUntilTue);
  return utc.toISOString().split('T')[0];
}

// Render YYYY-MM-DD as "Tuesday, May 19" — parse as UTC to dodge the off-by-
// one display bug we hit elsewhere in the app when meetings rendered as the
// previous day in Mountain Time.
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

type FieldKey = 'speaker' | 'evaluator' | 'date';

interface Field {
  key: FieldKey;
  label: string;
  type: 'text' | 'date';
  placeholder?: string;
}

interface ReminderCardProps {
  emoji: string;
  title: string;
  description: string;
  fields: Field[];
  defaultValues: Record<FieldKey, string>;
  buildSubject: (v: Record<FieldKey, string>) => string;
  buildBody: (v: Record<FieldKey, string>) => string;
}

function ReminderCard({
  emoji,
  title,
  description,
  fields,
  defaultValues,
  buildSubject,
  buildBody,
}: ReminderCardProps) {
  const [values, setValues] = useState<Record<FieldKey, string>>(defaultValues);
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null);

  const allFilled = fields.every((f) => values[f.key]?.trim());
  const subject = useMemo(() => buildSubject(values), [buildSubject, values]);
  const body = useMemo(() => buildBody(values), [buildBody, values]);

  const copy = async (kind: 'subject' | 'body', text: string) => {
    if (!allFilled) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable (older browser, permissions) — silently no-op.
    }
  };

  const openMail = () => {
    if (!allFilled) return;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <header className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-3 text-gray-900">
          <span className="text-2xl" aria-hidden>{emoji}</span>
          <span>{title}</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">{f.label}</span>
            <input
              type={f.type}
              value={values[f.key] ?? ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
              placeholder={f.placeholder}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
            />
          </label>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3 text-sm">
        <div className="font-semibold text-gray-700 mb-1">Subject</div>
        <div className="text-gray-900 mb-3 whitespace-pre-wrap break-words">{subject}</div>
        <div className="font-semibold text-gray-700 mb-1">Body</div>
        <div className="text-gray-800 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">
          {body}
        </div>
      </div>

      {!allFilled && (
        <p className="text-orange-600 text-sm mb-3">
          Fill all fields to enable copy / mail buttons.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!allFilled}
          onClick={() => copy('subject', subject)}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {copied === 'subject' ? 'Copied ✓' : 'Copy subject'}
        </button>
        <button
          type="button"
          disabled={!allFilled}
          onClick={() => copy('body', body)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {copied === 'body' ? 'Copied ✓' : 'Copy body'}
        </button>
        <button
          type="button"
          disabled={!allFilled}
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
  const tue = nextTuesdayIso();

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Pre-Meeting Reminders
        </h1>
        <p className="text-gray-600 mb-8">
          Fill in names and the meeting date, then copy the subject and body
          into your email client (or open a draft in your default mail app).
          Nothing is sent from this page — it just builds the message for you.
        </p>

        <ReminderCard
          emoji="📝"
          title="To a Prepared Speaker — fill the SpokenWord agenda"
          description="Send Monday, before the agenda blast."
          fields={[
            { key: 'speaker', label: 'Speaker name', type: 'text', placeholder: 'e.g. Riho Kobayashi' },
            { key: 'date', label: 'Meeting date', type: 'date' },
          ]}
          defaultValues={{ speaker: '', evaluator: '', date: tue }}
          buildSubject={() => 'Please fill your speech details on SpokenWord today'}
          buildBody={(v) => `Hi ${v.speaker},

You're scheduled as a Prepared Speaker at our meeting on ${formatDate(v.date)}. Before the agenda goes out tonight, please take two minutes on the SpokenWord agenda form:

https://spokenwordcalgary.toastmastersclubs.org/agenda.html

And save the following so the printed agenda is accurate and the Toastmaster can introduce you properly:
  • Pathway (e.g. Presentation Mastery)
  • Project & Time (e.g. L1 — Writing a Speech with Purpose, 5–7 min)
  • Project Title
  • Speech Introduction (a complete intro for the Toastmaster to read)

If you can't make it, please let me know ASAP so we can arrange a swap.

See you Tuesday at 6:25 PM!
Nelson`}
        />

        <ReminderCard
          emoji="📨"
          title="To an Evaluator — send the Basecamp feedback request"
          description="Send mid-week before the meeting."
          fields={[
            { key: 'evaluator', label: 'Evaluator name', type: 'text', placeholder: 'e.g. Nnamdi Onaga' },
            { key: 'speaker', label: 'Speaker name', type: 'text', placeholder: 'e.g. Riho Kobayashi' },
            { key: 'date', label: 'Meeting date', type: 'date' },
          ]}
          defaultValues={{ speaker: '', evaluator: '', date: tue }}
          buildSubject={() => 'Please send your Basecamp feedback request before Tuesday'}
          buildBody={(v) => `Hi ${v.evaluator},

Thanks for evaluating ${v.speaker}'s prepared speech on ${formatDate(v.date)}. Quick reminder to send your feedback request through Basecamp before the meeting — this lets ${v.speaker} tell you what to focus on, and it's the step we most often forget.

  1. Open https://app.basecamp.toastmasters.org/dashboard/feedback
  2. Click "Request Feedback"
  3. Club: Spoken Word Toastmasters Club
  4. Member(s): ${v.speaker}
  5. Request: one line, e.g. "Please give feedback on my audience awareness in my upcoming speech."
  6. Visibility: Selected member(s) only → Send

Takes under a minute. Thanks!
Nelson`}
        />

        <footer className="text-xs text-gray-400 mt-4">
          Tip: the “Open in mail app” button uses <code>mailto:</code> and may
          be truncated by web-based mail clients. For long messages, prefer
          “Copy body” and paste into a fresh message.
        </footer>
      </div>
    </main>
  );
}
