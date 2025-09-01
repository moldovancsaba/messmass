'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminDashboard from '@/components/AdminDashboard';
import '../styles/admin.css';

export default function AdminPage() {
  const { user, loading, logout } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-container">
        <div className="glass-card">
          <div className="loading-spinner">Loading admin...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="admin-container">
      {/* Glass Card Header */}
      <div className="glass-card admin-header">
        <div className="admin-header-content">
          <div className="admin-branding" style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '0rem',
              color: '#1f2937'
            }}>
              Admin Dashboard
            </h1>
          </div>
          <div className="admin-user-info">
            <div className="admin-badge">
              <p className="admin-role">{user.name}</p>
              <p className="admin-level">{user.role}</p>
              <p className="admin-status">✓ Authenticated</p>
            </div>
            <button
              onClick={logout}
              className="btn btn-logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Admin Dashboard Content */}
      <AdminDashboard 
        user={user}
        permissions={{
          canManageUsers: true,
          canDelete: true,
          canRead: true,
          canWrite: true
        }}
      />
    </div>
  );
}
