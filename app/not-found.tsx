/**
 * not-found.tsx
 * 
 * Next.js 13+ App Directory Not Found page
 * Handles 404 errors and provides user-friendly messaging
 * 
 * This file is required by Next.js app directory structure
 * to prevent ENOENT errors on missing routes
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Messmass',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="error-container">
      <div className="card card-lg max-w-lg text-center">
        <div className="card-body">
          <div className="text-5xl mb-md">
            🔍
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-md">
            Page Not Found
          </h1>
          <p className="text-gray-600 text-lg mb-lg" style={{lineHeight: '1.6'}}>
            The page you are looking for could not be found. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          <div className="flex gap-md justify-center flex-wrap">
            <Link
              href="/"
              className="btn btn-primary"
            >
              🏠 Go Home
            </Link>
            <Link
              href="/admin"
              className="btn btn-secondary"
            >
              ⚙️ Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
