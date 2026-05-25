'use client';

import { useState, useEffect, useCallback } from 'react';
import { Member } from '@/lib/types';

interface MembersManagerProps {
  open: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Admin-only club roster manager (modal). Lists members, adds/edits/deactivates.
 * The roster is PII — this surface lives behind auth (admin page is gated by
 * middleware). The public evaluate form never reads it.
 */
export default function MembersManager({ open, onClose }: MembersManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New-member form.
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to load roster');
      setMembers(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();
    if (!name || !EMAIL_RE.test(email)) {
      setError('Enter a name and a valid email.');
      return;
    }
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name, email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to add member');
      }
      setNewName('');
      setNewEmail('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (m: Member) => {
    setError('');
    try {
      const res = await fetch(`/api/members/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: m.display_name, email: m.email, active: !m.active }),
      });
      if (!res.ok) throw new Error('Failed to update member');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update member');
    }
  };

  const removeMember = async (m: Member) => {
    if (!confirm(`Remove ${m.display_name} from the roster? This deletes the record.`)) return;
    setError('');
    try {
      const res = await fetch(`/api/members/${m.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete member');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 my-8">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Club Roster</h2>
            <p className="text-sm text-gray-500">
              {members.length} member{members.length === 1 ? '' : 's'} · used for email recipients
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close roster"
          >
            ×
          </button>
        </header>

        <div className="px-6 py-5">
          {/* Add member */}
          <form onSubmit={addMember} className="flex flex-wrap items-end gap-2 mb-5">
            <label className="flex-1 min-w-[140px]">
              <span className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Name</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Daniel B."
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
              />
            </label>
            <label className="flex-1 min-w-[180px]">
              <span className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Email</span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
              />
            </label>
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {adding ? 'Adding…' : '+ Add'}
            </button>
          </form>

          {error && (
            <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>
          )}

          {loading ? (
            <p className="text-gray-500 py-6 text-center">Loading roster…</p>
          ) : members.length === 0 ? (
            <p className="text-gray-500 py-6 text-center">
              No members yet. Add them above, or run <code>npm run seed:members</code>.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${m.active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {m.display_name}
                      {!m.active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{m.email}</div>
                  </div>
                  <button
                    onClick={() => toggleActive(m)}
                    className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  >
                    {m.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => removeMember(m)}
                    className="text-gray-400 hover:text-red-600 transition"
                    aria-label={`Delete ${m.display_name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
