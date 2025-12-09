'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Meeting, Evaluation, SPEECH_TYPES } from '@/lib/types';

export default function AdminPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ name: '', date: '' });
  const [showQRCode, setShowQRCode] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database on first load
  useEffect(() => {
    const initDb = async () => {
      try {
        await fetch('/api/init');
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    initDb();
  }, []);

  // Fetch meetings
  useEffect(() => {
    if (!dbInitialized) return;

    const fetchMeetings = async () => {
      try {
        const response = await fetch('/api/meetings');
        if (response.ok) {
          const data = await response.json();
          setMeetings(data);
        }
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetings();
  }, [dbInitialized]);

  // Fetch evaluations for selected meeting
  useEffect(() => {
    if (!selectedMeeting) {
      setEvaluations([]);
      return;
    }

    const fetchEvaluations = async () => {
      try {
        const response = await fetch(`/api/meetings/${selectedMeeting.id}`);
        if (response.ok) {
          const data = await response.json();
          setEvaluations(data.evaluations || []);
        }
      } catch (error) {
        console.error('Failed to fetch evaluations:', error);
      }
    };
    fetchEvaluations();
  }, [selectedMeeting]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.name || !newMeeting.date) return;

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeeting),
      });

      if (response.ok) {
        const meeting = await response.json();
        setMeetings((prev) => [meeting, ...prev]);
        setNewMeeting({ name: '', date: '' });
        setShowCreateForm(false);
        setSelectedMeeting(meeting);
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
    }
  };

  const getEvaluationUrl = () => {
    if (typeof window === 'undefined' || !selectedMeeting) return '';
    return `${window.location.origin}/evaluate/${selectedMeeting.id}`;
  };

  const groupEvaluationsBySpeaker = () => {
    const grouped: Record<string, Evaluation[]> = {};
    evaluations.forEach((evaluation) => {
      if (!grouped[evaluation.speaker_name]) {
        grouped[evaluation.speaker_name] = [];
      }
      grouped[evaluation.speaker_name].push(evaluation);
    });
    return grouped;
  };

  const getTotalFeedbackCount = (evals: Evaluation[]) => {
    return evals.reduce(
      (sum, e) =>
        sum + (e.commend_tags?.length || 0) + (e.recommend_tags?.length || 0) + (e.challenge_tags?.length || 0),
      0
    );
  };

  const exportToCSV = () => {
    if (evaluations.length === 0) return;

    const headers = [
      'Speaker',
      'Evaluator',
      'Type',
      'Commend',
      'Recommend',
      'Challenge',
      'Comments',
    ];

    const rows = evaluations.map((e) => [
      e.speaker_name,
      e.evaluator_name,
      SPEECH_TYPES[e.speech_type as keyof typeof SPEECH_TYPES],
      `"${(e.commend_tags || []).join('; ')}"`,
      `"${(e.recommend_tags || []).join('; ')}"`,
      `"${(e.challenge_tags || []).join('; ')}"`,
      `"${e.comments?.replace(/"/g, '""') || ''}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluations-${selectedMeeting?.name || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendViaEmail = () => {
    if (evaluations.length === 0 || !selectedMeeting) return;

    const meetingDate = new Date(selectedMeeting.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const grouped = groupEvaluationsBySpeaker();
    const divider = '─'.repeat(40);

    let body = `TOASTMASTERS EVALUATION RESULTS\n`;
    body += `${divider}\n\n`;
    body += `Meeting: ${selectedMeeting.name}\n`;
    body += `Date: ${meetingDate}\n`;
    body += `Total Evaluations: ${evaluations.length}\n\n`;
    body += `${'═'.repeat(40)}\n\n`;

    Object.entries(grouped).forEach(([speaker, evals]) => {
      const speechType = SPEECH_TYPES[evals[0].speech_type as keyof typeof SPEECH_TYPES];
      const feedbackCount = getTotalFeedbackCount(evals);

      body += `SPEAKER: ${speaker.toUpperCase()}\n`;
      body += `${divider}\n`;
      body += `Speech Type: ${speechType}\n`;
      body += `Evaluations: ${evals.length} | Feedback Items: ${feedbackCount}\n\n`;

      evals.forEach((evaluation, index) => {
        body += `  [Evaluation ${index + 1}] From: ${evaluation.evaluator_name}\n`;

        if (evaluation.commend_tags && evaluation.commend_tags.length > 0) {
          body += `\n  ✓ COMMEND (What went well):\n`;
          evaluation.commend_tags.forEach((tag) => {
            body += `    • ${tag}\n`;
          });
        }

        if (evaluation.recommend_tags && evaluation.recommend_tags.length > 0) {
          body += `\n  → RECOMMEND (Suggestions):\n`;
          evaluation.recommend_tags.forEach((tag) => {
            body += `    • ${tag}\n`;
          });
        }

        if (evaluation.challenge_tags && evaluation.challenge_tags.length > 0) {
          body += `\n  ★ CHALLENGE (Growth areas):\n`;
          evaluation.challenge_tags.forEach((tag) => {
            body += `    • ${tag}\n`;
          });
        }

        if (evaluation.comments) {
          body += `\n  💬 Comments:\n`;
          body += `    "${evaluation.comments}"\n`;
        }

        body += `\n`;
      });

      body += `${'═'.repeat(40)}\n\n`;
    });

    body += `\n---\nGenerated from Toastmasters Evaluation System\n`;

    const subject = `Evaluation Results for ${selectedMeeting.name}`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Evaluation Admin</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            + New Meeting
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Meetings List */}
          <div className="md:col-span-1">
            <h2 className="font-semibold text-gray-700 mb-3">Meetings</h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {meetings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No meetings yet</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="text-blue-600 hover:underline mt-2"
                  >
                    Create your first meeting
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {meetings.map((meeting) => (
                    <button
                      key={meeting.id}
                      onClick={() => setSelectedMeeting(meeting)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        selectedMeeting?.id === meeting.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-800">{meeting.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(meeting.date).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Evaluations */}
          <div className="md:col-span-2">
            {selectedMeeting ? (
              <>
                {/* Meeting Header */}
                <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-semibold text-gray-800 text-lg">{selectedMeeting.name}</h2>
                      <p className="text-gray-500 text-sm">
                        {new Date(selectedMeeting.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowQRCode(true)}
                        className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700 transition"
                      >
                        Show QR
                      </button>
                      <button
                        onClick={exportToCSV}
                        disabled={evaluations.length === 0}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={sendViaEmail}
                        disabled={evaluations.length === 0}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        Send to Mail
                      </button>
                    </div>
                  </div>

                  {/* Share Link */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Share this link with participants:</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={getEvaluationUrl()}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border rounded text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(getEvaluationUrl())}
                        className="px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300 transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Evaluations by Speaker */}
                {evaluations.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
                    <div className="text-4xl mb-3">📝</div>
                    <p>No evaluations yet</p>
                    <p className="text-sm mt-2">Share the QR code or link to collect feedback</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupEvaluationsBySpeaker()).map(([speaker, evals]) => (
                      <div key={speaker} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-800">{speaker}</h3>
                            <p className="text-sm text-gray-500">
                              {evals.length} evaluation{evals.length > 1 ? 's' : ''} • {getTotalFeedbackCount(evals)} feedback items
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {SPEECH_TYPES[evals[0].speech_type as keyof typeof SPEECH_TYPES]}
                          </div>
                        </div>
                        <div className="divide-y">
                          {evals.map((evaluation) => (
                            <div key={evaluation.id} className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="font-medium text-gray-700">
                                  From: {evaluation.evaluator_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(evaluation.created_at).toLocaleTimeString()}
                                </div>
                              </div>

                              {/* Commend Tags */}
                              {evaluation.commend_tags && evaluation.commend_tags.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-xs font-medium text-green-700 mb-1">Commend:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {evaluation.commend_tags.map((tag, i) => (
                                      <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recommend Tags */}
                              {evaluation.recommend_tags && evaluation.recommend_tags.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-xs font-medium text-yellow-700 mb-1">Recommend:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {evaluation.recommend_tags.map((tag, i) => (
                                      <span key={i} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Challenge Tags */}
                              {evaluation.challenge_tags && evaluation.challenge_tags.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-xs font-medium text-blue-700 mb-1">Challenge:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {evaluation.challenge_tags.map((tag, i) => (
                                      <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Comments */}
                              {evaluation.comments && (
                                <div className="mt-2 pt-2 border-t">
                                  <span className="text-xs font-medium text-gray-700">Comments: </span>
                                  <span className="text-sm text-gray-600">{evaluation.comments}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">👈</div>
                <p>Select a meeting to view evaluations</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Meeting Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Meeting</h2>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Name</label>
                <input
                  type="text"
                  value={newMeeting.name}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekly Meeting #42"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">{selectedMeeting.name}</h2>
            <p className="text-gray-500 text-sm mb-4">Scan to submit evaluation</p>
            <div className="bg-white p-4 inline-block rounded-lg shadow-lg">
              <QRCodeSVG value={getEvaluationUrl()} size={250} level="H" />
            </div>
            <p className="text-xs text-gray-400 mt-4 max-w-xs mx-auto break-all">{getEvaluationUrl()}</p>
            <button
              onClick={() => setShowQRCode(false)}
              className="mt-4 px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
