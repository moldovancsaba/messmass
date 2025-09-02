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

export const metadata: Metadata = {
  title: '404 - Page Not Found | Messmass',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
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
          🔍
        </div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 1rem 0'
        }}>
          Page Not Found
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '1.125rem',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          The page you are looking for could not be found. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            🏠 Go Home
          </a>
          <a
            href="/admin"
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
            ⚙️ Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
