import { getMeetingById, getMeetingByDate } from '@/lib/db';
import EvaluationForm from '@/components/EvaluationForm';
import { formatMeetingDateLong, parseYyMMdd } from '@/lib/date';
import { signMeetingToken } from '@/lib/auth';
import { notFound } from 'next/navigation';

const NUMERIC_ID = /^\d+$/;

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Accepts two URL shapes in the same dynamic segment:
 *   /evaluate/9       → numeric meeting id (existing behaviour)
 *   /evaluate/260519  → yyMMdd date (resolves to the meeting on 2026-05-19)
 *
 * The yyMMdd form lets the agenda maintainer (Nelson) compose a link from
 * the meeting date without looking up the id in admin.
 */
export default async function EvaluatePage({ params }: Props) {
  const { id } = await params;

  // Resolve the meeting. Try yyMMdd first when the segment looks like a date,
  // then fall back to a strictly-numeric id. Garbage segments (e.g. "9foo")
  // are rejected up front so they don't silently resolve to meeting 9.
  let meeting;
  try {
    const isoFromDate = parseYyMMdd(id);
    if (isoFromDate) {
      meeting = await getMeetingByDate(isoFromDate);
    } else if (NUMERIC_ID.test(id)) {
      meeting = await getMeetingById(parseInt(id, 10));
    }
  } catch {
    // Database not initialized yet — fall through to the not-found state below.
    meeting = null;
  }

  // Render a real 404 (not a 200 with a "not found" body) so a bad link
  // pasted into the agenda surfaces clearly in monitoring and crawlers.
  if (!meeting) {
    notFound();
  }

  const formattedDate = formatMeetingDateLong(meeting.date);

  // Sign a submit token bound to this meeting. Embedded in the public form and
  // verified on POST — blocks drive-by API posts and cross-meeting replay.
  const submitToken = await signMeetingToken(meeting.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white py-6 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-1">Speaker Evaluation</h1>
          <p className="text-blue-100">{meeting.name}</p>
          <p className="text-blue-200 text-sm">{formattedDate}</p>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-lg mx-auto p-4 -mt-4">
        <EvaluationForm meetingId={meeting.id} submitToken={submitToken} />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        Toastmasters Evaluation System
      </footer>
    </div>
  );
}
