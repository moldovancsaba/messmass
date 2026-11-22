'use client';
/* eslint-disable @next/next/no-img-element -- preview thumbnails come from content-addressed R2 URLs */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';
import styles from './AiAnalyticsView.module.css';

interface AiPartnerSummary {
  id: string;
  name: string;
  emoji?: string;
  viewSlug?: string;
  eventCount?: number;
}

interface AiOrganizationSummary {
  id: string;
  name: string;
  slug?: string;
}

interface SzrtCampaignProgressSummary {
  status: string;
  processedCount: number;
  totalImages: number;
  peopleDetected: number;
  provenBrands: number;
  provenClubs: number;
  drivePhotosPlaced: number;
  eventsWithDrivePhotos: number;
  updatedAt: string | null;
}

interface AiPhotoEvent {
  eventId: string;
  eventName: string;
  eventDate: string | null;
  viewSlug?: string | null;
  partners?: AiPartnerSummary[];
  organization?: AiOrganizationSummary | null;
  previewUrls?: string[];
  sources?: string[];
  photoResultsReceived: number;
  drivePhotosPlaced?: number;
  peopleDetections: number;
  personBoxes: number;
  faceBoxes: number;
  brandAppearances: number;
  clubAppearances: number;
  merchandiseDetections: number;
  moderationPhotosReviewed: number;
  moderationFlaggedPhotos: number;
  lastAnalyzedAt: string | null;
}

interface Totals {
  eventsWithResults: number;
  photoResultsReceived: number;
  peopleDetections: number;
  personBoxes: number;
  faceBoxes: number;
  brandAppearances: number;
  clubAppearances: number;
  merchandiseDetections: number;
  moderationPhotosReviewed: number;
  moderationFlaggedPhotos: number;
}

interface SourceCounts {
  all: number;
  camera: number;
  local_storage: number;
}

interface ResponseData {
  events: AiPhotoEvent[];
  total: number;
  totals: Totals;
  sourceCounts?: SourceCounts;
  partners?: AiPartnerSummary[];
  organizations?: AiOrganizationSummary[];
  szrtProgress?: SzrtCampaignProgressSummary | null;
}

