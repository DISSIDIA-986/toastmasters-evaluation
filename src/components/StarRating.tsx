'use client';

import { SCORE_LABELS } from '@/lib/types';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
}

export default function StarRating({ value, onChange, label, description }: StarRatingProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="font-medium text-gray-800">{label}</span>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        <span className="text-sm text-blue-600 font-medium">
          {value > 0 ? SCORE_LABELS[value as keyof typeof SCORE_LABELS] : 'Select'}
        </span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-12 h-12 rounded-lg text-xl transition-all ${
              star <= value
                ? 'bg-yellow-400 text-white shadow-md'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {star}
          </button>
        ))}
      </div>
    </div>
  );
}
