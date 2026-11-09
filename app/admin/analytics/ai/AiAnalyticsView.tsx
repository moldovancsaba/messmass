'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';
import styles from './AiAnalyticsView.module.css';

interface AiPhotoEvent {
  eventId: string;
  eventName: string;
  eventDate: string | null;
  sources?: string[];
  photoResultsReceived: number;
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
  const events = data?.events || [];
  const sourceCounts = data?.sourceCounts;

  return (
    <div className={styles.wrapper}>
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

      <AnalyticsSectionCard title="Events" subtitle={`Events with at least one stored Fanmass photo result (${events.length})`} actions={<button type="button" className="btn btn-secondary" onClick={() => void load()}>Refresh</button>}>
        {events.length === 0 ? (
          <p className={styles.note}>No completed photo results are stored yet for the selected source.</p>
        ) : (
          <div className={styles.eventGrid}>
            {events.map((event) => (
              <article className={styles.eventCard} key={event.eventId}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.eventTitle}>
                    <Link href={`/admin/analytics/ai/${event.eventId}`}>{event.eventName}</Link>
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
                <p className={styles.eventDate}>{event.eventDate || 'Event date not set'}</p>
                <dl className={styles.eventMetrics}>
                  <div><dt>Photo results received</dt><dd>{event.photoResultsReceived.toLocaleString()}</dd></div>
                  <div><dt>People model estimate (summed)</dt><dd>{event.peopleDetections.toLocaleString()}</dd></div>
                  <div><dt>Person boxes</dt><dd>{event.personBoxes.toLocaleString()}</dd></div>
                  <div><dt>Face boxes</dt><dd>{event.faceBoxes.toLocaleString()}</dd></div>
                  <div><dt>Brand appearances</dt><dd>{event.brandAppearances.toLocaleString()}</dd></div>
                  <div><dt>Club appearances</dt><dd>{event.clubAppearances.toLocaleString()}</dd></div>
                  <div><dt>Merchandise detections</dt><dd>{event.merchandiseDetections.toLocaleString()}</dd></div>
                  <div><dt>Photos flagged for review</dt><dd>{event.moderationFlaggedPhotos} / {event.moderationPhotosReviewed}</dd></div>
                </dl>
                <p className={styles.eventDate}>Latest analyzed photo: {formatDate(event.lastAnalyzedAt)}</p>
                <Link className={styles.eventReportLink} href={`/admin/analytics/ai/${event.eventId}`}>Open photo results</Link>
              </article>
            ))}
          </div>
        )}
      </AnalyticsSectionCard>
    </div>
  );
}
