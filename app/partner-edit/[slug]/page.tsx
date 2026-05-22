'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import PartnerEditorDashboard from '@/components/PartnerEditorDashboard';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import { useReportStyle } from '@/hooks/useReportStyle';
import styles from '@/app/styles/editor-states.module.css';

interface Partner {
  _id: string;
  name: string;
  viewSlug?: string;
  emoji: string;
  showEmoji?: boolean;
  logoUrl?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  styleId?: string;
  reportTemplateId?: string;
  clickerSetId?: string;
  showEventsList?: boolean; // WHAT: Controls visibility of events list on partner report page
  showEventsListTitle?: boolean; // WHAT: Controls visibility of events list title on partner report page
  showEventsListDetails?: boolean; // WHAT: Controls whether event cards show detailed info or just titles
  showOnlyTeam1Events?: boolean; // WHAT: Restrict partner report data to local-home / team-1 appearances
  createdAt: string;
  updatedAt: string;
  // WHAT: Partner-level stats for text and image content only
  // WHY: Mathematical data comes from aggregated events, only content is editable
  // HOW: Store reportText* and reportImage* fields for partner-level customization
  stats: {
    // Report content fields (editable)
    [key: string]: string | undefined;
  };
}

export default function PartnerEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const variantSlug = searchParams?.get('variant');
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);

  const loadPartnerForEditing = useCallback(async () => {
    try {
      console.log('🔍 Fetching partner for editing with slug:', slug);
      
      if (!slug) {
        console.error('❌ No slug provided to partner edit page');
        setError('Invalid edit link - missing partner identifier');
        setLoading(false);
        return;
      }
      
      const query = variantSlug ? `?variant=${encodeURIComponent(variantSlug)}` : '';
      const response = await fetch(`/api/partners/edit/${slug}${query}`, { cache: 'no-store' });
      console.log('📡 API response status:', response.status);
      
      const data = await response.json();
      console.log('📦 API response data:', data);

      if (data.success) {
        console.log('✅ Found partner for editing:', data.partner.name);
        console.log('📄 Partner data keys:', Object.keys(data.partner));
        console.log('📄 Stats keys:', Object.keys(data.partner.stats || {}));
        setPartner(data.partner);
        setLoading(false);
      } else {
        console.error('❌ API returned error:', data.error);
        setError(data.error || 'Partner not found');
        setLoading(false);
      }
    } catch (err) {
      console.error('🔥 Exception in loadPartnerForEditing:', err);
      setError('Failed to load partner for editing');
      setLoading(false);
    }
  }, [slug, variantSlug]);

  // WHAT: Apply report style colors to partner edit page
  // WHY: Partner edit pages should use same 26-color system as reports
  // HOW: useReportStyle fetches and injects CSS variables when partner has styleId
  const { loading: styleLoading } = useReportStyle({ 
    styleId: partner?.styleId ? String(partner.styleId) : null,
    enabled: !!partner // Only fetch after partner is loaded
  });

  // Check authentication on component mount
  useEffect(() => {
    if (slug) {
      const pageId = variantSlug ? `${slug}::variant=${variantSlug}` : slug;
      const authenticated = isAuthenticated(pageId, 'partner-edit');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      // Only load data if authenticated
      if (authenticated) {
        loadPartnerForEditing();
      }
    }
  }, [slug, variantSlug, loadPartnerForEditing]);

  // WHAT: Auto-reload when page becomes visible (e.g., returning from another tab)
  // WHY: Ensures partner data and page style are synced without manual refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthorized) {
        loadPartnerForEditing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthorized, loadPartnerForEditing]);

  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    // Load data after successful authentication
    loadPartnerForEditing();
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
        pageId={variantSlug ? `${slug}::variant=${variantSlug}` : slug}
        pageType="partner-edit"
        onSuccess={handleLoginSuccess}
      />
    );
  }

  /* What: Loading state while fetching partner data
     Why: Show user-friendly loading indicator with context */
  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.stateCard}>
          <div className="curve-spinner"></div>
          <p className={styles.stateMessage}>Loading partner editor...</p>
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
            The partner editing link you&apos;re trying to access might not exist or may have been removed.
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

  /* What: Main editor container with flat TailAdmin V2 design
     Why: Modern, clean layout with report style CSS variables applied via useReportStyle hook
     
     Features:
     - Flat gray background for better contrast
     - CSS variables from report style system automatically injected by useReportStyle
     - Full viewport height for immersive editing experience
     - Proper integration with PartnerEditorDashboard component */
  if (partner) {
    return (
      <div className="page-bg-gray">
        <PartnerEditorDashboard partner={partner} variantSlug={variantSlug} />
      </div>
    );
  }

  return null;
}
