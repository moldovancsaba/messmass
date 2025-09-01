'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      <AdminPageHero
        title="Hashtag Manager"
        icon="🎨"
        backLink="/admin"
      />

      {/* Hashtag Editor */}
      <div className="admin-container">
        <div className="glass-card">
          <HashtagEditor />
        </div>
      </div>

      {/* Global Styles */}
      <style jsx>{`
        .admin-container {
          min-height: 100vh;
          background: var(--gradient-primary);
          padding: 2rem;
        }

        .loading-spinner {
          text-align: center;
          padding: 3rem;
          font-size: 1.125rem;
          color: #4a5568;
        }

        .admin-access-denied {
          text-align: center;
          padding: 3rem;
        }

        .admin-access-denied h2 {
          color: #dc2626;
          margin-bottom: 1rem;
        }

        .admin-access-denied p {
          color: #4a5568;
          margin-bottom: 0.5rem;
        }

        .admin-header {
          margin-bottom: 2rem;
        }

        .admin-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-branding h1 {
          font-size: 2rem;
          font-weight: bold;
          color: #1a202c;
          margin: 0;
        }

        .admin-branding p {
          color: #4a5568;
          margin: 0;
          font-size: 1rem;
        }

        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .admin-badge {
          text-align: right;
        }

        .admin-badge p {
          margin: 0;
          font-size: 0.875rem;
        }

        .admin-role {
          font-weight: 600;
          color: #1a202c;
        }

        .admin-level {
          color: #667eea;
          text-transform: uppercase;
          font-weight: 500;
        }

        .admin-status {
          color: #48bb78;
          font-weight: 500;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 0.875rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5a67d8;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 1rem;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
}
