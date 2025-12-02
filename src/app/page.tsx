import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Toastmasters
            <span className="text-blue-600"> Evaluation</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Collect meaningful feedback for speakers. Help everyone grow through constructive evaluations.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="font-semibold text-gray-800 mb-2">Mobile-First</h3>
            <p className="text-gray-600 text-sm">
              Easy to use on any device. Participants can scan QR and submit feedback instantly.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-semibold text-gray-800 mb-2">Structured Feedback</h3>
            <p className="text-gray-600 text-sm">
              Rate content, delivery, language, time control, and provide written suggestions.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-800 mb-2">Easy Export</h3>
            <p className="text-gray-600 text-sm">
              View all evaluations and export to CSV for sharing with speakers after the meeting.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Link
            href="/admin"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            Go to Admin Dashboard →
          </Link>
          <p className="text-gray-500 text-sm">
            Create a meeting and share the QR code with participants
          </p>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Create Meeting', desc: 'Set up a new meeting in admin' },
              { step: '2', title: 'Share QR Code', desc: 'Display or share the link' },
              { step: '3', title: 'Collect Feedback', desc: 'Participants submit evaluations' },
              { step: '4', title: 'Review & Export', desc: 'Share results with speakers' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm border-t">
        <p>Toastmasters Evaluation System</p>
        <p className="mt-1">Built for better feedback and growth</p>
      </footer>
    </div>
  );
}
