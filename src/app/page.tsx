'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const HOME_URL = 'https://toastmasters-evaluation.vercel.app';

interface Meeting {
  id: number;
  name: string;
  date: string;
}

export default function Home() {
  const router = useRouter();
  const [qrSize, setQrSize] = useState(280);
  const [isLoading, setIsLoading] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [todaysMeetings, setTodaysMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const calculateQrSize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 480) {
        setQrSize(Math.min(Math.floor(screenWidth * 0.7), 320));
      } else if (screenWidth < 768) {
        setQrSize(350);
      } else if (screenWidth < 1200) {
        setQrSize(400);
      } else {
        setQrSize(500);
      }
    };

    calculateQrSize();
    window.addEventListener('resize', calculateQrSize);
    return () => window.removeEventListener('resize', calculateQrSize);
  }, []);

  const handleStartEvaluating = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/meetings/today');
      if (!response.ok) throw new Error('Failed to fetch meetings');
      
      const meetings: Meeting[] = await response.json();
      
      if (meetings.length === 0) {
        setError('No meetings found for today. Please check with the organizer.');
      } else if (meetings.length === 1) {
        router.push(`/evaluate/${meetings[0].id}`);
      } else {
        setTodaysMeetings(meetings);
        setShowMeetingModal(true);
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-50 to-white pb-16">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            Toastmasters
            <span className="text-blue-600 block md:inline md:ml-3">Evaluation</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Fast, structured, and constructive feedback for speakers. 
            <br className="hidden md:block" />
            Designed for mobile use during meetings.
          </p>

          {/* Primary Action */}
          <div className="relative z-10">
            <button
              onClick={handleStartEvaluating}
              disabled={isLoading}
              className="bg-blue-600 text-white text-xl font-bold px-10 py-5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-1 transition-all transform w-full md:w-auto min-w-[280px]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </span>
              ) : (
                'Start Evaluating 🚀'
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 max-w-md mx-auto animate-fade-in">
                {error}
                <div className="mt-2 text-sm">
                  Is the meeting created? <Link href="/admin" className="underline font-semibold">Check Admin</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meeting Selection Modal */}
        {showMeetingModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Select Today's Meeting</h3>
              <div className="space-y-3">
                {todaysMeetings.map(meeting => (
                  <button
                    key={meeting.id}
                    onClick={() => router.push(`/evaluate/${meeting.id}`)}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition group"
                  >
                    <div className="font-semibold text-gray-800 group-hover:text-blue-700">{meeting.name}</div>
                    <div className="text-sm text-gray-500">{new Date(meeting.date).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMeetingModal(false)}
                className="mt-6 w-full py-3 text-gray-500 font-medium hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* QR Code Section (Secondary) */}
        <div className="mt-20 bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-blue-100 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invite Others</h2>
          <p className="text-gray-500 mb-8">Show this QR code to let members access the app instantly</p>
          
          <div className="flex justify-center mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 inline-block">
              <QRCodeSVG
                value={HOME_URL}
                size={qrSize}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[
            { icon: '📱', title: 'Mobile-First', desc: 'Designed for ease of use on smartphones.' },
            { icon: '🎯', title: 'Specific Feedback', desc: 'Commend, Recommend, and Challenge tags.' },
            { icon: '⚡', title: 'Fast Entry', desc: 'No login required for evaluators.' },
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

