'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminDashboard from '@/components/AdminDashboard';
import '../styles/admin.css';

/* What: Main admin dashboard page
   Why: Entry point to admin area with navigation cards
   
   Changes from legacy:
   - Removed redundant header (now handled by AdminLayout in layout.tsx)
   - Removed glass-card styling (using AdminLayout's structure)
   - Kept loading and auth states */

export default function AdminPage() {
  const { user, loading } = useAdminAuth();

  /* What: Loading state
     Why: Show feedback while checking authentication */
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '400px',
        color: 'var(--mm-gray-600)'
      }}>
        Loading admin dashboard...
      </div>
    );
  }

  /* What: Redirect handled by middleware
     Why: Not authenticated users are redirected before reaching this component */
  if (!user) {
    return null;
  }

  /* What: Dashboard content without duplicate header
     Why: AdminLayout provides header, we just need the navigation cards */
  return (
    <AdminDashboard 
      user={user}
      permissions={{
        canManageUsers: true,
        canDelete: true,
        canRead: true,
        canWrite: true
      }}
    />
  );
}
