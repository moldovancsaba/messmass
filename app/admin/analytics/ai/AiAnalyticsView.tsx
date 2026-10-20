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

interface ResponseData {
  events: AiPhotoEvent[];
  total: number;
  totals: Totals;
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
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setUnauthenticated(false);
    try {
      const response = await fetch('/api/analytics/ai/events?limit=500', { cache: 'no-store' });
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
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <AnalyticsStatePanel variant="loading" title="Loading photo results" description="Reading completed one-photo analyses stored by Messmass." />;
  }
  if (unauthenticated) {
    return <AnalyticsStatePanel variant="empty" title="Sign in to view photo results" description="This workspace requires an administrator account." />;
  }
  if (error) {
    return <AnalyticsStatePanel variant="error" title="Could not load photo results" description={error} action={<button type="button" className="btn btn-secondary" onClick={() => void load()}>Retry</button>} />;
  }

  const totals = data?.totals || EMPTY_TOTALS;
  const events = data?.events || [];

  return (
    <div className={styles.wrapper}>
      <AnalyticsSectionCard title="Fanmass photo results stored by Messmass" subtitle="Counts are summed from completed, non-deleted, one-photo result records.">
        <dl className={styles.metricsGrid}>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Events with results</dt><dd className={styles.coverageValue}>{totals.eventsWithResults}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Photo results received</dt><dd className={styles.coverageValue}>{totals.photoResultsReceived}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>People detections</dt><dd className={styles.coverageValue}>{totals.peopleDetections}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Person boxes</dt><dd className={styles.coverageValue}>{totals.personBoxes}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Face boxes</dt><dd className={styles.coverageValue}>{totals.faceBoxes}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Brand appearances</dt><dd className={styles.coverageValue}>{totals.brandAppearances}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Club appearances</dt><dd className={styles.coverageValue}>{totals.clubAppearances}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Merchandise detections</dt><dd className={styles.coverageValue}>{totals.merchandiseDetections}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Photos with content checks</dt><dd className={styles.coverageValue}>{totals.moderationPhotosReviewed}</dd></div>
          <div className={styles.coverageItem}><dt className={styles.coverageLabel}>Photos flagged for review</dt><dd className={styles.coverageValue}>{totals.moderationFlaggedPhotos}</dd></div>
        </dl>
        <p className={styles.note}>
          People detections are photo-level detections, not unique attendees. The result count is how many analyses Messmass received; it is not the number of eligible Camera photos and does not imply event completion.
        </p>
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Events" subtitle="Events with at least one stored Fanmass photo result" actions={<button type="button" className="btn btn-secondary" onClick={() => void load()}>Refresh</button>}>
        {events.length === 0 ? (
          <p className={styles.note}>No completed photo results are stored yet.</p>
        ) : (
          <div className={styles.eventGrid}>
            {events.map((event) => (
              <article className={styles.eventCard} key={event.eventId}>
                <h3 className={styles.eventTitle}>
                  <Link href={`/admin/analytics/ai/${event.eventId}`}>{event.eventName}</Link>
                </h3>
                <p className={styles.eventDate}>{event.eventDate || 'Event date not set'}</p>
                <dl className={styles.eventMetrics}>
                  <div><dt>Photo results received</dt><dd>{event.photoResultsReceived}</dd></div>
                  <div><dt>People detections</dt><dd>{event.peopleDetections}</dd></div>
                  <div><dt>Person boxes</dt><dd>{event.personBoxes}</dd></div>
                  <div><dt>Face boxes</dt><dd>{event.faceBoxes}</dd></div>
                  <div><dt>Brand appearances</dt><dd>{event.brandAppearances}</dd></div>
                  <div><dt>Club appearances</dt><dd>{event.clubAppearances}</dd></div>
                  <div><dt>Merchandise detections</dt><dd>{event.merchandiseDetections}</dd></div>
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
