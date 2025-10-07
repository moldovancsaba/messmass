'use client';

import ChartAlgorithmManager from '@/components/ChartAlgorithmManager';
import AdminHero from '@/components/AdminHero';
import { useEffect, useState } from 'react';

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
      <div className="page-container">
        <div className="admin-content">
          <div className="admin-card" style={{ textAlign: 'center' }}>
            Loading…
          </div>
        </div>
      </div>
    );
  }

if (!hasAccess) {
    return (
      <div className="page-container">
        <div className="admin-content">
          <div className="admin-card" style={{ textAlign: 'center' }}>
            <h2 className="no-margin">Access Denied</h2>
            <p className="mt-2">You don&apos;t have permission to access the Chart Algorithm Manager.</p>
            <p className="mt-2">Only administrators can manage chart configurations.</p>
            <a href="/admin" className="btn btn-primary">← Back to Admin Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <AdminHero 
        title="Chart Algorithm Manager"
        subtitle="Configure chart algorithms, data processing & visualization settings"
        badges={[
          { text: `${user?.name}`, variant: 'primary' },
          { text: user?.role || '', variant: 'secondary' }
        ]}
        backLink="/admin"
      />

      <div className="content-surface">
        {/* Chart Algorithm Manager Component */}
        <ChartAlgorithmManager />
      </div>
    </div>
  );
}
