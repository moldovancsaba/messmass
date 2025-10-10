'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import HashtagEditor from '@/components/HashtagEditor';
import ColoredCard from '@/components/ColoredCard';

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
      <div className="page-container flex items-center justify-center min-h-screen">
        <ColoredCard accentColor="#6366f1" hoverable={false} className="text-center">
          <div className="text-4xl mb-4">🏷️</div>
          <div className="text-gray-600">Checking authentication...</div>
        </ColoredCard>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="max-w-md">
        <ColoredCard accentColor="var(--mm-color-error-500)" hoverable={false} className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-base text-gray-600 mb-2">You don&apos;t have permission to access the Hashtag Manager.</p>
          <p className="text-sm text-gray-500 mb-6">Only administrators can manage hashtags.</p>
          <a href="/admin" className="btn btn-small btn-primary">
            ← Back to Admin Dashboard
          </a>
        </ColoredCard>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
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

      {/* WHAT: HashtagEditor renders colored cards internally using ColoredCard component
       * WHY: No wrapper needed - HashtagEditor handles its own layout and card structure
       *      Extra .admin-card wrapper was creating double-box effect */}
      <HashtagEditor searchTerm={searchTerm} />
    </div>
  );
}
