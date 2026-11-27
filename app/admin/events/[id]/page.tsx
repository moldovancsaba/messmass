'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import MaterialIcon from '@/components/MaterialIcon';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import EntityWorkspaceTabs from '@/components/admin/EntityWorkspaceTabs';
import WorkspaceHeader from '@/components/admin/WorkspaceHeader';
import StatsStrip from '@/components/admin/StatsStrip';
import styles from './EventDetail.module.css';

interface PartnerBrief {
  _id?: string;
  name?: string;
  emoji?: string;
  logoUrl?: string;
}

interface EventProject {
  _id: string;
  eventName: string;
  eventDate: string;
  location?: string;
  hashtags?: string[];
  categorizedHashtags?: Record<string, string[]>;
  stats?: Record<string, number | undefined>;
  viewSlug?: string;
  editSlug?: string;
  partner1Id?: string;
  partner2Id?: string;
  partner1?: PartnerBrief;
  partner2?: PartnerBrief;
  organizationId?: string | null;
  organization?: { _id?: string; name?: string; slug?: string; logoUrl?: string };
  competitionType?: string | null;
  externalRefs?: {
    camera?: {
      eventId?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { user, loading: authLoading } = useAdminAuth();

  const [project, setProject] = useState<EventProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/projects?projectId=${id}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);

      if (data?.success && data?.project) {
        setProject(data.project);
        return;
      }

      const directRes = await fetch(`/api/projects/${id}?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const directData = await directRes.json().catch(() => null);

      if (directData?.success && directData?.project) {
        setProject(directData.project);
        return;
      }

      setError(data?.error || directData?.error || 'Event not found');
    } catch (err) {
      console.error('Failed to load event details:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && user) {
      void fetchEvent();
    }
  }, [authLoading, user, fetchEvent]);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  if (authLoading || (loading && !error)) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingCard}>
          <MaterialIcon name="hourglass_empty" className={styles.spinner} />
          <p className={styles.loadingText}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <MaterialIcon name="error_outline" className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>Event Not Found</h2>
          <p className={styles.errorText}>
            {error || `No event matches identifier "${id}". It may have been deleted or moved.`}
          </p>
          <Link href="/admin/events" className={styles.backButton}>
            <MaterialIcon name="arrow_back" />
            <span>Return to Events List</span>
          </Link>
        </div>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const reportUrl = `${origin}/report/${project.viewSlug || project._id}`;
  const editUrl = `${origin}/edit/${project.editSlug || project._id}`;
  const cameraEventId = project.externalRefs?.camera?.eventId;
  const cameraBase = (process.env.NEXT_PUBLIC_CAMERA_BASE_URL || 'https://camera.messmass.com').replace(/\/$/, '');

  const stats = project.stats || {};
  const totalFans = stats.totalFans ?? stats.fans ?? 0;
  const totalPhotos = stats.images ?? stats.allImages ?? stats.photoResultsReceived ?? 0;
  const femalePct = stats.female ?? 0;
  const malePct = stats.male ?? 0;

  return (
    <div className={styles.container}>
      <EntityWorkspaceTabs
        ariaLabel="Event workspace navigation"
        backHref="/admin/events"
        backLabel="Events"
        tabs={[
          { label: 'Overview', href: `/admin/events/${project._id}`, icon: 'event' },
          { label: 'Setup & Edit', href: `/admin/events/${project._id}/edit`, icon: 'settings' },
          { label: 'Metrics Table', href: `/admin/events/${project._id}/kyc-data`, icon: 'table_chart' },
          { label: 'AI Photo Proof', href: `/admin/analytics/ai/${project._id}`, icon: 'smart_toy' },
          { label: 'Stats Recorder', href: `/edit/${project.editSlug || project._id}`, icon: 'edit', external: true },
          { label: 'Classic Report', href: `/report/${project.viewSlug || project._id}`, icon: 'bar_chart', external: true },
          { label: 'AI Dashboard', href: `/interactive-report/event/${project.viewSlug || project._id}`, icon: 'insights', external: true },
        ]}
      />

      <WorkspaceHeader
        eyebrow={project.eventDate ? new Date(project.eventDate).toLocaleDateString() : 'Date TBD'}
        title={project.eventName}
        subtitle={`Event ID: ${project._id}${project.location ? ` • ${project.location}` : ''}`}
        logoUrl={project.partner1?.logoUrl || project.organization?.logoUrl || null}
        emoji={project.partner1?.emoji || '🏟️'}
        status="active"
        secondaryActions={
          <>
            <a
              href={`/edit/${project.editSlug || project._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtnSecondary}
            >
              <MaterialIcon name="bar_chart" />
              <span>Open Stats Recorder</span>
            </a>
            <a
              href={`/report/${project.viewSlug || project._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtnSecondary}
            >
              <MaterialIcon name="visibility" />
              <span>Classic Report</span>
            </a>
            {cameraEventId && (
              <a
                href={`${cameraBase}/admin/vetting?eventId=${encodeURIComponent(cameraEventId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionBtnSecondary}
              >
                <MaterialIcon name="photo_camera" />
                <span>Open in Camera</span>
              </a>
            )}
          </>
        }
        primaryAction={
          <Link href={`/admin/events/${project._id}/edit`} className={styles.actionBtnPrimary}>
            <MaterialIcon name="settings" />
            <span>Edit Event Settings</span>
          </Link>
        }
      />

      <StatsStrip
        ariaLabel="Event KPI summary"
        items={[
          { label: 'Total Fans', value: Number(totalFans) || 0, icon: 'groups' },
          { label: 'Total Photos', value: Number(totalPhotos) || 0, icon: 'photo_library' },
          { label: 'Female Ratio', value: `${femalePct}%`, icon: 'pie_chart' },
          { label: 'Male Ratio', value: `${malePct}%`, icon: 'pie_chart' },
        ]}
      />

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <MaterialIcon name="group" />
              <span>Participating Clubs &amp; Tags</span>
            </h2>
            <Link href={`/admin/events/${project._id}/edit`} className={styles.orgLink}>
              <MaterialIcon name="edit" />
              <span>Edit Teams</span>
            </Link>
          </div>

          <div className={styles.partnerStack}>
            {project.partner1 && (
              <div className={styles.partnerBox}>
                <span className={styles.partnerEmoji}>{project.partner1.emoji || '⚽'}</span>
                <div className={styles.partnerInfo}>
                  {project.partner1._id || project.partner1Id ? (
                    <Link
                      href={`/admin/partners/${project.partner1._id || project.partner1Id}`}
                      className={styles.partnerName}
                    >
                      {project.partner1.name}
                    </Link>
                  ) : (
                    <span className={styles.partnerName}>{project.partner1.name}</span>
                  )}
                  <span className={styles.partnerRole}>Home / Organizer</span>
                </div>
              </div>
            )}

            {project.partner2 && (
              <div className={styles.partnerBox}>
                <span className={styles.partnerEmoji}>{project.partner2.emoji || '⚽'}</span>
                <div className={styles.partnerInfo}>
                  {project.partner2._id || project.partner2Id ? (
                    <Link
                      href={`/admin/partners/${project.partner2._id || project.partner2Id}`}
                      className={styles.partnerName}
                    >
                      {project.partner2.name}
                    </Link>
                  ) : (
                    <span className={styles.partnerName}>{project.partner2.name}</span>
                  )}
                  <span className={styles.partnerRole}>Away / Opponent</span>
                </div>
              </div>
            )}

            {!project.partner1 && !project.partner2 && (
              <p className={styles.emptyText}>No clubs linked to this event yet.</p>
            )}
          </div>

          <div className={styles.hashtagsStack}>
            <span className={styles.subheading}>Hashtags</span>
            {project.hashtags && project.hashtags.length > 0 ? (
              <div className={styles.hashtagsList}>
                {project.hashtags.map((tag) => (
                  <ColoredHashtagBubble key={tag} hashtag={tag} small />
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No hashtags assigned</p>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <MaterialIcon name="account_tree" />
              <span>Organization &amp; Competition</span>
            </h2>
          </div>

          <div className={styles.partnerStack}>
            {project.organization ? (
              <div className={styles.partnerBox}>
                <span className={styles.partnerEmoji}>🏆</span>
                <div className={styles.partnerInfo}>
                  {project.organization._id || project.organizationId ? (
                    <Link
                      href={`/admin/organizations/${project.organization._id || project.organizationId}`}
                      className={styles.partnerName}
                    >
                      {project.organization.name}
                    </Link>
                  ) : (
                    <span className={styles.partnerName}>{project.organization.name}</span>
                  )}
                  <span className={styles.partnerRole}>
                    {project.competitionType
                      ? `Competition: ${project.competitionType.replace('_', ' ').toUpperCase()}`
                      : 'Governing Federation / Organization'}
                  </span>
                </div>
                {project.organization.slug && (
                  <Link
                    href={`/interactive-report/organization/${project.organization.slug}`}
                    target="_blank"
                    className={styles.orgLink}
                  >
                    AI Report ↗
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.partnerBox}>
                <span className={styles.partnerEmoji}>🏟️</span>
                <div className={styles.partnerInfo}>
                  <span className={styles.partnerName}>Standalone Partner Game</span>
                  <span className={styles.partnerRole}>Not assigned to a governing federation</span>
                </div>
              </div>
            )}
            <div className={styles.orgFooter}>
              <Link href={`/admin/events/${project._id}/edit`} className={styles.orgLink}>
                <MaterialIcon name="settings" />
                <span>Configure Hierarchy &amp; Competition</span>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <MaterialIcon name="share" />
              <span>Direct Share &amp; Recorder Links</span>
            </h2>
          </div>

          <div className={styles.partnerStack}>
            <div className={styles.linkBox}>
              <div className={styles.linkHeader}>
                <span className={styles.linkName}>Public Classic Report URL</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(reportUrl, 'report')}
                  className={styles.copyBtn}
                >
                  {copiedKey === 'report' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <span className={styles.linkValue}>{reportUrl}</span>
            </div>

            <div className={styles.linkBox}>
              <div className={styles.linkHeader}>
                <span className={styles.linkName}>Matchday Stats Recorder URL</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(editUrl, 'edit')}
                  className={styles.copyBtn}
                >
                  {copiedKey === 'edit' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <span className={styles.linkValue}>{editUrl}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
