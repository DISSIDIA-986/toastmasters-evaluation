import { getMeetingById } from '@/lib/db';
import EvaluationForm from '@/components/EvaluationForm';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EvaluatePage({ params }: Props) {
  const { id } = await params;
  const meetingId = parseInt(id);

  if (isNaN(meetingId)) {
    notFound();
  }

  let meeting;
  try {
    meeting = await getMeetingById(meetingId);
  } catch {
    // Database not initialized yet
    meeting = null;
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-lg">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Meeting Not Found</h1>
          <p className="text-gray-600 mb-4">
            This meeting doesn&apos;t exist or hasn&apos;t been created yet.
          </p>
          <a
            href="/admin"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Admin
          </a>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(meeting.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
        <EvaluationForm meetingId={meetingId} />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        Toastmasters Evaluation System
      </footer>
    </div>
  );
}
