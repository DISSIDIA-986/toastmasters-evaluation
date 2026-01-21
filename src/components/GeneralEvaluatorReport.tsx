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
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
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
    <div className="space-y-2">
      <div className="flex gap-2 justify-between max-w-sm">
        {([1, 2, 3, 4, 5] as const).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-12 h-12 rounded-xl border-2 text-lg font-bold transition-all ${
              value === rating
                ? 'border-blue-600 bg-blue-600 text-white shadow-md transform scale-110'
                : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      <p className="text-sm font-medium text-blue-600">
        {SCORE_LABELS[value as keyof typeof SCORE_LABELS]}
      </p>
    </div>
  );

  const tabs = [
    { id: 'evaluators' as const, label: 'Speech Evaluators', icon: '🎯' },
    { id: 'functionaries' as const, label: 'Functionaries', icon: '⚙️' },
    { id: 'meeting' as const, label: 'Summary', icon: '📋' },
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl animate-pulse">
          <div className="text-gray-500 text-lg font-medium">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white sm:bg-black/50 sm:flex sm:flex-col sm:items-center sm:justify-center z-50">
      <div className="bg-white w-full h-full sm:h-[90vh] sm:max-w-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b px-4 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">GE Report</h2>
            <p className="text-sm text-gray-500 truncate max-w-[200px]">{meetingName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-50 border-b overflow-x-auto flex-shrink-0">
          <div className="flex px-4 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium text-sm transition border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Reporter Name (Always visible on top if empty, or just in first tab? Let's put it in Meeting Summary or keep global?) 
                Let's keep it global but card based. */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <label className="block text-lg font-bold text-gray-800 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={form.reporter_name}
                onChange={(e) => setForm((prev) => ({ ...prev, reporter_name: e.target.value }))}
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-colors"
                placeholder="Enter General Evaluator's name"
              />
            </div>

            {/* Speech Evaluators Tab */}
            {activeTab === 'evaluators' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-lg">Evaluators</h3>
                  <button
                    onClick={addEvaluatorFeedback}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center gap-2"
                  >
                    <span>+</span> Add Evaluator
                  </button>
                </div>

                {form.evaluator_feedbacks.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                    No evaluators added yet. Tap the button above.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {form.evaluator_feedbacks.map((feedback, idx) => (
                      <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b flex justify-between items-center">
                          <span className="font-bold text-gray-700">Evaluator #{idx + 1}</span>
                          <button
                            onClick={() => removeEvaluatorFeedback(idx)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="p-5 space-y-5">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">
                                Evaluator Name
                              </label>
                              <input
                                type="text"
                                value={feedback.evaluator_name}
                                onChange={(e) =>
                                  updateEvaluatorFeedback(idx, 'evaluator_name', e.target.value)
                                }
                                className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100"
                                placeholder="Name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">
                                Speaker Evaluated
                              </label>
                              <input
                                type="text"
                                value={feedback.speaker_evaluated}
                                onChange={(e) =>
                                  updateEvaluatorFeedback(idx, 'speaker_evaluated', e.target.value)
                                }
                                className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100"
                                placeholder="Speaker"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Rating
                            </label>
                            <RatingSelector
                              value={feedback.rating}
                              onChange={(rating) => updateEvaluatorFeedback(idx, 'rating', rating)}
                            />
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Strengths</label>
                              <textarea
                                value={feedback.strengths}
                                onChange={(e) => updateEvaluatorFeedback(idx, 'strengths', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100"
                                rows={2}
                                placeholder="What went well?"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Areas to Improve</label>
                              <textarea
                                value={feedback.areas_to_improve}
                                onChange={(e) => updateEvaluatorFeedback(idx, 'areas_to_improve', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100"
                                rows={2}
                                placeholder="Suggestions?"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Functionaries Tab */}
            {activeTab === 'functionaries' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-lg">Functionaries</h3>
                  <button
                    onClick={addFunctionaryFeedback}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center gap-2"
                  >
                    <span>+</span> Add Role
                  </button>
                </div>

                {form.functionary_feedbacks.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                    No functionaries added yet.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {form.functionary_feedbacks.map((feedback, idx) => (
                      <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b flex justify-between items-center">
                          <span className="font-bold text-gray-700">Role #{idx + 1}</span>
                          <button
                            onClick={() => removeFunctionaryFeedback(idx)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="p-5 space-y-5">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">
                                Role
                              </label>
                              <select
                                value={feedback.role}
                                onChange={(e) =>
                                  updateFunctionaryFeedback(idx, 'role', e.target.value)
                                }
                                className="w-full px-3 py-3 border border-gray-200 rounded-lg bg-white"
                              >
                                {FUNCTIONARY_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">
                                Person Name
                              </label>
                              <input
                                type="text"
                                value={feedback.person_name}
                                onChange={(e) =>
                                  updateFunctionaryFeedback(idx, 'person_name', e.target.value)
                                }
                                className="w-full px-3 py-3 border border-gray-200 rounded-lg"
                                placeholder="Name"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
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
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                              Feedback
                            </label>
                            <textarea
                              value={feedback.feedback}
                              onChange={(e) =>
                                updateFunctionaryFeedback(idx, 'feedback', e.target.value)
                              }
                              className="w-full px-3 py-3 border border-gray-200 rounded-lg"
                              rows={3}
                              placeholder="How did they perform?"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meeting Summary Tab */}
            {activeTab === 'meeting' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                  <h3 className="font-bold text-gray-800 text-xl mb-2">Meeting Overview</h3>
                  
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Highlights
                    </label>
                    <textarea
                      value={form.meeting_highlights}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, meeting_highlights: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-lg"
                      rows={3}
                      placeholder="Best moments..."
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Improvements
                    </label>
                    <textarea
                      value={form.meeting_improvements}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, meeting_improvements: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-lg"
                      rows={3}
                      placeholder="What to change?"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Overall Comments
                    </label>
                    <textarea
                      value={form.overall_comments}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, overall_comments: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-lg"
                      rows={3}
                      placeholder="Final thoughts..."
                    />
                  </div>

                  <button
                    onClick={saveReport}
                    disabled={isSaving || !form.reporter_name}
                    className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Submit GE Report'}
                  </button>
                </div>
              </div>
            )}

            {/* Previous Reports List (visible at bottom of 'Summary' or distinct section?)
                Let's move it to a distinct section below the tabs content area so it doesn't clutter the tabs. 
                Actually, putting it in 'meeting' tab or a separate toggle is better for mobile.
                For now, I'll append it at the bottom if any exist.
             */}
            {reports.length > 0 && (
              <div className="pt-8 border-t">
                <h3 className="font-bold text-gray-500 mb-4 uppercase tracking-wide text-sm">Previous Reports</h3>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white border rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{report.reporter_name}</p>
                          <p className="text-sm text-gray-500">{new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="text-red-500 p-2 hover:bg-red-50 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        {validateEvaluatorFeedbacks(report.evaluator_feedbacks).length} evaluators evaluated
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
