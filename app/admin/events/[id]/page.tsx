'use client';

/**
 * Event Detail / Hub Page
 * 
 * WHAT: Detail and workspace hub for an individual event (/admin/events/[id])
 * WHY: Provides single-event overview, key statistics, and direct links to editor,
 *      public report, AI photo analysis, and KYC data table. Resolves deep-links
 *      from the header notification dropdown and direct bookmark URLs.
 * 
 * Route: /admin/events/[id]
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import MaterialIcon from '@/components/MaterialIcon';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
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
  hashtags?: string[];
  categorizedHashtags?: Record<string, string[]>;
  stats?: Record<string, number | undefined>;
  viewSlug?: string;
  editSlug?: string;
  partner1Id?: string;
  partner2Id?: string;
  partner1?: PartnerBrief;
  partner2?: PartnerBrief;
  createdAt?: string;
  updatedAt?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
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

      // Try single-project query endpoint first
      const res = await fetch(`/api/projects?projectId=${id}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json().catch(() => null);

      if (data?.success && data?.project) {
        setProject(data.project);
        return;
      }

      // Fallback to /api/projects/[id]
      const directRes = await fetch(`/api/projects/${id}?_t=${Date.now()}`, {
        cache: 'no-store'
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
      fetchEvent();
    }
  }, [authLoading, user, fetchEvent]);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
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

  const stats = project.stats || {};
  const totalFans = stats.totalFans ?? stats.fans ?? 0;
  const totalPhotos = stats.images ?? stats.allImages ?? stats.photoResultsReceived ?? 0;
  const femalePct = stats.female ?? 0;
  const malePct = stats.male ?? 0;

  return (
    <div className={styles.container}>
      {/* Header Hub Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <Link href="/admin/events" className={styles.backButton}>
            <MaterialIcon name="arrow_back" />
            <span>Back to Events</span>
          </Link>
          <div className={styles.badge}>
            <MaterialIcon name="event" />
            <span>Active Event</span>
          </div>
        </div>

        <div className={styles.titleArea}>
          <h1 className={styles.title}>{project.eventName}</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <MaterialIcon name="calendar_today" />
              <span>{project.eventDate ? new Date(project.eventDate).toLocaleDateString() : 'Date TBD'}</span>
            </span>
            <span className={styles.metaItem}>
              <MaterialIcon name="fingerprint" />
              <span>ID: {project._id}</span>
            </span>
          </div>
        </div>

        {/* Primary Workspace Quick Actions */}
        <div className={styles.actionsBar}>
          <a
            href={`/edit/${project.editSlug || project._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionBtnPrimary}
          >
            <MaterialIcon name="edit" />
            <span>Open Event Editor</span>
          </a>

          <a
            href={`/report/${project.viewSlug || project._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionBtnSecondary}
          >
            <MaterialIcon name="bar_chart" />
            <span>View Public Report</span>
          </a>

          <Link
            href={`/admin/events/${project._id}/kyc-data`}
            className={styles.actionBtnSecondary}
          >
            <MaterialIcon name="table_chart" />
            <span>KYC Data Table</span>
          </Link>

          <Link
            href={`/admin/analytics/ai/${project._id}`}
            className={styles.actionBtnSecondary}
          >
            <MaterialIcon name="smart_toy" />
            <span>AI Photo Analytics</span>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Card: Key Metrics */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <MaterialIcon name="analytics" />
              <span>Key Metrics</span>
            </h2>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{Number(totalFans).toLocaleString()}</span>
              <span className={styles.statLabel}>Total Fans</span>
            </div>

            <div className={styles.statBox}>
              <span className={styles.statValue}>{Number(totalPhotos).toLocaleString()}</span>
              <span className={styles.statLabel}>Total Photos</span>
            </div>

            <div className={styles.statBox}>
              <span className={styles.statValue}>{femalePct}%</span>
              <span className={styles.statLabel}>Female Ratio</span>
            </div>

            <div className={styles.statBox}>
              <span className={styles.statValue}>{malePct}%</span>
              <span className={styles.statLabel}>Male Ratio</span>
            </div>
          </div>
        </div>

        {/* Card: Partners & Hashtags */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <MaterialIcon name="group" />
              <span>Partners & Tags</span>
            </h2>
          </div>

          <div className={styles.partnerStack}>
            {project.partner1 && (
              <div className={styles.partnerBox}>
                <span className={styles.partnerEmoji}>{project.partner1.emoji || '⚽'}</span>
                <div className={styles.partnerInfo}>
                  <span className={styles.partnerName}>{project.partner1.name}</span>
                  <span className={styles.partnerRole}>Home / Organizer</span>
                </div>
              </div>
            )}

            {project.partner2 && (
              <div className={styles.partnerBox}>
                <span className={styles.partnerEmoji}>{project.partner2.emoji || '⚽'}</span>
                <div className={styles.partnerInfo}>
                  <span className={styles.partnerName}>{project.partner2.name}</span>
                  <span className={styles.partnerRole}>Away / Opponent</span>
                </div>
              </div>
            )}

            {!project.partner1 && !project.partner2 && (
              <p className={styles.emptyText}>No partners linked to this event</p>
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

        {/* Card: Direct Share Links */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <MaterialIcon name="share" />
              <span>Direct Links</span>
            </h2>
          </div>

          <div className={styles.partnerStack}>
            <div className={styles.linkBox}>
              <div className={styles.linkHeader}>
                <span className={styles.linkName}>Public Report URL</span>
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
                <span className={styles.linkName}>Private Editor URL</span>
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
