'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import EditorDashboard from '../../../components/EditorDashboard';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import { useReportStyle } from '@/hooks/useReportStyle';
import styles from './page.module.css';

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  styleIdEnhanced?: string; // Reference to page_styles_enhanced collection
  partner1?: { _id: string; name: string; emoji: string; logoUrl?: string; clickerSetId?: string };
  partner2?: { _id: string; name: string; emoji: string; logoUrl?: string; clickerSetId?: string };
  // WHAT: Flexible stats object to support all variables including new ones
  // WHY: Variables are dynamic and managed in database (variables_metadata)
  // HOW: Use index signature to allow any numeric stat field
  stats: {
    // Core required fields
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    indoor: number;
    outdoor: number;
    stadium: number;
    female: number;
    male: number;
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
    merched: number;
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
    // All other stats are optional and dynamic
    [key: string]: number | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

export default function EditPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const loadProjectForEditing = useCallback(async () => {
    try {
      console.log('🔍 Fetching project for editing with slug:', slug);
      
      if (!slug) {
        console.error('❌ No slug provided to edit page');
        setError('Invalid edit link - missing project identifier');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/projects/edit/${slug}`, { cache: 'no-store' });
      console.log('📡 API response status:', response.status);
      
      const data = await response.json();
      console.log('📦 API response data:', data);

      if (data.success) {
        console.log('✅ Found project for editing:', data.project.eventName);
        console.log('📄 Project data keys:', Object.keys(data.project));
        console.log('📄 Stats keys:', Object.keys(data.project.stats || {}));
        setProject(data.project);
        setLoading(false);
      } else {
        console.error('❌ API returned error:', data.error);
        setError(data.error || 'Project not found');
        setLoading(false);
      }
    } catch (err) {
      console.error('🔥 Exception in loadProjectForEditing:', err);
      setError('Failed to load project for editing');
      setLoading(false);
    }
  }, [slug]);

  // WHAT: Apply report style colors to edit page
  // WHY: Edit pages should use same 26-color system as reports
  // HOW: useReportStyle fetches and injects CSS variables when project has styleId
  const { loading: styleLoading } = useReportStyle({ 
    styleId: project?.styleIdEnhanced ? String(project.styleIdEnhanced) : null,
    enabled: !!project // Only fetch after project is loaded
  });

  // Check authentication on component mount
  useEffect(() => {
    if (slug) {
      const authenticated = isAuthenticated(slug, 'edit');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      // Only load data if authenticated
      if (authenticated) {
        loadProjectForEditing();
      }
    }
  }, [slug, loadProjectForEditing]);

  // WHAT: Auto-reload when page becomes visible (e.g., returning from another tab)
  // WHY: Ensures project data and page style are synced without manual refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthorized) {
        loadProjectForEditing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthorized, loadProjectForEditing]);

  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    // Load data after successful authentication
    loadProjectForEditing();
  };

  /* What: Loading state while checking authentication
     Why: Show user-friendly loading indicator during auth check */
  if (checkingAuth) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.stateCard}>
          <div className="curve-spinner"></div>
          <p className={styles.stateMessage}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authorized
  if (!isAuthorized) {
    return (
      <PagePasswordLogin
        pageId={slug}
        pageType="edit"
        onSuccess={handleLoginSuccess}
      />
    );
  }

  /* What: Loading state while fetching project data
     Why: Show user-friendly loading indicator with context */
  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.stateCard}>
          <div className="curve-spinner"></div>
          <p className={styles.stateMessage}>Loading project editor...</p>
        </div>
      </div>
    );
  }

  /* What: Error state with flat TailAdmin V2 design
     Why: Modern, clean error card without glass-morphism effects */
  if (error) {
    return (
      <div className={styles.centerContainerColumn}>
        <div className={styles.errorCard}>
          <h1 className={styles.errorHeading}>❌ Access Error</h1>
          <p className={styles.errorTextPrimary}>{error}</p>
          <p className={styles.errorTextSecondary}>
            The editing link you&apos;re trying to access might not exist or may have been removed.
          </p>
          <button 
            onClick={() => window.close()}
            className={styles.closeButton}
          >
            ✕ Close Editor
          </button>
        </div>
      </div>
    );
  }

  /* WHAT: Main editor container using CSS variables from useReportStyle
     WHY: Report style system injects CSS variables automatically
     FEATURES:
     - Uses --heroBackground, --textColor, --fontFamily from injected styles
     - Falls back to page-bg-gray class if no custom style
     - Full viewport height for immersive editing experience
     - Proper integration with EditorDashboard component */
  if (project) {
    return (
      <div className="page-bg-gray">
        <EditorDashboard project={project} />
      </div>
    );
  }

  return null;
}
