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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '3rem',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          ⚠️
        </div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 1rem 0'
        }}>
          Something went wrong!
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '1.125rem',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        
        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'left',
            fontSize: '0.875rem',
            color: '#374151',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word'
          }}>
            {error.message}
            {error.digest && (
              <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                Digest: {error.digest}
              </div>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🔄 Try Again
          </button>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(107, 114, 128, 0.1)',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              border: '1px solid rgba(107, 114, 128, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            🏠 Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
