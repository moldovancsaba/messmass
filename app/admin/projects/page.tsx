'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import ProjectsPageClient from './ProjectsPageClient';
import '../../styles/admin.css';

export default function ProjectsPage() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="admin-container">
        <div className="glass-card">
          <div className="loading-spinner">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }
  
  return <ProjectsPageClient user={user} />;
}
