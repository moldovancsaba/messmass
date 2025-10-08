/**
 * error.tsx
 * 
 * Next.js 13+ App Directory Error page
 * Handles runtime errors and provides user-friendly error messaging
 * 
 * This file is required by Next.js app directory structure
 * to handle unexpected errors gracefully
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-card max-w-lg">
        <div className="text-5xl mb-md">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-md">
          Something went wrong!
        </h1>
        <p className="text-gray-600 text-lg mb-lg" style={{lineHeight: '1.6'}}>
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        
        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 border border-gray-300 p-md mb-lg text-left text-sm text-gray-700 font-mono" style={{borderRadius: 'var(--mm-radius-md)', whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}>
            {error.message}
            {error.digest && (
              <div className="mt-sm text-gray-600">
                Digest: {error.digest}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-md justify-center flex-wrap">
          <button
            onClick={reset}
            className="btn btn-primary"
          >
            🔄 Try Again
          </button>
          <Link
            href="/"
            className="btn btn-secondary"
          >
            🏠 Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
