'use client';

import { useState } from 'react';
import QuickCriteria from './QuickCriteria';
import { SPEECH_TYPES, EvaluationFormData } from '@/lib/types';

interface EvaluationFormProps {
  meetingId: number;
  onSuccess?: () => void;
}

const initialFormData: EvaluationFormData = {
  evaluator_name: '',
  speaker_name: '',
  speech_type: 'prepared',
  commend_tags: [],
  recommend_tags: [],
  challenge_tags: [],
  comments: '',
};

export default function EvaluationForm({ meetingId, onSuccess }: EvaluationFormProps) {
  const [formData, setFormData] = useState<EvaluationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    // Validate
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

    // Check at least one feedback item selected
    const totalTags = formData.commend_tags.length + formData.recommend_tags.length + formData.challenge_tags.length;
    if (totalTags === 0) {
      setErrorMessage('Please select at least one feedback item');
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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitStatus('success');
      setFormData(initialFormData);
      onSuccess?.();
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Thank You!</h3>
        <p className="text-green-600 mb-4">Your evaluation has been submitted successfully.</p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Submit Another Evaluation
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Names Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-xl">👤</span> Basic Info
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name (Evaluator)
            </label>
            <input
              type="text"
              value={formData.evaluator_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, evaluator_name: e.target.value }))}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speaker Name
            </label>
            <input
              type="text"
              value={formData.speaker_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, speaker_name: e.target.value }))}
              placeholder="Enter speaker's name"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speech Type
            </label>
            <div className="flex gap-3">
              {(Object.entries(SPEECH_TYPES) as [keyof typeof SPEECH_TYPES, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, speech_type: key }))}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                    formData.speech_type === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
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
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-xl">💬</span> Additional Comments (Optional)
        </h3>
        <textarea
          value={formData.comments}
          onChange={(e) => setFormData((prev) => ({ ...prev, comments: e.target.value }))}
          placeholder="Any additional feedback for the speaker..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition ${
          isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
      </button>
    </form>
  );
}
