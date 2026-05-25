'use client';

import { useState, useEffect, useMemo } from 'react';
import { Member, Evaluation, Meeting } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  meeting: Meeting;
  evaluations: Evaluation[];
}

type SendState = 'idle' | 'sending' | 'sent' | 'failed';

const ACCENTS = ['bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500'];

/**
 * P4 send screen. Groups a meeting's evaluations by free-text speaker_name; the
 * admin maps each group to a roster member (native <select>, decision D4A) to
 * resolve the email, then sends per-card (decision D2A: no bulk send, and an
 * explicit confirm — two "Daniel" members make a mis-send a privacy leak).
 * A speaker with no member match is treated as a guest (decision D3A): can't
 * send, but the feedback can be copied for manual hand-off.
 */
export default function SpeakerDigestSender({ open, onClose, meeting, evaluations }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [picked, setPicked] = useState<Record<string, number | ''>>({});
  const [state, setState] = useState<Record<string, SendState>>({});
  const [sentTo, setSentTo] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Group evaluations by speaker_name (the free-text value on each ballot).
  const groups = useMemo(() => {
    const m: Record<string, Evaluation[]> = {};
    for (const e of evaluations) (m[e.speaker_name] ??= []).push(e);
    return m;
  }, [evaluations]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/members')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Member[]) => {
        const active = Array.isArray(data) ? data.filter((m) => m.active) : [];
        setMembers(active);
        // Preselect only on an exact (case-insensitive) name match. Ambiguous /
        // partial matches are left blank so the admin must choose — this is the
        // two-Daniel guard.
        setPicked((prev) => {
          const next = { ...prev };
          for (const speaker of Object.keys(groups)) {
            if (next[speaker] != null) continue;
            const exact = active.filter(
              (mem) => mem.display_name.toLowerCase() === speaker.trim().toLowerCase(),
            );
            next[speaker] = exact.length === 1 ? exact[0].id : '';
          }
          return next;
        });
      })
      .catch(() => setMembers([]));
  }, [open, groups]);

  if (!open) return null;

  const send = async (speaker: string) => {
    const memberId = picked[speaker];
    if (!memberId) return;
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    if (!confirm(`Send ${speaker}'s feedback to ${member.display_name} (${member.email})?`)) return;

    setState((s) => ({ ...s, [speaker]: 'sending' }));
    setErrors((e) => ({ ...e, [speaker]: '' }));
    try {
      const res = await fetch('/api/email/speaker-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: meeting.id, speaker_name: speaker, member_id: memberId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setState((s) => ({ ...s, [speaker]: 'sent' }));
      setSentTo((t) => ({ ...t, [speaker]: data.to || member.email }));
    } catch (e) {
      setState((s) => ({ ...s, [speaker]: 'failed' }));
      setErrors((er) => ({ ...er, [speaker]: e instanceof Error ? e.message : 'Send failed' }));
    }
  };

  const speakers = Object.keys(groups);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 my-8">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Send Speaker Feedback</h2>
            <p className="text-sm text-gray-500">
              {meeting.name} · {speakers.length} speaker{speakers.length === 1 ? '' : 's'} · map each to a member, then send
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none" aria-label="Close">×</button>
        </header>

        <div className="px-6 py-5">
          {speakers.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">
              No ballots collected yet for this meeting. Once evaluators submit via the QR form,
              speakers appear here ready to send.
            </p>
          ) : (
            speakers.map((speaker, i) => {
              const evals = groups[speaker];
              const st = state[speaker] || 'idle';
              const exactMatches = members.filter(
                (m) => m.display_name.toLowerCase() === speaker.trim().toLowerCase(),
              );
              const ambiguousName = exactMatches.length > 1;
              return (
                <div key={speaker} className={`border rounded-xl p-4 mb-3 ${st === 'failed' ? 'border-red-200' : 'border-gray-200'} ${st === 'sent' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 flex items-center">
                        <span className={`inline-flex w-7 h-7 rounded-full text-white text-xs font-bold items-center justify-center mr-2 ${ACCENTS[i % ACCENTS.length]}`}>{i + 1}</span>
                        {speaker}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 ml-9">
                        {evals.length} evaluation{evals.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    {st === 'sent' && (
                      <div className="text-emerald-600 text-sm font-medium whitespace-nowrap">✓ Sent to {sentTo[speaker]}</div>
                    )}
                  </div>

                  {st !== 'sent' && (
                    <div className="ml-9 mt-3 flex flex-wrap items-end gap-2">
                      <label className="flex-1 min-w-[200px]">
                        <span className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Send to member</span>
                        <select
                          value={picked[speaker] ?? ''}
                          onChange={(e) => setPicked((p) => ({ ...p, [speaker]: e.target.value ? Number(e.target.value) : '' }))}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                        >
                          <option value="">{members.length ? 'Pick member…' : 'No roster — add members first'}</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>{m.display_name} · {m.email}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() => send(speaker)}
                        disabled={!picked[speaker] || st === 'sending'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {st === 'sending' ? 'Sending…' : st === 'failed' ? 'Retry' : 'Send digest'}
                      </button>
                    </div>
                  )}

                  {ambiguousName && st !== 'sent' && (
                    <p className="ml-9 mt-2 text-xs text-amber-600">⚠ More than one member named “{speaker}” — pick the right one.</p>
                  )}
                  {!picked[speaker] && members.length > 0 && st === 'idle' && (
                    <p className="ml-9 mt-2 text-xs text-gray-400">Guest or unmatched? Pick a member to send, or leave unsent.</p>
                  )}
                  {st === 'failed' && (
                    <p className="ml-9 mt-2 text-sm text-red-600">✕ {errors[speaker] || 'Send failed'}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
