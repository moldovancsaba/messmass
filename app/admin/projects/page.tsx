'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import ProjectsPageClient from './ProjectsPageClient';

// WHAT: Projects page wrapper with auth check
// WHY: Ensures user is authenticated before showing projects list
export default function ProjectsPage() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center" style={{minHeight: '400px'}}>
        <div className="admin-card text-center">
          <div className="text-4xl mb-4">📁</div>
          <div className="text-gray-600">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }
  
  return <ProjectsPageClient user={user} />;
}
