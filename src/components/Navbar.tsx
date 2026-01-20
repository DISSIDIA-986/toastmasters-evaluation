'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Home Link */}
        <Link href="/" className="font-bold text-xl flex items-center gap-2 text-gray-900">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">TM</span>
          <span className="hidden sm:inline">Evaluation</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          {!isAdmin ? (
            <>
               <Link
                href="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === '/' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Home
              </Link>
              <Link
                href="/admin"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                Admin Access
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                Exit Admin
              </Link>
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === '/admin'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
