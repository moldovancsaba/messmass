'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminDashboard from '@/components/AdminDashboard';
import AdminHero from '@/components/AdminHero';
import '../styles/admin.css';

/* What: Main admin dashboard page
   Why: Entry point to admin area with navigation cards
   
   Design:
   - Uses centralized AdminHero component for consistent header across all admin pages
   - Uses AdminDashboard component with ColoredCard for navigation grid
   - No custom styling - pure component reuse */

export default function AdminPage() {
  const { user, loading } = useAdminAuth();

  /* What: Loading state
     Why: Show feedback while checking authentication */
  /* WHAT: Loading state without inline styles
     WHY: Use utility classes from globals.css for consistent styling */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  /* What: Redirect handled by middleware
     Why: Not authenticated users are redirected before reaching this component */
  if (!user) {
    return null;
  }

  /* What: Dashboard with AdminHero + navigation cards
     Why: Consistent with all other admin pages (filter, projects, design, etc.) */
  return (
    <>
      <AdminHero
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user.name}! Choose a management area below to get started.`}
      />
      <AdminDashboard 
        user={user}
        permissions={{
          canManageUsers: true,
          canDelete: true,
          canRead: true,
          canWrite: true
        }}
      />
    </>
  );
}
