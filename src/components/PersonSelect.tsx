'use client';

import { useState } from 'react';

export interface PersonOption {
  id: number;
  display_name: string;
}

interface PersonSelectProps {
  /** Active roster (names only). Empty → component degrades to a plain text input. */
  members: PersonOption[];
  /** Current value (a display name, or a typed guest name). */
  value: string;
  onChange: (name: string) => void;
  id?: string;
  ariaLabel?: string;
  /** Placeholder for the guest/manual text input and the empty select option. */
  placeholder?: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

const GUEST = '__guest__';

/**
 * Pick a person from the club roster, with a "Guest / other" escape that reveals
 * a free-text input. Roster speakers/evaluators are the common case; guests (esp.
 * Table Topics) still need to be enterable, so the manual fallback is mandatory.
 *
 * Native <select> on purpose: built-in keyboard + screen-reader support, and the
 * native mobile picker (this is used on the phone-first public evaluate form).
 *
 * Resilience: if `members` is empty (roster failed to load, or none seeded), it
 * renders a plain text input so the form never becomes unusable.
 *
 * Always reports a display-name STRING via onChange — the data shape is unchanged
 * (evaluations still store name strings), no schema migration needed.
 */
export default function PersonSelect({
  members,
  value,
  onChange,
  id,
  ariaLabel,
  placeholder = 'Type a name',
  className = '',
  inputRef,
}: PersonSelectProps) {
  const isMember = (v: string) => members.some((m) => m.display_name === v);

  // Guest mode is true when the user explicitly picked "Guest / other", OR the
  // current value is a non-empty name that isn't in the roster (e.g. a remembered
  // name of someone who left, or a pre-filled guest).
  const [guestPicked, setGuestPicked] = useState(false);
  const looksLikeGuest = value !== '' && members.length > 0 && !isMember(value);
  const guest = guestPicked || looksLikeGuest;

  const baseInput =
    'w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors';

  // No roster available → plain text input fallback (form still works).
  if (members.length === 0) {
    return (
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`${baseInput} ${className}`}
      />
    );
  }

  const selectValue = guest ? GUEST : isMember(value) ? value : '';

  const handleSelect = (v: string) => {
    if (v === GUEST) {
      setGuestPicked(true);
      onChange('');
    } else {
      setGuestPicked(false);
      onChange(v); // '' for the placeholder option, or the chosen display name
    }
  };

  return (
    <div className="space-y-2">
      <select
        id={id}
        value={selectValue}
        onChange={(e) => handleSelect(e.target.value)}
        aria-label={ariaLabel}
        className={`${baseInput} ${className}`}
      >
        <option value="">Select a name…</option>
        {members.map((m) => (
          <option key={m.id} value={m.display_name}>
            {m.display_name}
          </option>
        ))}
        <option value={GUEST}>Guest / other (type a name)…</option>
      </select>
      {guest && (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel ? `${ariaLabel} (guest name)` : 'Guest name'}
          autoFocus
          className={baseInput}
        />
      )}
    </div>
  );
}
