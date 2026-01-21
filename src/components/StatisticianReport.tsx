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
  validateAhUmEntries,
  validateGrammarEntries,
  validateTimerEntries,
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

  // Stepper Component for Ah-Um
  const CounterStepper = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void; 
  }) => (
    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 font-bold hover:bg-gray-100 active:scale-95 transition shadow-sm"
        >
          -
        </button>
        <span className="text-xl font-bold text-gray-900 w-8 text-center">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 flex items-center justify-center bg-blue-100 border border-blue-200 rounded-full text-blue-700 font-bold hover:bg-blue-200 active:scale-95 transition shadow-sm"
        >
          +
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'ah_um' as const, label: 'Ah-Um Counter', icon: '🎤' },
    { id: 'grammarian' as const, label: 'Grammarian', icon: '📝' },
    { id: 'timer' as const, label: 'Timer', icon: '⏱️' },
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
            <h2 className="text-xl font-bold text-gray-900">Statistician Reports</h2>
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
            
            {/* Ah-Um Counter Tab */}
            {activeTab === 'ah_um' && (
              <div className="space-y-6">
                 {/* Reporter Name Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-800 text-lg mb-4">Ah-Um Counter</h3>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={ahUmForm.reporter_name}
                    onChange={(e) =>
                      setAhUmForm((prev) => ({ ...prev, reporter_name: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Speakers List */}
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Speakers</h3>
                  <button
                    onClick={addAhUmEntry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center gap-2"
                  >
                    <span>+</span> Add Speaker
                  </button>
                </div>

                {ahUmForm.entries.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                    No speakers added.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ahUmForm.entries.map((entry, idx) => (
                      <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-5 py-3 border-b flex justify-between items-center">
                          <input
                            type="text"
                            value={entry.speaker_name}
                            onChange={(e) => {
                              const newEntries = [...ahUmForm.entries];
                              newEntries[idx].speaker_name = e.target.value;
                              setAhUmForm((prev) => ({ ...prev, entries: newEntries }));
                            }}
                            className="bg-transparent font-bold text-gray-800 placeholder-gray-400 focus:outline-none w-full"
                            placeholder="Enter Speaker Name..."
                          />
                          <button
                            onClick={() => {
                              const newEntries = ahUmForm.entries.filter((_, i) => i !== idx);
                              setAhUmForm((prev) => ({ ...prev, entries: newEntries }));
                            }}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            🗑️
                          </button>
                        </div>
                        
                        <div className="p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <CounterStepper 
                              label="Ah/Um" 
                              value={entry.ah_um} 
                              onChange={(val) => {
                                const newEntries = [...ahUmForm.entries];
                                newEntries[idx].ah_um = val;
                                setAhUmForm({ ...ahUmForm, entries: newEntries });
                              }}
                            />
                            <CounterStepper 
                              label="Like" 
                              value={entry.like} 
                              onChange={(val) => {
                                const newEntries = [...ahUmForm.entries];
                                newEntries[idx].like = val;
                                setAhUmForm({ ...ahUmForm, entries: newEntries });
                              }}
                            />
                            <CounterStepper 
                              label="So" 
                              value={entry.so} 
                              onChange={(val) => {
                                const newEntries = [...ahUmForm.entries];
                                newEntries[idx].so = val;
                                setAhUmForm({ ...ahUmForm, entries: newEntries });
                              }}
                            />
                            <CounterStepper 
                              label="But" 
                              value={entry.but} 
                              onChange={(val) => {
                                const newEntries = [...ahUmForm.entries];
                                newEntries[idx].but = val;
                                setAhUmForm({ ...ahUmForm, entries: newEntries });
                              }}
                            />
                            <CounterStepper 
                              label="Other" 
                              value={entry.other} 
                              onChange={(val) => {
                                const newEntries = [...ahUmForm.entries];
                                newEntries[idx].other = val;
                                setAhUmForm({ ...ahUmForm, entries: newEntries });
                              }}
                            />
                             <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Total</span>
                                <span className="text-2xl font-black text-blue-700">
                                  {entry.ah_um + entry.like + entry.so + entry.but + entry.other}
                                </span>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                 <div className="pt-4 border-t">
                    <button
                        onClick={saveAhUmReport}
                        disabled={isSaving || !ahUmForm.reporter_name || ahUmForm.entries.length === 0}
                        className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Submit Ah-Um Report'}
                    </button>
                 </div>
              </div>
            )}

            {/* Grammarian Tab */}
            {activeTab === 'grammarian' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg">Grammarian Info</h3>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={grammarianForm.reporter_name}
                      onChange={(e) =>
                        setGrammarianForm((prev) => ({ ...prev, reporter_name: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                        Word of the Day
                        </label>
                        <input
                        type="text"
                        value={grammarianForm.word_of_day}
                        onChange={(e) =>
                            setGrammarianForm((prev) => ({ ...prev, word_of_day: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-blue-50 text-blue-800 font-bold"
                        placeholder="e.g. Serendipity"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                        Definition
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        placeholder="Meaning..."
                        />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Observations</h3>
                  <button
                    onClick={addGrammarEntry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center gap-2"
                  >
                    <span>+</span> Add Entry
                  </button>
                </div>

                {grammarianForm.entries.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                    No observations added.
                  </div>
                ) : (
                    <div className="space-y-4">
                        {grammarianForm.entries.map((entry, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-gray-400 text-sm uppercase">Entry #{idx + 1}</h4>
                                    <button
                                        onClick={() => {
                                            const newEntries = grammarianForm.entries.filter((_, i) => i !== idx);
                                            setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                                
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => {
                                            const newEntries = [...grammarianForm.entries];
                                            newEntries[idx].is_positive = true;
                                            setGrammarianForm({ ...grammarianForm, entries: newEntries });
                                        }}
                                        className={`flex-1 py-2 rounded-md text-sm font-bold transition ${
                                            entry.is_positive 
                                            ? 'bg-white text-green-700 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Good Usage
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newEntries = [...grammarianForm.entries];
                                            newEntries[idx].is_positive = false;
                                            setGrammarianForm({ ...grammarianForm, entries: newEntries });
                                        }}
                                        className={`flex-1 py-2 rounded-md text-sm font-bold transition ${
                                            !entry.is_positive 
                                            ? 'bg-white text-orange-600 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        Needs Work
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Speaker</label>
                                        <input
                                            type="text"
                                            value={entry.speaker_name}
                                            onChange={(e) => {
                                                const newEntries = [...grammarianForm.entries];
                                                newEntries[idx].speaker_name = e.target.value;
                                                setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Who spoke?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Phrase/Word</label>
                                        <input
                                            type="text"
                                            value={entry.phrase}
                                            onChange={(e) => {
                                                const newEntries = [...grammarianForm.entries];
                                                newEntries[idx].phrase = e.target.value;
                                                setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg font-medium"
                                            placeholder="What did they say?"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Comment</label>
                                        <input
                                            type="text"
                                            value={entry.comment}
                                            onChange={(e) => {
                                                const newEntries = [...grammarianForm.entries];
                                                newEntries[idx].comment = e.target.value;
                                                setGrammarianForm((prev) => ({ ...prev, entries: newEntries }));
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Correction or note..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 border-t">
                    <button
                        onClick={saveGrammarianReport}
                        disabled={isSaving || !grammarianForm.reporter_name}
                        className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Submit Grammarian Report'}
                    </button>
                 </div>
              </div>
            )}

            {/* Timer Tab */}
            {activeTab === 'timer' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg">Timer Info</h3>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={timerForm.reporter_name}
                      onChange={(e) =>
                        setTimerForm((prev) => ({ ...prev, reporter_name: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                      placeholder="Enter name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Meeting Start
                      </label>
                      <input
                        type="time"
                        value={timerForm.meeting_start}
                        onChange={(e) =>
                          setTimerForm((prev) => ({ ...prev, meeting_start: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Meeting End
                      </label>
                      <input
                        type="time"
                        value={timerForm.meeting_end}
                        onChange={(e) =>
                          setTimerForm((prev) => ({ ...prev, meeting_end: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Timing Entries</h3>
                  <button
                    onClick={addTimerEntry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center gap-2"
                  >
                    <span>+</span> Add Entry
                  </button>
                </div>

                {timerForm.entries.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                    No timing entries added.
                  </div>
                ) : (
                    <div className="space-y-4">
                        {timerForm.entries.map((entry, idx) => (
                             <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                                <div className="flex justify-between items-center border-b pb-3 mb-3">
                                    <select
                                        value={entry.role}
                                        onChange={(e) => {
                                            const newEntries = [...timerForm.entries];
                                            newEntries[idx].role = e.target.value;
                                            setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                        }}
                                        className="bg-transparent font-bold text-gray-800 focus:outline-none"
                                    >
                                        <option value="">Select Role...</option>
                                        {MEETING_ROLES.map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => {
                                            const newEntries = timerForm.entries.filter((_, i) => i !== idx);
                                            setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Speaker</label>
                                        <input
                                            type="text"
                                            value={entry.speaker_name}
                                            onChange={(e) => {
                                                const newEntries = [...timerForm.entries];
                                                newEntries[idx].speaker_name = e.target.value;
                                                setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Title/Topic</label>
                                        <input
                                            type="text"
                                            value={entry.title_topic}
                                            onChange={(e) => {
                                                const newEntries = [...timerForm.entries];
                                                newEntries[idx].title_topic = e.target.value;
                                                setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Topic"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                                    <div className="flex-1">
                                         <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Time (m:ss)</label>
                                         <input
                                            type="text"
                                            value={formatTime(entry.duration_seconds)}
                                            onChange={(e) => {
                                                const newEntries = [...timerForm.entries];
                                                newEntries[idx].duration_seconds = parseTime(e.target.value);
                                                setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                            }}
                                            className="w-full px-3 py-2 border rounded-lg text-center font-mono font-bold text-xl"
                                            placeholder="0:00"
                                        />
                                    </div>
                                    <div className="flex-[2] flex gap-1">
                                        {[
                                            { val: 'green', label: '🟢', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
                                            { val: 'yellow', label: '🟡', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
                                            { val: 'red', label: '🔴', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
                                            { val: 'over', label: '⚫', bg: 'bg-gray-200', text: 'text-gray-700', border: 'border-gray-400' }
                                        ].map((status) => (
                                            <button
                                                key={status.val}
                                                onClick={() => {
                                                    const newEntries = [...timerForm.entries];
                                                    newEntries[idx].status = status.val as TimerEntry['status'];
                                                    setTimerForm((prev) => ({ ...prev, entries: newEntries }));
                                                }}
                                                className={`flex-1 py-3 rounded-lg text-xl border-2 transition ${
                                                    entry.status === status.val 
                                                    ? `${status.bg} ${status.border} shadow-inner scale-95` 
                                                    : 'bg-white border-gray-100 hover:bg-gray-50'
                                                }`}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 border-t">
                    <button
                        onClick={saveTimerReport}
                        disabled={isSaving || !timerForm.reporter_name}
                        className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Submit Timer Report'}
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
