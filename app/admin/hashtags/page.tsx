'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import HashtagEditor from '@/components/HashtagEditor';

interface User {
  name: string;
  role: string;
}

export default function HashtagManagerPage() {
  const router = useRouter();
  
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // WHAT: Page-level search term controlling Project Hashtags filtering via HERO input.
  // WHY: Single source of truth enables server-side filtering and pagination reuse, and keeps
  //      the UI consistent with the existing /api/hashtags pagination/search behavior.
  const [searchTerm, setSearchTerm] = useState('');

  // Authentication check on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is authenticated (client-side)
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.authenticated) {
          window.location.href = '/admin/login';
          return;
        }

        setUser(data.user);
        setHasAccess(data.user.role === 'admin' || data.user.role === 'super-admin');
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/admin/login';
      }
    }

    checkAuth();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: 'var(--mm-space-6)'
      }}>
        <div style={{
          background: 'var(--mm-white)',
          border: '1px solid var(--mm-border-color-light)',
          borderRadius: 'var(--mm-radius-lg)',
          padding: 'var(--mm-space-8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--mm-space-4)',
          boxShadow: 'var(--mm-shadow-sm)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--mm-gray-200)',
            borderTopColor: 'var(--mm-color-primary-500)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <p style={{
            fontSize: 'var(--mm-font-size-base)',
            color: 'var(--mm-gray-600)',
            margin: 0,
            fontWeight: 'var(--mm-font-weight-medium)'
          }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: 'var(--mm-space-6)'
      }}>
        <div style={{
          background: 'var(--mm-white)',
          border: '1px solid var(--mm-border-color-light)',
          borderTop: '4px solid var(--mm-error)',
          borderRadius: 'var(--mm-radius-lg)',
          padding: 'var(--mm-space-8)',
          textAlign: 'center',
          boxShadow: 'var(--mm-shadow-sm)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--mm-space-4)' }}>⚠️</div>
          <h2 style={{
            fontSize: 'var(--mm-font-size-xl)',
            fontWeight: 'var(--mm-font-weight-bold)',
            color: 'var(--mm-gray-900)',
            margin: '0 0 var(--mm-space-3) 0'
          }}>Access Denied</h2>
          <p style={{
            fontSize: 'var(--mm-font-size-base)',
            color: 'var(--mm-gray-600)',
            margin: '0 0 var(--mm-space-2) 0'
          }}>You don&apos;t have permission to access the Hashtag Manager.</p>
          <p style={{
            fontSize: 'var(--mm-font-size-sm)',
            color: 'var(--mm-gray-500)',
            margin: '0 0 var(--mm-space-6) 0'
          }}>Only administrators can manage hashtags.</p>
          <a href="/admin" style={{
            display: 'inline-block',
            padding: 'var(--mm-space-2) var(--mm-space-4)',
            background: 'var(--mm-color-primary-500)',
            color: 'var(--mm-white)',
            textDecoration: 'none',
            borderRadius: 'var(--mm-radius-md)',
            fontWeight: 'var(--mm-font-weight-medium)',
            fontSize: 'var(--mm-font-size-sm)',
            transition: 'all 0.2s ease'
          }}>
            ← Back to Admin Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHero
        title="Hashtag Manager"
        backLink="/admin"
        // WHAT: Enable HERO search to control Project Hashtags below.
        // WHY: Removes duplicated "All Hashtags" section and unifies filtering UX in the header.
        showSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search project hashtags..."
      />

      <div style={{
        background: 'var(--mm-white)',
        border: '1px solid var(--mm-border-color-light)',
        borderRadius: 'var(--mm-radius-lg)',
        padding: 'var(--mm-space-6)',
        boxShadow: 'var(--mm-shadow-sm)'
      }}>
        {/* Hashtag Editor - now internally paginated and filtered server-side */}
        <HashtagEditor className="mt-2" searchTerm={searchTerm} />
      </div>
    </div>
  );
}
