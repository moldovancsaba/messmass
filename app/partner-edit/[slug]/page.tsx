'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PartnerEditorDashboard from '@/components/PartnerEditorDashboard';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';
import styles from './page.module.css';

interface Partner {
  _id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  styleId?: string;
  reportTemplateId?: string;
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
  const slug = params?.slug as string;
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [pageStyle, setPageStyle] = useState<PageStyleEnhanced | null>(null);

  const loadPartnerForEditing = useCallback(async () => {
    try {
      console.log('🔍 Fetching partner for editing with slug:', slug);
      
      if (!slug) {
        console.error('❌ No slug provided to partner edit page');
        setError('Invalid edit link - missing partner identifier');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/partners/edit/${slug}`, { cache: 'no-store' });
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
  }, [slug]);

  // Fetch page configuration (style variables) for this editor page
  const fetchPageConfig = useCallback(async (partnerIdentifier?: string) => {
    try {
      const qs = partnerIdentifier ? `?partnerId=${encodeURIComponent(partnerIdentifier)}` : '';
      const response = await fetch(`/api/page-config${qs}`, { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setPageStyle(data.config.pageStyle);
      }
    } catch (err) {
      console.error('Failed to fetch page config for partner edit page:', err);
    }
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    if (slug) {
      const authenticated = isAuthenticated(slug, 'partner-edit');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      // Only load data if authenticated
      if (authenticated) {
        loadPartnerForEditing();
        fetchPageConfig(slug);
      }
    }
  }, [slug, fetchPageConfig, loadPartnerForEditing]);

  // WHAT: Auto-reload when page becomes visible (e.g., returning from another tab)
  // WHY: Ensures partner data and page style are synced without manual refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthorized) {
        loadPartnerForEditing();
        fetchPageConfig(slug);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthorized, loadPartnerForEditing, fetchPageConfig, slug]);

  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    // Load data after successful authentication
    loadPartnerForEditing();
    fetchPageConfig(slug);
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
     Why: Modern, clean layout with optional custom page style support
     
     Features:
     - Flat gray background for better contrast
     - Optional partner-specific gradient support
     - Full viewport height for immersive editing experience
     - Proper integration with PartnerEditorDashboard component */
  if (partner) {
    return (
      <div 
        className="page-bg-gray"
        style={(() => {
          if (!pageStyle) return undefined;
          const safeColor = (typeof pageStyle.typography?.primaryTextColor === 'string' && pageStyle.typography.primaryTextColor.trim()) ? pageStyle.typography.primaryTextColor.trim() : undefined;
          const safeFont = (typeof pageStyle.typography?.fontFamily === 'string' && pageStyle.typography.fontFamily.trim()) ? pageStyle.typography.fontFamily.trim() : undefined;
          return {
            background: generateGradientCSS(pageStyle.pageBackground),
            color: safeColor,
            fontFamily: safeFont
          };
        })()}
      >
        <PartnerEditorDashboard partner={partner} />
      </div>
    );
  }

  return null;
}