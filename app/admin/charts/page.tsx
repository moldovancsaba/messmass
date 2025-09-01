'use client';

import ChartAlgorithmManager from '@/components/ChartAlgorithmManager';
import AdminPageHero from '@/components/AdminPageHero';
import { useEffect, useState } from 'react';
import '../../styles/admin.css';

interface User {
  name: string;
  role: string;
}

export default function ChartAlgorithmManagerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

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
        setHasAccess(data.user.role === 'admin' || data.user.role === 'super-admin'); // Admins and super-admins can manage charts
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/admin/login';
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="admin-container">
        <div className="glass-card">
          <div className="loading-spinner">Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="admin-container">
        <div className="glass-card">
          <div className="admin-access-denied">
            <h2>Access Denied</h2>
            <p>You don&apos;t have permission to access the Chart Algorithm Manager.</p>
            <p>Only administrators can manage chart configurations.</p>
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
      <AdminPageHero 
        title="Chart Algorithm Manager"
        subtitle="Configure chart algorithms, data processing & visualization settings"
        icon="📊"
        showSearch={false}
        badges={[
          { text: `${user?.name}`, variant: 'primary' },
          { text: user?.role || '', variant: 'secondary' }
        ]}
        backLink="/admin"
      />

      {/* Chart Algorithm Manager Component */}
      <ChartAlgorithmManager />

      {/* Styling for this page */}
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
      `}</style>
    </div>
  );
}
