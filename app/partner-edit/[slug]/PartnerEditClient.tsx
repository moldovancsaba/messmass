'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  showEventsList?: boolean;
  showEventsListTitle?: boolean;
  showEventsListDetails?: boolean;
  showOnlyTeam1Events?: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    [key: string]: string | undefined;
  };
}

interface PartnerEditClientProps {
  slug: string;
  variantSlug?: string | null;
}

export default function PartnerEditClient({ slug, variantSlug }: PartnerEditClientProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);

  const loadPartnerForEditing = useCallback(async () => {
    try {
      if (!slug) {
        setError('Invalid edit link - missing partner identifier');
        setLoading(false);
        return;
      }

      const query = variantSlug ? `?variant=${encodeURIComponent(variantSlug)}` : '';
      const response = await fetch(`/api/partners/edit/${slug}${query}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setPartner(data.partner);
        setLoading(false);
      } else {
        setError(data.error || 'Partner not found');
        setLoading(false);
      }
    } catch {
      setError('Failed to load partner for editing');
      setLoading(false);
    }
  }, [slug, variantSlug]);

  const { loading: styleLoading } = useReportStyle({
    styleId: partner?.styleId ? String(partner.styleId) : null,
    enabled: !!partner
  });

  useEffect(() => {
    if (slug) {
      const pageId = variantSlug ? `${slug}::variant=${variantSlug}` : slug;
      const authenticated = isAuthenticated(pageId, 'partner-edit');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);

      if (authenticated) {
        loadPartnerForEditing();
      }
    }
  }, [slug, variantSlug, loadPartnerForEditing]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthorized) {
        loadPartnerForEditing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthorized, loadPartnerForEditing]);

  const handleLoginSuccess = () => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    loadPartnerForEditing();
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
        pageId={variantSlug ? `${slug}::variant=${variantSlug}` : slug}
        pageType="partner-edit"
        onSuccess={handleLoginSuccess}
      />
    );
  }

  if (loading || styleLoading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.stateCard}>
          <div className="curve-spinner"></div>
          <p className={styles.stateMessage}>Loading partner editor...</p>
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

  if (partner) {
    return (
      <div className="page-bg-gray">
        <PartnerEditorDashboard partner={partner} variantSlug={variantSlug} />
      </div>
    );
  }

  return null;
}
