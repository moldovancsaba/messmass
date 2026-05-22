'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import OrganizationEditorDashboard from '@/components/OrganizationEditorDashboard';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import { useReportStyle } from '@/hooks/useReportStyle';
import styles from '@/app/styles/editor-states.module.css';

/**
 * Organization Edit Page
 * WHAT: Editor for Organization-level report content
 * WHY: Superadmins need to manage high-level organization metadata
 */
export default function OrganizationEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const variant = searchParams?.get('variant');

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);

  const loadOrganization = useCallback(async () => {
    try {
      if (!id) {
        setError('Missing organization identifier');
        setLoading(false);
        return;
      }
      
      const query = variant ? `?variant=${encodeURIComponent(variant)}` : '';
      const response = await fetch(`/api/organizations/edit/${id}${query}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setOrganization(data.organization);
        setLoading(false);
      } else {
        setError(data.error || 'Organization not found');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to load organization for editing');
      setLoading(false);
    }
  }, [id, variant]);

  // WHAT: Apply report style colors to editor
  const { loading: styleLoading } = useReportStyle({ 
    styleId: organization?.metadata?.styleId ? String(organization.metadata.styleId) : null,
    enabled: !!organization 
  });

  useEffect(() => {
    if (!id) {
      setCheckingAuth(false);
      return;
    }

      const authenticated = isAuthenticated(variant ? `${id}::variant=${variant}` : id, 'organization-edit');
    setIsAuthorized(authenticated);
    setCheckingAuth(false);

    if (authenticated) {
      loadOrganization();
    }
  }, [id, loadOrganization, variant]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthorized) {
        loadOrganization();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthorized, loadOrganization]);

  const handleLoginSuccess = () => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    loadOrganization();
  };

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

  if (!isAuthorized) {
    return (
      <PagePasswordLogin
        pageId={variant ? `${id}::variant=${variant}` : id}
        pageType="organization-edit"
        onSuccess={handleLoginSuccess}
        title={variant ? 'Organization Report Variant Editor Access Required' : 'Organization Editor Access Required'}
        description="This organization editor is password protected. Enter the page-specific password to continue, or access it through an authenticated admin session."
      />
    );
  }

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.stateCard}>
          <div className="curve-spinner"></div>
          <p className={styles.stateMessage}>Loading organization editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centerContainerColumn}>
        <div className={styles.errorCard}>
          <h1 className={styles.errorHeading}>❌ Access Error</h1>
          <p className={styles.errorTextPrimary}>{error}</p>
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

  if (organization) {
    return (
      <div className="page-bg-gray">
        <OrganizationEditorDashboard organization={organization} variantSlug={variant} />
      </div>
    );
  }

  return null;
}
