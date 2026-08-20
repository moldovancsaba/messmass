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

// WHAT: Recognise the post-deploy "chunk skew" error class.
// WHY: When a new deployment lands, a browser holding the previous page requests
//     JS chunk hashes the new build renamed, so the first navigation throws
//     ChunkLoadError / "Loading chunk failed" / "Failed to fetch dynamically
//     imported module". A one-time reload fetches the new HTML and it works —
//     which is why such errors "fix themselves on refresh". We do that reload
//     automatically so users never see the blip after a deploy.
function isChunkSkewError(error: Error): boolean {
  const text = `${error?.name || ''} ${error?.message || ''}`;
  return /ChunkLoadError|Loading chunk [\d]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(text);
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Auto-recover from post-deploy chunk skew: reload ONCE (guarded by a
    // sessionStorage flag so a genuinely broken chunk can't loop forever).
    if (typeof window !== 'undefined' && isChunkSkewError(error)) {
      const KEY = 'mm-chunk-reload-at';
      const last = Number(sessionStorage.getItem(KEY) || '0');
      // only auto-reload if we haven't already tried in the last 10s
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
        return;
      }
    }

    // Log the error to error reporting service
    console.error('Application error:', error);

    // WHAT: Best-effort report to the server logger so a browser-only crash
    //     (never touches an API route otherwise) is still queryable later.
    // WHY: This page's own detail box is dev-only; production crashes were
    //     previously invisible outside the browser console nobody reads.
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
      }),
    }).catch(() => {
      // Reporting failure must never compound the error this page is showing.
    });
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
        {/* WHAT: Fixed line height for readability in error messages - WHY: Error page needs clear typography (legitimate static style) */}
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <p className="text-gray-600 text-lg mb-lg" style={{lineHeight: '1.6'}}>
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        
        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <>
            {/* WHAT: Development-only error details box with wrapping styles - WHY: Ensure long error messages wrap properly in error box */}
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <div className="bg-gray-50 border border-gray-300 p-md mb-lg text-left text-sm text-gray-700 font-mono" style={{borderRadius: 'var(--mm-radius-md)', whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}>
              {error.message}
              {error.digest && (
                <div className="mt-sm text-gray-600">
                  Digest: {error.digest}
                </div>
              )}
            </div>
          </>
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
