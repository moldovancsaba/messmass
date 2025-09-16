'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import HashtagEditor from '@/components/HashtagEditor';

interface User {
  name: string;
  role: string;
}

function HashtagList() {
  const [items, setItems] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState('');
  const [offset, setOffset] = React.useState(0);
  const [nextOffset, setNextOffset] = React.useState<number | null>(0);
  const [totalMatched, setTotalMatched] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const PAGE_SIZE = 20;

  const loadFirst = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}&offset=0&limit=${PAGE_SIZE}` : `?offset=0&limit=${PAGE_SIZE}`;
      const res = await fetch(`/api/hashtags${qs}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setItems(data.hashtags || []);
        setOffset(0);
        setNextOffset(data.pagination?.nextOffset ?? null);
        setTotalMatched(data.pagination?.totalMatched ?? (data.hashtags?.length || 0));
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadMore = async () => {
    if (loadingMore || nextOffset == null) return;
    setLoadingMore(true);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}&offset=${nextOffset}&limit=${PAGE_SIZE}` : `?offset=${nextOffset}&limit=${PAGE_SIZE}`;
      const res = await fetch(`/api/hashtags${qs}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setItems(prev => [...prev, ...(data.hashtags || [])]);
        setOffset(nextOffset);
        setNextOffset(data.pagination?.nextOffset ?? null);
        setTotalMatched(data.pagination?.totalMatched ?? totalMatched);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  React.useEffect(() => {
    const h = setTimeout(() => { loadFirst(); }, 300);
    return () => clearTimeout(h);
  }, [search, loadFirst]);

  return (
    <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>All Hashtags</h3>
          <div style={{ flex: 1 }} />
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Showing {items.length} of {totalMatched}
          </div>
          <input
            className="form-input"
            placeholder="Search hashtags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No hashtags found</div>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {items.map(tag => (
                <li key={tag} style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(229,231,235,1)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span>#{tag}</span>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`#${tag}`);
                      } catch {
                        // Fallback
                        const ta = document.createElement('textarea');
                        ta.value = `#${tag}`;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                      }
                    }}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    title="Copy hashtag"
                  >
                    📋 Copy
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              {nextOffset != null ? (
                <button className="btn btn-secondary" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? 'Loading…' : 'Load 20 more'}
                </button>
              ) : (
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No more items</span>
              )}
            </div>
          </>
        )}
      </div>
  );
}

export default function HashtagManagerPage() {
  const router = useRouter();
  
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

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
      />

      <div className="content-surface">
          {/* Hashtag Editor */}
          <div className="glass-card">
            <HashtagEditor />
          </div>

          {/* Hashtags List (paginated) */}
          <HashtagList />
      </div>
    </div>
  );
}
