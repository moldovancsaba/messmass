'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import ProjectsPageClient from './ProjectsPageClient';
import styles from './Projects.module.css';

// WHAT: Projects page wrapper with auth check and TailAdmin V2 design
// WHY: Ensures user is authenticated before showing projects list
// HOW: Uses CSS Modules for flat design consistent with TailAdmin V2 aesthetic
export default function ProjectsPage() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }
  
  return <ProjectsPageClient user={user} />;
}
