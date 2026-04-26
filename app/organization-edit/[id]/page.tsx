'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import OrganizationEditorDashboard from '@/components/OrganizationEditorDashboard';
import { useReportStyle } from '@/hooks/useReportStyle';
import styles from '@/app/styles/editor-states.module.css';

/**
 * Organization Edit Page
 * WHAT: Editor for Organization-level report content
 * WHY: Superadmins need to manage high-level organization metadata
 */
export default function OrganizationEditPage() {
  const params = useParams();
  const id = params?.id as string;
  
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
      
      const response = await fetch(`/api/admin/organizations/${id}`, { cache: 'no-store' });
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
  }, [id]);

  // WHAT: Apply report style colors to editor
  const { loading: styleLoading } = useReportStyle({ 
    styleId: organization?.metadata?.styleId ? String(organization.metadata.styleId) : null,
    enabled: !!organization 
  });

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

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
        <OrganizationEditorDashboard organization={organization} />
      </div>
    );
  }

  return null;
}
