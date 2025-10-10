'use client';

import ChartAlgorithmManager from '@/components/ChartAlgorithmManager';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
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
      <div className="page-container flex items-center justify-center min-h-screen">
        <ColoredCard accentColor="#6366f1" hoverable={false} className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-gray-600">Loading...</div>
        </ColoredCard>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="max-w-md">
        <ColoredCard accentColor="var(--mm-color-error-500)" hoverable={false} className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-base text-gray-600 mb-2">You don&apos;t have permission to access the Chart Algorithm Manager.</p>
          <p className="text-sm text-gray-500 mb-6">Only administrators can manage chart configurations.</p>
          <a href="/admin" className="btn btn-small btn-primary">← Back to Admin Dashboard</a>
        </ColoredCard>
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

      {/* Chart Algorithm Manager Component */}
      <ChartAlgorithmManager />
    </div>
  );
}
