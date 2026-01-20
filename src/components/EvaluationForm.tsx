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
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center my-8">
        <div className="text-6xl mb-6">✅</div>
        <h3 className="text-3xl font-bold text-green-800 mb-4">Thank You!</h3>
        <p className="text-green-700 text-lg mb-8">Your evaluation has been submitted successfully.</p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="w-full bg-green-600 text-white text-xl font-semibold px-8 py-4 rounded-xl hover:bg-green-700 transition shadow-lg"
        >
          Submit Another Evaluation
        </button>
      </div>
    );
  }

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
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Your Name (Evaluator)
            </label>
            <input
              type="text"
              value={formData.evaluator_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, evaluator_name: e.target.value }))}
              placeholder="Enter your name"
              className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Speaker Name
            </label>
            <input
              type="text"
              value={formData.speaker_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, speaker_name: e.target.value }))}
              placeholder="Enter speaker's name"
              className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors"
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
          <span className="text-xl">Additional Comments</span>
        </h3>
        <textarea
          value={formData.comments}
          onChange={(e) => setFormData((prev) => ({ ...prev, comments: e.target.value }))}
          placeholder="Any additional feedback for the speaker..."
          rows={5}
          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-colors resize-y"
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-100 text-red-700 px-6 py-4 rounded-xl text-lg font-medium animate-pulse">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <div className="sticky bottom-4 z-10 pt-4 pb-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-xl ${
            isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-blue-200'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
        </button>
      </div>
    </form>
  );
}
