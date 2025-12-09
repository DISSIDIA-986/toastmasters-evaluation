'use client';

import { useState, useEffect } from 'react';
import {
  AhUmEntry,
  AhUmReport,
  GrammarEntry,
  GrammarianReport,
  TimerEntry,
  TimerReport,
  MEETING_ROLES,
} from '@/lib/types';

interface StatisticianReportProps {
  meetingId: number;
  meetingName: string;
  onClose: () => void;
}

type ReportTab = 'ah_um' | 'grammarian' | 'timer';

export default function StatisticianReport({
  meetingId,
  meetingName,
  onClose,
}: StatisticianReportProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('ah_um');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Report data
  const [ahUmReports, setAhUmReports] = useState<AhUmReport[]>([]);
  const [grammarianReports, setGrammarianReports] = useState<GrammarianReport[]>([]);
  const [timerReports, setTimerReports] = useState<TimerReport[]>([]);

  // Form states
  const [ahUmForm, setAhUmForm] = useState({
    reporter_name: '',
    entries: [] as AhUmEntry[],
  });

  const [grammarianForm, setGrammarianForm] = useState({
    reporter_name: '',
    word_of_day: '',
    word_of_day_definition: '',
    entries: [] as GrammarEntry[],
  });

  const [timerForm, setTimerForm] = useState({
    reporter_name: '',
    meeting_start: '',
    meeting_end: '',
    entries: [] as TimerEntry[],
  });

  // Fetch existing reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`/api/reports/${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setAhUmReports(data.ahUm || []);
          setGrammarianReports(data.grammarian || []);
          setTimerReports(data.timer || []);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [meetingId]);

  // Add new Ah-Um entry
  const addAhUmEntry = () => {
    setAhUmForm((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        { speaker_name: '', ah_um: 0, like: 0, so: 0, but: 0, other: 0 },
      ],
    }));
  };

  // Add new Grammar entry
  const addGrammarEntry = () => {
    setGrammarianForm((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        { speaker_name: '', phrase: '', is_positive: true, comment: '' },
      ],
    }));
  };

  // Add new Timer entry
  const addTimerEntry = () => {
    setTimerForm((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        { role: '', speaker_name: '', title_topic: '', duration_seconds: 0, status: 'green' as const },
      ],
    }));
  };

  // Save Ah-Um report
  const saveAhUmReport = async () => {
    if (!ahUmForm.reporter_name || ahUmForm.entries.length === 0) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/reports/${meetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ah_um', ...ahUmForm }),
      });
      if (response.ok) {
        const newReport = await response.json();
        setAhUmReports((prev) => [newReport, ...prev]);
        setAhUmForm({ reporter_name: '', entries: [] });
      }
    } catch (error) {
      console.error('Failed to save Ah-Um report:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Grammarian report
  const saveGrammarianReport = async () => {
    if (!grammarianForm.reporter_name) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/reports/${meetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'grammarian', ...grammarianForm }),
      });
      if (response.ok) {
        const newReport = await response.json();
        setGrammarianReports((prev) => [newReport, ...prev]);
        setGrammarianForm({
          reporter_name: '',
          word_of_day: '',
          word_of_day_definition: '',
          entries: [],
        });
      }
    } catch (error) {
      console.error('Failed to save Grammarian report:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Timer report
  const saveTimerReport = async () => {
    if (!timerForm.reporter_name) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/reports/${meetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'timer', ...timerForm }),
      });
      if (response.ok) {
        const newReport = await response.json();
        setTimerReports((prev) => [newReport, ...prev]);
        setTimerForm({
          reporter_name: '',
          meeting_start: '',
          meeting_end: '',
          entries: [],
        });
      }
    } catch (error) {
      console.error('Failed to save Timer report:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse mm:ss to seconds
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timeStr) || 0;
  };

  const tabs = [
    { id: 'ah_um' as const, label: 'Ah-Um Counter', icon: '🎤' },
    { id: 'grammarian' as const, label: 'Grammarian', icon: '📝' },
    { id: 'timer' as const, label: 'Timer', icon: '⏱️' },
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
            <h2 className="text-xl font-bold text-gray-800">Statistician Reports</h2>
            <p className="text-sm text-gray-500">{meetingName}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
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
          {/* Ah-Um Counter Tab */}
          {activeTab === 'ah_um' && (
            <div className="space-y-4">
              {/* Form */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-800 mb-4">New Ah-Um Counter Report</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name (Counter)
                  </label>
                  <input
                    type="text"
                    value={ahUmForm.reporter_name}
                    onChange={(e) =>
                      setAhUmForm((prev) => ({ ...prev, reporter_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Entries */}
                {ahUmForm.entries.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-2 text-left">Speaker</th>
                          <th className="px-2 py-2 text-center w-16">Ah/Um</th>
                          <th className="px-2 py-2 text-center w-16">Like</th>
                          <th className="px-2 py-2 text-center w-16">So</th>
                          <th className="px-2 py-2 text-center w-16">But</th>
                          <th className="px-2 py-2 text-center w-16">Other</th>
                          <th className="px-2 py-2 text-center w-16">Total</th>
                          <th className="px-2 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ahUmForm.entries.map((entry, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={entry.speaker_name}
                                onChange={(e) => {
                                  const newEntries = [...ahUmForm.entries];
                                  newEntries[idx].speaker_name = e.target.value;
                                  setAhUmForm((prev) => ({ ...prev, entries: newEntries }));
                                }}
                                className="w-full px-2 py-1 border rounded"
                                placeholder="Name"
                              />
                            </td>
                            {(['ah_um', 'like', 'so', 'but', 'other'] as const).map((field) => (
                              <td key={field} className="px-2 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={entry[field]}
                                  onChange={(e) => {
                                    const newEntries = [...ahUmForm.entries];
                                    newEntries[idx][field] = parseInt(e.target.value) || 0;
                                    setAhUmForm((prev) => ({ ...prev, entries: newEntries }));
                                  }}
                                  className="w-full px-2 py-1 border rounded text-center"
                                />
                              </td>
                            ))}
                            <td className="px-2 py-2 text-center font-medium">
                              {entry.ah_um + entry.like + entry.so + entry.but + entry.other}
                            </td>
                            <td className="px-2 py-2">
                              <button
                                onClick={() => {
                                  const newEntries = ahUmForm.entries.filter((_, i) => i !== idx);
                                  setAhUmForm((prev) => ({ ...prev, entries: newEntries }));
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={addAhUmEntry}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    + Add Speaker
                  </button>
                  <button
                    onClick={saveAhUmReport}
                    disabled={isSaving || !ahUmForm.reporter_name || ahUmForm.entries.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Report'}
                  </button>
                </div>
              </div>

              {/* Existing Reports */}
              {ahUmReports.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Previous Reports</h3>
                  {ahUmReports.map((report) => (
                    <div key={report.id} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
                      <div className="text-sm text-gray-500 mb-2">
                        By: {report.reporter_name} •{' '}
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-1 text-left">Speaker</th>
                            <th className="px-2 py-1 text-center">Ah/Um</th>
                            <th className="px-2 py-1 text-center">Like</th>
                            <th className="px-2 py-1 text-center">So</th>
                            <th className="px-2 py-1 text-center">But</th>
                            <th className="px-2 py-1 text-center">Other</th>
                            <th className="px-2 py-1 text-center">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(report.entries as AhUmEntry[]).map((entry, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-2 py-1">{entry.speaker_name}</td>
                              <td className="px-2 py-1 text-center">{entry.ah_um}</td>
                              <td className="px-2 py-1 text-center">{entry.like}</td>
                              <td className="px-2 py-1 text-center">{entry.so}</td>
                              <td className="px-2 py-1 text-center">{entry.but}</td>
                              <td className="px-2 py-1 text-center">{entry.other}</td>
                              <td className="px-2 py-1 text-center font-medium">
                                {entry.ah_um + entry.like + entry.so + entry.but + entry.other}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grammarian Tab */}
          {activeTab === 'grammarian' && (
            <div className="space-y-4">
              {/* Form */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-800 mb-4">New Grammarian Report</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name (Grammarian)
                    </label>
                    <input
                      type="text"
                      value={grammarianForm.reporter_name}
                      onChange={(e) =>
                        setGrammarianForm((prev) => ({ ...prev, reporter_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Word of the Day
                    </label>
                    <input
                      type="text"
                      value={grammarianForm.word_of_day}
                      onChange={(e) =>
                        setGrammarianForm((prev) => ({ ...prev, word_of_day: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Serendipity"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Word Definition
                  </label>
                  <input
                    type="text"
                    value={grammarianForm.word_of_day_definition}
                    onChange={(e) =>
                      setGrammarianForm((prev) => ({
                        ...prev,
                        word_of_day_definition: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Definition of the word"
                  />
                </div>

                {/* Entries */}
                {grammarianForm.entries.length > 0 && (
                  <div className="mb-4 space-y-3">
                    {grammarianForm.entries.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={entry.speaker_name}
                            onChange={(e) => {
                              const newEntries = [...grammarianForm.entries];
                              newEntries[idx].speaker_name = e.target.value;
                              setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                            }}
                            className="flex-1 px-3 py-2 border rounded-lg"
                            placeholder="Speaker name"
                          />
                          <select
                            value={entry.is_positive ? 'positive' : 'negative'}
                            onChange={(e) => {
                              const newEntries = [...grammarianForm.entries];
                              newEntries[idx].is_positive = e.target.value === 'positive';
                              setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                            }}
                            className="px-3 py-2 border rounded-lg"
                          >
                            <option value="positive">✓ Good</option>
                            <option value="negative">✗ Needs Work</option>
                          </select>
                          <button
                            onClick={() => {
                              const newEntries = grammarianForm.entries.filter((_, i) => i !== idx);
                              setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                            }}
                            className="px-3 py-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          value={entry.phrase}
                          onChange={(e) => {
                            const newEntries = [...grammarianForm.entries];
                            newEntries[idx].phrase = e.target.value;
                            setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                          }}
                          className="w-full px-3 py-2 border rounded-lg mb-2"
                          placeholder="Phrase or word used"
                        />
                        <input
                          type="text"
                          value={entry.comment}
                          onChange={(e) => {
                            const newEntries = [...grammarianForm.entries];
                            newEntries[idx].comment = e.target.value;
                            setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                          }}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Comment or correction"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={addGrammarEntry}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    + Add Entry
                  </button>
                  <button
                    onClick={saveGrammarianReport}
                    disabled={isSaving || !grammarianForm.reporter_name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Report'}
                  </button>
                </div>
              </div>

              {/* Existing Reports */}
              {grammarianReports.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Previous Reports</h3>
                  {grammarianReports.map((report) => (
                    <div key={report.id} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
                      <div className="text-sm text-gray-500 mb-2">
                        By: {report.reporter_name} •{' '}
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                      {report.word_of_day && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-800">
                            Word of the Day: {report.word_of_day}
                          </span>
                          {report.word_of_day_definition && (
                            <span className="text-blue-600 ml-2">
                              - {report.word_of_day_definition}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="space-y-2">
                        {(report.entries as GrammarEntry[]).map((entry, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded ${
                              entry.is_positive ? 'bg-green-50' : 'bg-yellow-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={entry.is_positive ? 'text-green-600' : 'text-yellow-600'}>
                                {entry.is_positive ? '✓' : '✗'}
                              </span>
                              <span className="font-medium">{entry.speaker_name}</span>
                              <span className="text-gray-600">- &quot;{entry.phrase}&quot;</span>
                            </div>
                            {entry.comment && (
                              <div className="text-sm text-gray-500 ml-6">{entry.comment}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timer Tab */}
          {activeTab === 'timer' && (
            <div className="space-y-4">
              {/* Form */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-semibold text-gray-800 mb-4">New Timer Report</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name (Timer)
                    </label>
                    <input
                      type="text"
                      value={timerForm.reporter_name}
                      onChange={(e) =>
                        setTimerForm((prev) => ({ ...prev, reporter_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Start
                    </label>
                    <input
                      type="time"
                      value={timerForm.meeting_start}
                      onChange={(e) =>
                        setTimerForm((prev) => ({ ...prev, meeting_start: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting End
                    </label>
                    <input
                      type="time"
                      value={timerForm.meeting_end}
                      onChange={(e) =>
                        setTimerForm((prev) => ({ ...prev, meeting_end: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* Entries */}
                {timerForm.entries.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-2 text-left">Role</th>
                          <th className="px-2 py-2 text-left">Speaker</th>
                          <th className="px-2 py-2 text-left">Title/Topic</th>
                          <th className="px-2 py-2 text-center w-24">Time (m:ss)</th>
                          <th className="px-2 py-2 text-center w-24">Status</th>
                          <th className="px-2 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {timerForm.entries.map((entry, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-2">
                              <select
                                value={entry.role}
                                onChange={(e) => {
                                  const newEntries = [...timerForm.entries];
                                  newEntries[idx].role = e.target.value;
                                  setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                }}
                                className="w-full px-2 py-1 border rounded"
                              >
                                <option value="">Select role</option>
                                {MEETING_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={entry.speaker_name}
                                onChange={(e) => {
                                  const newEntries = [...timerForm.entries];
                                  newEntries[idx].speaker_name = e.target.value;
                                  setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                }}
                                className="w-full px-2 py-1 border rounded"
                                placeholder="Name"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={entry.title_topic}
                                onChange={(e) => {
                                  const newEntries = [...timerForm.entries];
                                  newEntries[idx].title_topic = e.target.value;
                                  setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                }}
                                className="w-full px-2 py-1 border rounded"
                                placeholder="Title"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                value={formatTime(entry.duration_seconds)}
                                onChange={(e) => {
                                  const newEntries = [...timerForm.entries];
                                  newEntries[idx].duration_seconds = parseTime(e.target.value);
                                  setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                }}
                                className="w-full px-2 py-1 border rounded text-center"
                                placeholder="0:00"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                value={entry.status}
                                onChange={(e) => {
                                  const newEntries = [...timerForm.entries];
                                  newEntries[idx].status = e.target.value as TimerEntry['status'];
                                  setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                }}
                                className="w-full px-2 py-1 border rounded"
                              >
                                <option value="green">🟢 Green</option>
                                <option value="yellow">🟡 Yellow</option>
                                <option value="red">🔴 Red</option>
                                <option value="over">⚫ Over</option>
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <button
                                onClick={() => {
                                  const newEntries = timerForm.entries.filter((_, i) => i !== idx);
                                  setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={addTimerEntry}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    + Add Entry
                  </button>
                  <button
                    onClick={saveTimerReport}
                    disabled={isSaving || !timerForm.reporter_name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Report'}
                  </button>
                </div>
              </div>

              {/* Existing Reports */}
              {timerReports.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Previous Reports</h3>
                  {timerReports.map((report) => (
                    <div key={report.id} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
                      <div className="text-sm text-gray-500 mb-2">
                        By: {report.reporter_name} •{' '}
                        {new Date(report.created_at).toLocaleString()}
                        {report.meeting_start && report.meeting_end && (
                          <span className="ml-2">
                            ({report.meeting_start} - {report.meeting_end})
                          </span>
                        )}
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-1 text-left">Role</th>
                            <th className="px-2 py-1 text-left">Speaker</th>
                            <th className="px-2 py-1 text-left">Title/Topic</th>
                            <th className="px-2 py-1 text-center">Time</th>
                            <th className="px-2 py-1 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(report.entries as TimerEntry[]).map((entry, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-2 py-1">{entry.role}</td>
                              <td className="px-2 py-1">{entry.speaker_name}</td>
                              <td className="px-2 py-1">{entry.title_topic}</td>
                              <td className="px-2 py-1 text-center">
                                {formatTime(entry.duration_seconds)}
                              </td>
                              <td className="px-2 py-1 text-center">
                                {entry.status === 'green' && '🟢'}
                                {entry.status === 'yellow' && '🟡'}
                                {entry.status === 'red' && '🔴'}
                                {entry.status === 'over' && '⚫'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
