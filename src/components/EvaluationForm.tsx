'use client';

import { useState, useEffect, useRef } from 'react';
import QuickCriteria from './QuickCriteria';
import PersonSelect, { PersonOption } from './PersonSelect';
import { SPEECH_TYPES, EvaluationFormData } from '@/lib/types';

interface EvaluationFormProps {
  meetingId: number;
  /** Signed per-meeting token from the server page; sent back on submit. */
  submitToken?: string;
  /** Active roster (names only) from the server page. Empty → name fields fall back to text input. */
  members?: PersonOption[];
  onSuccess?: () => void;
}

const EVALUATOR_NAME_KEY = 'tm-evaluator-name';

const initialFormData: EvaluationFormData = {
  evaluator_name: '',
  speaker_name: '',
  speech_type: 'prepared',
  commend_tags: [],
  recommend_tags: [],
  challenge_tags: [],
  comments: '',
};

export default function EvaluationForm({ meetingId, submitToken, members = [], onSuccess }: EvaluationFormProps) {
  const [formData, setFormData] = useState<EvaluationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'submitted'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const speakerInputRef = useRef<HTMLInputElement>(null);

  // Hydrate evaluator name from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EVALUATOR_NAME_KEY);
      if (saved) {
        setFormData((prev) => ({ ...prev, evaluator_name: saved }));
      }
    } catch {
      // localStorage unavailable (private mode, etc) — silently ignore.
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    // Validate names.
    if (!formData.evaluator_name.trim()) {
      setErrorMessage('Please enter your name');
      setIsSubmitting(false);
      return;
    }
    if (!formData.speaker_name.trim()) {
      setErrorMessage('Please enter the speaker name');
      setIsSubmitting(false);
      return;
    }

    // Require at least one tag OR a non-empty comment.
    const totalTags =
      formData.commend_tags.length + formData.recommend_tags.length + formData.challenge_tags.length;
    const hasComment = formData.comments.trim().length > 0;
    if (totalTags === 0 && !hasComment) {
      setErrorMessage('Please select at least one feedback item or write a comment');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          meeting_id: meetingId,
          submit_token: submitToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit');
      }

      // Persist evaluator name for next submission.
      try {
        localStorage.setItem(EVALUATOR_NAME_KEY, formData.evaluator_name.trim());
      } catch {
        // localStorage unavailable — proceed without persisting.
      }

      // Soft reset: clear per-speaker fields, keep evaluator name.
      // Show "Submitted ✓" on the submit button for 1.2s, then return to idle
      // so the same evaluator can immediately submit for the next speaker.
      const keepEvaluator = formData.evaluator_name.trim();
      setFormData({ ...initialFormData, evaluator_name: keepEvaluator });
      setSubmitState('submitted');
      onSuccess?.();

      window.setTimeout(() => {
        setSubmitState('idle');
        // Auto-focus speaker input for the next entry on touch devices
        // where users may want to dictate the next name immediately.
        speakerInputRef.current?.focus({ preventScroll: true });
      }, 1200);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = (() => {
    if (isSubmitting) return 'Submitting…';
    if (submitState === 'submitted') return 'Submitted ✓';
    return 'Submit Evaluation';
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      {/* Names Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span className="text-2xl">👤</span>
          <span className="text-xl">Basic Info</span>
        </h3>

        <div className="space-y-6">
          <div>
            <label htmlFor="evaluator-name" className="block text-lg font-medium text-gray-700 mb-2">
              Your Name (Evaluator)
            </label>
            <PersonSelect
              id="evaluator-name"
              ariaLabel="Your name (evaluator)"
              members={members}
              value={formData.evaluator_name}
              onChange={(name) => setFormData((prev) => ({ ...prev, evaluator_name: name }))}
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label htmlFor="speaker-name" className="block text-lg font-medium text-gray-700 mb-2">
              Speaker Name
            </label>
            <PersonSelect
              id="speaker-name"
              ariaLabel="Speaker name"
              members={members}
              value={formData.speaker_name}
              onChange={(name) => setFormData((prev) => ({ ...prev, speaker_name: name }))}
              placeholder="Enter speaker's name"
              inputRef={speakerInputRef}
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Speech Type
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              {(Object.entries(SPEECH_TYPES) as [keyof typeof SPEECH_TYPES, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, speech_type: key }))}
                  className={`flex-1 py-4 px-6 rounded-xl border-2 text-lg font-medium transition-all ${
                    formData.speech_type === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-[1.02]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Criteria Selection - Commend/Recommend/Challenge */}
      <QuickCriteria
        commend={formData.commend_tags}
        recommend={formData.recommend_tags}
        challenge={formData.challenge_tags}
        onCommendChange={(items) => setFormData((prev) => ({ ...prev, commend_tags: items }))}
        onRecommendChange={(items) => setFormData((prev) => ({ ...prev, recommend_tags: items }))}
        onChallengeChange={(items) => setFormData((prev) => ({ ...prev, challenge_tags: items }))}
      />

      {/* Comments Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <span className="text-xl">Comments</span>
        </h3>
        <textarea
          value={formData.comments}
          onChange={(e) => setFormData((prev) => ({ ...prev, comments: e.target.value }))}
          placeholder="One sentence is plenty. Tap the 🎙 on your keyboard to dictate."
          rows={6}
          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors resize-y"
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-100 text-red-700 px-6 py-4 rounded-xl text-lg font-medium animate-pulse">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Submit Button — natural flow at end of form; doubles as success indicator.
          Sticky/fixed positioning is intentionally avoided: on iOS Safari the
          virtual keyboard does not consistently push fixed elements above it,
          and on long forms the sticky bar overlaps the criteria cards. */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || submitState === 'submitted'}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl ${
            submitState === 'submitted'
              ? 'bg-green-600 text-white shadow-green-200'
              : isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-blue-200'
          }`}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