const EMPTY_TOTALS: Totals = {
  eventsWithResults: 0,
  photoResultsReceived: 0,
  peopleDetections: 0,
  personBoxes: 0,
  faceBoxes: 0,
  brandAppearances: 0,
  clubAppearances: 0,
  merchandiseDetections: 0,
  moderationPhotosReviewed: 0,
  moderationFlaggedPhotos: 0,
};

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function AiAnalyticsView() {
  const [data, setData] = useState<ResponseData | null>(null);
  const [selectedSource, setSelectedSource] = useState<'all' | 'camera' | 'local_storage'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithImages, setOnlyWithImages] = useState(true);
  const [onlyWithPreviews, setOnlyWithPreviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (sourceFilter = selectedSource) => {
    setLoading(true);
    setError('');
    setUnauthenticated(false);
    try {
      const sourceQuery = sourceFilter !== 'all' ? `&source=${sourceFilter}` : '';
      const response = await fetch(`/api/analytics/ai/events?limit=500${sourceQuery}`, { cache: 'no-store' });
      if (response.status === 401) {
        setUnauthenticated(true);
        return;
      }
      if (!response.ok) throw new Error('The per-photo analytics could not be loaded.');
      const body = await response.json();
      setData(body.data || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The per-photo analytics could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [selectedSource]);

  useEffect(() => { void load(selectedSource); }, [load, selectedSource]);

  const events = useMemo(() => data?.events || [], [data]);
  const visibleEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((event) => {
      if (onlyWithImages && event.photoResultsReceived <= 0 && (event.drivePhotosPlaced ?? 0) <= 0) return false;
      if (onlyWithPreviews && (!event.previewUrls || event.previewUrls.length === 0)) return false;
      if (!q) return true;
      const partnerMatch = (event.partners || []).some((p) => p.name.toLowerCase().includes(q));
      const orgMatch = event.organization?.name?.toLowerCase().includes(q) ?? false;
      return event.eventName.toLowerCase().includes(q) || partnerMatch || orgMatch;
    });
  }, [events, onlyWithImages, onlyWithPreviews, searchQuery]);

  if (loading && !data) {
    return <AnalyticsStatePanel variant="loading" title="Loading photo results" description="Reading completed one-photo analyses stored by Messmass." />;
  }
  if (unauthenticated) {
    return <AnalyticsStatePanel variant="empty" title="Sign in to view photo results" description="This workspace requires an administrator account." />;
  }
  if (error && !data) {
    return <AnalyticsStatePanel variant="error" title="Could not load photo results" description={error} action={<button type="button" className="btn btn-secondary" onClick={() => void load()}>Retry</button>} />;
  }

  const totals = data?.totals || EMPTY_TOTALS;
  const sourceCounts = data?.sourceCounts;
  const partners = data?.partners || [];
  const organizations = data?.organizations || [];

  return (
    <div className={styles.wrapper}>
      <AnalyticsSectionCard
        title="AI Reports & Entity Navigation"
        subtitle="Jump directly to the Global AI Report, partner/organization reports, or visual proof review."
      >
        <div className={styles.hubActions}>
          <Link href="/interactive-report/global" className={`${styles.hubLink} ${styles.hubLinkPrimary}`}>
            🌍 Global AI Report
          </Link>
          <Link href="/admin/global/reports" className={styles.hubLink}>
            ⚙️ Global Report Sharing
          </Link>
          <Link href="/admin/fanmass-evidence" className={styles.hubLink}>
            🔍 Fanmass Proof Review
          </Link>
          <Link href="/admin/partners" className={styles.hubLink}>
            🤝 Partners ({partners.length})
          </Link>
          <Link href="/admin/organizations" className={styles.hubLink}>
            🏛️ Organizations ({organizations.length})
          </Link>
          <Link href="/admin/club-clusters" className={styles.hubLink}>
            🏟️ Club Clusters
          </Link>
        </div>

        {(partners.length > 0 || organizations.length > 0) && (
          <div className={styles.partnerDirectory}>
            {organizations.map((org) => (
              <Link
                key={`org-${org.id}`}
                href={`/interactive-report/organization/${encodeURIComponent(org.slug || org.id)}`}
                className={styles.partnerChip}
                title={`Open ${org.name} Organization Report`}
              >
                🏛️ {org.name}
              </Link>
            ))}
            {partners.slice(0, 16).map((partner) => (
              <Link
                key={`partner-${partner.id}`}
                href={`/interactive-report/partner/${encodeURIComponent(partner.viewSlug || partner.id)}`}
                className={styles.partnerChip}
                title={`Open ${partner.name} Partner Interactive Report`}
              >
                {partner.emoji || '🤝'} {partner.name} ({partner.eventCount ?? 0})
              </Link>
            ))}
          </div>
        )}
      </AnalyticsSectionCard>
      <AnalyticsSectionCard title="Fanmass photo results stored by Messmass" subtitle="Counts are summed from completed, non-deleted, one-photo result records.">
        <div className={styles.filterPills}>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedSource === 'all' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedSource('all')}
          >
            All Ingestion Sources ({sourceCounts ? sourceCounts.all.toLocaleString() : totals.photoResultsReceived.toLocaleString()})
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedSource === 'camera' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedSource('camera')}
          >
            Live Camera Streams ({sourceCounts ? sourceCounts.camera.toLocaleString() : 0})
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedSource === 'local_storage' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedSource('local_storage')}
          >
            Local Machine Storage ({sourceCounts ? sourceCounts.local_storage.toLocaleString() : 0})
          </button>
        </div>
        <dl className={styles.metricsGrid}>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Events with results</dt><dd className={styles.coverageValue}>{totals.eventsWithResults}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Photo results received</dt><dd className={styles.coverageValue}>{totals.photoResultsReceived.toLocaleString()}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>People model estimates (summed)</dt><dd className={styles.coverageValue}>{totals.peopleDetections.toLocaleString()}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Person boxes</dt><dd className={styles.coverageValue}>{totals.personBoxes.toLocaleString()}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Face boxes</dt><dd className={styles.coverageValue}>{totals.faceBoxes.toLocaleString()}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Brand appearances</dt><dd className={styles.coverageValue}>{totals.brandAppearances.toLocaleString()}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Club appearances</dt><dd className={styles.coverageValue}>{totals.clubAppearances.toLocaleString()}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Merchandise detections</dt><dd className={styles.coverageValue}>{totals.merchandiseDetections.toLocaleString()}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Photos with content checks</dt><dd className={styles.coverageValue}>{totals.moderationPhotosReviewed.toLocaleString()}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Photos flagged for review</dt><dd className={styles.coverageValue}>{totals.moderationFlaggedPhotos.toLocaleString()}</dd></div>
        </dl>
        <p className={styles.note}>
          People model estimates are photo-level summed estimates, distinct from bounding boxes and unique attendee counts. The result count is how many analyses Messmass received; it is not the number of eligible Camera photos and does not imply event completion.
        </p>
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Events" subtitle={`Showing ${visibleEvents.length} of ${events.length} events with Fanmass photo results`} actions={<button type="button" className="btn btn-secondary" onClick={() => void load()}>Refresh</button>}>
        <div className={styles.eventToolbar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filter by event, partner, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              className={styles.filterCheckbox}
              checked={onlyWithImages}
              onChange={(e) => setOnlyWithImages(e.target.checked)}
            />
            Hide 0-photo reports
          </label>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              className={styles.filterCheckbox}
              checked={onlyWithPreviews}
              onChange={(e) => setOnlyWithPreviews(e.target.checked)}
            />
            Only with preview thumbnails
          </label>
        </div>
        {visibleEvents.length === 0 ? (
          <p className={styles.note}>No completed photo results match the current filter.</p>
        ) : (
          <div className={styles.eventGrid}>
            {visibleEvents.map((event) => (
              <article className={styles.eventCard} key={event.eventId}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.eventTitle}>
                    <Link href={`/interactive-report/event/${encodeURIComponent(event.viewSlug || event.eventId)}`}>{event.eventName}</Link>
                  </h3>
                  <div className={styles.badgeGroup}>
                    {event.sources?.includes('camera') && (
                      <span className={`${styles.sourceBadge} ${styles.sourceBadgeCamera}`}>Camera</span>
                    )}
                    {event.sources?.includes('local_storage') && (
                      <span className={`${styles.sourceBadge} ${styles.sourceBadgeStorage}`}>Local Storage</span>
                    )}
                  </div>
                </div>
                {(event.organization || (event.partners && event.partners.length > 0)) && (
                  <div className={styles.entityBadges}>
                    {event.organization && (
                      <Link
                        href={`/interactive-report/organization/${encodeURIComponent(event.organization.slug || event.organization.id)}`}
                        className={styles.partnerChip}
                      >
                        🏛️ {event.organization.name}
                      </Link>
                    )}
                    {(event.partners || []).map((partner) => (
                      <Link
                        key={partner.id}
                        href={`/interactive-report/partner/${encodeURIComponent(partner.viewSlug || partner.id)}`}
                        className={styles.partnerChip}
                      >
                        {partner.emoji || '🤝'} {partner.name}
                      </Link>
                    ))}
                  </div>
                )}
                {event.previewUrls && event.previewUrls.length > 0 && (
                  <div className={styles.previewStrip}>
                    {event.previewUrls.map((url) => (
                      <img key={url} src={url} alt={`Preview for ${event.eventName}`} className={styles.previewThumb} loading="lazy" />
                    ))}
                  </div>
                )}
                <p className={styles.eventDate}>{event.eventDate || 'Event date not set'}</p>
                <dl className={styles.eventMetrics}>
                  <div><dt>Photo results received</dt><dd>{event.photoResultsReceived.toLocaleString()}</dd></div>
                  {event.drivePhotosPlaced !== undefined && (
                    <div><dt>Drive photos placed</dt><dd>{event.drivePhotosPlaced.toLocaleString()}</dd></div>
                  )}
                  <div><dt>People model estimate (summed)</dt><dd>{event.peopleDetections.toLocaleString()}</dd></div>
                  <div><dt>Person boxes</dt><dd>{event.personBoxes.toLocaleString()}</dd></div>
                  <div><dt>Face boxes</dt><dd>{event.faceBoxes.toLocaleString()}</dd></div>
                  <div><dt>Brand appearances</dt><dd>{event.brandAppearances.toLocaleString()}</dd></div>
                  <div><dt>Club appearances</dt><dd>{event.clubAppearances.toLocaleString()}</dd></div>
                  <div><dt>Merchandise detections</dt><dd>{event.merchandiseDetections.toLocaleString()}</dd></div>
                  <div><dt>Photos flagged for review</dt><dd>{event.moderationFlaggedPhotos} / {event.moderationPhotosReviewed}</dd></div>
                </dl>
                <p className={styles.eventDate}>Latest analyzed photo: {formatDate(event.lastAnalyzedAt)}</p>
                <div className={styles.cardActions}>
                  <Link className={styles.eventReportLink} href={`/interactive-report/event/${encodeURIComponent(event.viewSlug || event.eventId)}`}>
                    ⚡ Interactive Report
                  </Link>
                  <Link className={styles.eventReportLink} href={`/admin/events/${event.eventId}/reports`}>
                    📄 Reports Workspace
                  </Link>
                  <Link className={styles.eventReportLink} href={`/admin/analytics/ai/${event.eventId}`}>
                    📊 Photo Results
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </AnalyticsSectionCard>
    </div>
  );
}
