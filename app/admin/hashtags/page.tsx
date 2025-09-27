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
      <div className="admin-container">
        <div className="glass-card">
          <div className="loading-spinner">Checking authentication...</div>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="admin-container">
        <div className="glass-card">
          <div className="admin-access-denied">
            <h2>Access Denied</h2>
            <p>You don&apos;t have permission to access the Hashtag Manager.</p>
            <p>Only administrators can manage hashtags.</p>
            <a href="/admin" className="btn btn-primary">
              ← Back to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
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

      <div className="content-surface">
        {/* Hashtag Editor - now internally paginated and filtered server-side */}
        <div className="glass-card">
          <HashtagEditor className="mt-2" searchTerm={searchTerm} />
        </div>
      </div>
    </div>
  );
}
