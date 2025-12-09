'use client';

import { useState, useEffect } from 'react';
import {
  EvaluatorFeedback,
  FunctionaryFeedback,
  GeneralEvaluatorReport as GeneralEvaluatorReportType,
  FUNCTIONARY_ROLES,
  SCORE_LABELS,
  validateEvaluatorFeedbacks,
  validateFunctionaryFeedbacks,
} from '@/lib/types';

interface GeneralEvaluatorReportProps {
  meetingId: number;
  meetingName: string;
  onClose: () => void;
}

type ReportTab = 'evaluators' | 'functionaries' | 'meeting';

export default function GeneralEvaluatorReport({
  meetingId,
  meetingName,
  onClose,
}: GeneralEvaluatorReportProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('evaluators');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Existing reports
  const [reports, setReports] = useState<GeneralEvaluatorReportType[]>([]);

  // Form state
  const [form, setForm] = useState({
    reporter_name: '',
    evaluator_feedbacks: [] as EvaluatorFeedback[],
    functionary_feedbacks: [] as FunctionaryFeedback[],
    meeting_highlights: '',
    meeting_improvements: '',
    overall_comments: '',
  });

  // Fetch existing reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`/api/reports/${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setReports(data.generalEvaluator || []);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [meetingId]);

  // Add new Evaluator Feedback
  const addEvaluatorFeedback = () => {
    setForm((prev) => ({
      ...prev,
      evaluator_feedbacks: [
        ...prev.evaluator_feedbacks,
        {
          evaluator_name: '',
          speaker_evaluated: '',
          rating: 3 as 1 | 2 | 3 | 4 | 5,
          strengths: '',
          areas_to_improve: '',
          comments: '',
        },
      ],
    }));
  };

  // Add new Functionary Feedback
  const addFunctionaryFeedback = () => {
    setForm((prev) => ({
      ...prev,
      functionary_feedbacks: [
        ...prev.functionary_feedbacks,
        {
          role: 'Timer' as const,
          person_name: '',
          rating: 3 as 1 | 2 | 3 | 4 | 5,
          feedback: '',
        },
      ],
    }));
  };

  // Remove Evaluator Feedback
  const removeEvaluatorFeedback = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      evaluator_feedbacks: prev.evaluator_feedbacks.filter((_, i) => i !== idx),
    }));
  };

  // Remove Functionary Feedback
  const removeFunctionaryFeedback = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      functionary_feedbacks: prev.functionary_feedbacks.filter((_, i) => i !== idx),
    }));
  };

  // Update Evaluator Feedback
  const updateEvaluatorFeedback = (idx: number, field: keyof EvaluatorFeedback, value: string | number) => {
    setForm((prev) => {
      const newFeedbacks = [...prev.evaluator_feedbacks];
      newFeedbacks[idx] = { ...newFeedbacks[idx], [field]: value };
      return { ...prev, evaluator_feedbacks: newFeedbacks };
    });
  };

  // Update Functionary Feedback
  const updateFunctionaryFeedback = (idx: number, field: keyof FunctionaryFeedback, value: string | number) => {
    setForm((prev) => {
      const newFeedbacks = [...prev.functionary_feedbacks];
      newFeedbacks[idx] = { ...newFeedbacks[idx], [field]: value };
      return { ...prev, functionary_feedbacks: newFeedbacks };
    });
  };

  // Save Report
  const saveReport = async () => {
    if (!form.reporter_name) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/reports/${meetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'general_evaluator', ...form }),
      });
      if (response.ok) {
        const newReport = await response.json();
        setReports((prev) => [newReport, ...prev]);
        setForm({
          reporter_name: '',
          evaluator_feedbacks: [],
          functionary_feedbacks: [],
          meeting_highlights: '',
          meeting_improvements: '',
          overall_comments: '',
        });
      }
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Report
  const deleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      const response = await fetch(`/api/reports/general-evaluator/${reportId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  // Render rating stars
  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Rating selector component
  const RatingSelector = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (rating: 1 | 2 | 3 | 4 | 5) => void;
  }) => (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5] as const).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-8 h-8 rounded-full border-2 font-medium transition ${
              value === rating
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 text-gray-600 hover:border-blue-400'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {SCORE_LABELS[value as keyof typeof SCORE_LABELS]}
      </span>
    </div>
  );

  const tabs = [
    { id: 'evaluators' as const, label: 'Speech Evaluators', icon: '🎯' },
    { id: 'functionaries' as const, label: 'Functionaries', icon: '⚙️' },
    { id: 'meeting' as const, label: 'Meeting Summary', icon: '📋' },
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="text-gray-500">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">General Evaluator Report</h2>
            <p className="text-sm text-gray-500">{meetingName}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-4">
          {/* Reporter Name (shown on all tabs) */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name (General Evaluator)
            </label>
            <input
              type="text"
              value={form.reporter_name}
              onChange={(e) => setForm((prev) => ({ ...prev, reporter_name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
              placeholder="Enter your name"
            />
          </div>

          {/* Speech Evaluators Tab */}
          {activeTab === 'evaluators' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Evaluate Speech Evaluators</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Provide feedback for each speech evaluator in this meeting.
                </p>

                {form.evaluator_feedbacks.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {form.evaluator_feedbacks.map((feedback, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Evaluator #{idx + 1}
                          </span>
                          <button
                            onClick={() => removeEvaluatorFeedback(idx)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ×
                          </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Evaluator Name
                            </label>
                            <input
                              type="text"
                              value={feedback.evaluator_name}
                              onChange={(e) =>
                                updateEvaluatorFeedback(idx, 'evaluator_name', e.target.value)
                              }
                              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                              placeholder="Name of the evaluator"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Speaker They Evaluated
                            </label>
                            <input
                              type="text"
                              value={feedback.speaker_evaluated}
                              onChange={(e) =>
                                updateEvaluatorFeedback(idx, 'speaker_evaluated', e.target.value)
                              }
                              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                              placeholder="Name of the speaker"
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Rating
                          </label>
                          <RatingSelector
                            value={feedback.rating}
                            onChange={(rating) => updateEvaluatorFeedback(idx, 'rating', rating)}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Strengths
                          </label>
                          <textarea
                            value={feedback.strengths}
                            onChange={(e) =>
                              updateEvaluatorFeedback(idx, 'strengths', e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                            rows={2}
                            placeholder="What did they do well?"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Areas to Improve
                          </label>
                          <textarea
                            value={feedback.areas_to_improve}
                            onChange={(e) =>
                              updateEvaluatorFeedback(idx, 'areas_to_improve', e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                            rows={2}
                            placeholder="What could they work on?"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Additional Comments
                          </label>
                          <textarea
                            value={feedback.comments}
                            onChange={(e) =>
                              updateEvaluatorFeedback(idx, 'comments', e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                            rows={2}
                            placeholder="Any other observations"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={addEvaluatorFeedback}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                >
                  + Add Evaluator
                </button>
              </div>
            </div>
          )}

          {/* Functionaries Tab */}
          {activeTab === 'functionaries' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Evaluate Meeting Functionaries</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Provide feedback for Timer, Grammarian, Ah-Um Counter, and other functionaries.
                </p>

                {form.functionary_feedbacks.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {form.functionary_feedbacks.map((feedback, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Functionary #{idx + 1}
                          </span>
                          <button
                            onClick={() => removeFunctionaryFeedback(idx)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ×
                          </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Role
                            </label>
                            <select
                              value={feedback.role}
                              onChange={(e) =>
                                updateFunctionaryFeedback(idx, 'role', e.target.value)
                              }
                              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                            >
                              {FUNCTIONARY_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Person Name
                            </label>
                            <input
                              type="text"
                              value={feedback.person_name}
                              onChange={(e) =>
                                updateFunctionaryFeedback(idx, 'person_name', e.target.value)
                              }
                              className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                              placeholder="Name of the functionary"
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Rating
                          </label>
                          <RatingSelector
                            value={feedback.rating}
                            onChange={(rating) =>
                              updateFunctionaryFeedback(idx, 'rating', rating)
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Feedback
                          </label>
                          <textarea
                            value={feedback.feedback}
                            onChange={(e) =>
                              updateFunctionaryFeedback(idx, 'feedback', e.target.value)
                            }
                            className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                            rows={3}
                            placeholder="How did they perform their role?"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={addFunctionaryFeedback}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                >
                  + Add Functionary
                </button>
              </div>
            </div>
          )}

          {/* Meeting Summary Tab */}
          {activeTab === 'meeting' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Meeting Summary</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Highlights
                  </label>
                  <textarea
                    value={form.meeting_highlights}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, meeting_highlights: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                    rows={3}
                    placeholder="What went well in this meeting?"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Areas for Improvement
                  </label>
                  <textarea
                    value={form.meeting_improvements}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, meeting_improvements: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                    rows={3}
                    placeholder="What could be improved in future meetings?"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Comments
                  </label>
                  <textarea
                    value={form.overall_comments}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, overall_comments: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                    rows={3}
                    placeholder="Any other observations about the meeting"
                  />
                </div>

                <button
                  onClick={saveReport}
                  disabled={isSaving || !form.reporter_name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Complete Report'}
                </button>
              </div>
            </div>
          )}

          {/* Previous Reports */}
          {reports.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Previous Reports</h3>
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-gray-500">
                      By: {report.reporter_name} •{' '}
                      {new Date(report.created_at).toLocaleString()}
                    </div>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Evaluator Feedbacks */}
                  {validateEvaluatorFeedbacks(report.evaluator_feedbacks).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Speech Evaluator Feedback
                      </h4>
                      <div className="space-y-2">
                        {validateEvaluatorFeedbacks(report.evaluator_feedbacks).map(
                          (feedback, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {feedback.evaluator_name}
                                </span>
                                <span className="text-gray-500">→</span>
                                <span className="text-gray-700">
                                  {feedback.speaker_evaluated}
                                </span>
                                <div className="ml-auto">
                                  {renderRatingStars(feedback.rating)}
                                </div>
                              </div>
                              {feedback.strengths && (
                                <div className="text-sm text-green-700">
                                  <strong>Strengths:</strong> {feedback.strengths}
                                </div>
                              )}
                              {feedback.areas_to_improve && (
                                <div className="text-sm text-orange-700">
                                  <strong>To Improve:</strong> {feedback.areas_to_improve}
                                </div>
                              )}
                              {feedback.comments && (
                                <div className="text-sm text-gray-600">
                                  {feedback.comments}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Functionary Feedbacks */}
                  {validateFunctionaryFeedbacks(report.functionary_feedbacks).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Functionary Feedback
                      </h4>
                      <div className="space-y-2">
                        {validateFunctionaryFeedbacks(report.functionary_feedbacks).map(
                          (feedback, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded text-xs font-medium">
                                  {feedback.role}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {feedback.person_name}
                                </span>
                                <div className="ml-auto">
                                  {renderRatingStars(feedback.rating)}
                                </div>
                              </div>
                              {feedback.feedback && (
                                <div className="text-sm text-gray-700">{feedback.feedback}</div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meeting Summary */}
                  {(report.meeting_highlights ||
                    report.meeting_improvements ||
                    report.overall_comments) && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {report.meeting_highlights && (
                        <div className="mb-2">
                          <strong className="text-sm text-gray-700">Highlights:</strong>
                          <p className="text-sm text-gray-800">{report.meeting_highlights}</p>
                        </div>
                      )}
                      {report.meeting_improvements && (
                        <div className="mb-2">
                          <strong className="text-sm text-gray-700">To Improve:</strong>
                          <p className="text-sm text-gray-800">{report.meeting_improvements}</p>
                        </div>
                      )}
                      {report.overall_comments && (
                        <div>
                          <strong className="text-sm text-gray-700">Overall:</strong>
                          <p className="text-sm text-gray-800">{report.overall_comments}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
