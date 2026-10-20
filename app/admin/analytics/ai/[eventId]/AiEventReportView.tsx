'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';
import styles from './AiEventReport.module.css';

type Counts = Record<string, number>;
interface Mention { name: string; count: number }
interface Moderation {
  status?: string;
  flagged?: boolean;
  severity?: string;
  flags?: string[];
}
interface PhotoResult {
  cameraPhotoId: string;
  analyzedAt: string | null;
  summary: {
    peopleCounts?: { measured?: number };
    brandMentions?: Mention[];
    clubMentions?: Mention[];
    merchandiseCounts?: Counts;
    genderProjection?: Counts;
    ageProjection?: Counts;
    emotionProjection?: Counts;
    accessoryProjection?: Counts;
    moderation?: Moderation;
  };
  boxes: { people: Array<Record<string, unknown>>; faces: Array<Record<string, unknown>> };
}
interface SummaryDoc {
  eventId: string;
  receivedAt: string;
  summary: {
    photoResultsReceived?: number;
    lastAnalyzedAt?: string | null;
    peopleCounts?: { measured?: number };
    personBoxes?: number;
    faceBoxes?: number;
    genderProjection?: Counts;
    ageProjection?: Counts;
    emotionProjection?: Counts;
    accessoryProjection?: Counts;
    merchandiseCounts?: Counts;
    smilingPct?: number | null;
    brandMentions?: Mention[];
    clubMentions?: Mention[];
    brandAppearanceTypes?: Counts;
    moderationPhotosReviewed?: number;
    moderationFlaggedPhotos?: number;
    moderationSeverityCounts?: Counts;
    prohibitedContentCounts?: Counts;
  };
}

const LABELS: Record<string, string> = {
  nudity: 'Nudity', sexualContent: 'Sexual content', middleFinger: 'Obscene gesture',
  hateSymbols: 'Hate symbols', hateWords: 'Hate words or text', alcohol: 'Alcohol',
  drugs: 'Drugs', violence: 'Violence', weapons: 'Weapons', other: 'Other',
  clothing: 'Clothing', shoes: 'Shoes', bag: 'Bags', accessory: 'Accessories', logo: 'Logos',
  male: 'Male', female: 'Female', unknown: 'Unknown',
  silent: 'Silent Generation', boomer: 'Baby boomers', genX: 'Generation X',
  millennial: 'Millennials', genZ: 'Generation Z', genAlpha: 'Generation Alpha', genBeta: 'Generation Beta',
  happy: 'Happy', sad: 'Sad', angry: 'Angry', surprised: 'Surprised', neutral: 'Neutral',
  fearful: 'Fearful', disgusted: 'Disgusted', withCap: 'With cap', withoutCap: 'Without cap',
  withGlasses: 'With glasses', withoutGlasses: 'Without glasses', jersey: 'Jerseys', kit: 'Kits',
  scarf: 'Scarves', cap: 'Caps and hats', flag: 'Flags', banner: 'Banners',
  none: 'None', low: 'Low', medium: 'Medium', high: 'High',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function mentionTotal(items: Mention[] | undefined): number {
  return (items || []).reduce((sum, item) => sum + (Number.isFinite(item.count) ? Math.max(0, item.count) : 0), 0);
}

function countTotal(counts: Counts | undefined): number {
  return Object.values(counts || {}).reduce((sum, count) => sum + (Number.isFinite(count) ? Math.max(0, count) : 0), 0);
}

function CountsTable({ title, counts }: { title: string; counts: Counts | undefined }) {
  const entries = Object.entries(counts || {}).filter(([, count]) => Number.isFinite(count) && count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return (
    <AnalyticsSectionCard title={title}>
      {entries.length === 0 ? <p className={styles.shareNote}>No detections in the received photo results.</p> : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead><tr><th scope="col">Label</th><th scope="col" className={styles.numeric}>Detections</th></tr></thead>
            <tbody>{entries.map(([name, count]) => <tr key={name}><th scope="row">{LABELS[name] || name}</th><td className={styles.numeric}>{count}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </AnalyticsSectionCard>
  );
}

function MentionTable({ title, mentions }: { title: string; mentions: Mention[] | undefined }) {
  const entries = (mentions || []).filter((item) => item.name && item.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return (
    <AnalyticsSectionCard title={title}>
      {entries.length === 0 ? <p className={styles.shareNote}>No detections in the received photo results.</p> : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead><tr><th scope="col">Label</th><th scope="col" className={styles.numeric}>Appearances</th></tr></thead>
            <tbody>{entries.map((item) => <tr key={item.name}><th scope="row">{item.name}</th><td className={styles.numeric}>{item.count}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </AnalyticsSectionCard>
  );
}

export default function AiEventReportView() {
  const params = useParams();
  const eventId = String(params?.eventId || '');
  const [summaryDoc, setSummaryDoc] = useState<SummaryDoc | null>(null);
  const [photos, setPhotos] = useState<PhotoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [photoOffset, setPhotoOffset] = useState(0);
  const [photoTotal, setPhotoTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setUnauthenticated(false);
    setNotFound(false);
    try {
      const [summaryResponse, photosResponse] = await Promise.all([
        fetch(`/api/analytics/ai/events/${eventId}/summary`, { cache: 'no-store' }),
        fetch(`/api/analytics/ai/events/${eventId}/photos?limit=100&offset=${photoOffset}`, { cache: 'no-store' }),
      ]);
      if (summaryResponse.status === 401 || photosResponse.status === 401) {
        setUnauthenticated(true);
        return;
      }
      if (summaryResponse.status === 404) {
        setNotFound(true);
        return;
      }
      if (!summaryResponse.ok || !photosResponse.ok) throw new Error('Could not load this event’s photo results.');
      const [summaryBody, photosBody] = await Promise.all([summaryResponse.json(), photosResponse.json()]);
      setSummaryDoc(summaryBody.data || null);
      setPhotos(Array.isArray(photosBody.data?.photos) ? photosBody.data.photos : []);
      setPhotoTotal(Number(photosBody.data?.total) || 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this event’s photo results.');
    } finally {
      setLoading(false);
    }
  }, [eventId, photoOffset]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <AnalyticsStatePanel variant="loading" title="Loading photo results" description="Reading this event’s saved one-photo analyses and boxes." />;
  if (unauthenticated) return <AnalyticsStatePanel variant="empty" title="Sign in to view these results" description="Photo analysis is available to administrators." />;
  if (error) return <AnalyticsStatePanel variant="error" title="Could not load the photo results" description={error} action={<button type="button" className="btn btn-secondary" onClick={() => void load()}>Retry</button>} />;
  if (notFound || !summaryDoc) {
    return <div className={styles.wrapper}><Link className={styles.backLink} href="/admin/analytics/ai">← AI analytics</Link><AnalyticsStatePanel variant="empty" title="No photo results stored" description="Messmass has not received a completed Fanmass photo analysis for this event." /></div>;
  }

  const summary = summaryDoc.summary;
  const resultCount = summary.photoResultsReceived ?? photos.length;

  return (
    <div className={styles.wrapper}>
      <Link className={styles.backLink} href="/admin/analytics/ai">← AI analytics</Link>
      <AnalyticsSectionCard title="Photo analysis results" subtitle="Messmass combines the stored results from individual Camera photos. No event-wide completion or audience projection is inferred.">
        <dl className={styles.metricsGrid}>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Photo results received</dt><dd className={styles.metricValue}>{resultCount}</dd></div>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>People detections</dt><dd className={styles.metricValue}>{summary.peopleCounts?.measured ?? 0}</dd></div>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Person boxes</dt><dd className={styles.metricValue}>{summary.personBoxes ?? 0}</dd></div>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Face boxes</dt><dd className={styles.metricValue}>{summary.faceBoxes ?? 0}</dd></div>
        </dl>
        <p className={styles.shareNote}>Latest individual photo analysis received: {formatDate(summary.lastAnalyzedAt || summaryDoc.receivedAt)}. People counts are detections, not unique attendees.</p>
      </AnalyticsSectionCard>

      <MentionTable title="Brands" mentions={summary.brandMentions} />
      <MentionTable title="Clubs and federations" mentions={summary.clubMentions} />
      <CountsTable title="Brand appearance item types" counts={summary.brandAppearanceTypes} />
      <CountsTable title="Merchandise" counts={summary.merchandiseCounts} />
      <CountsTable title="Gender detections" counts={summary.genderProjection} />
      <CountsTable title="Age detections" counts={summary.ageProjection} />
      <CountsTable title="Emotion detections" counts={summary.emotionProjection} />
      <CountsTable title="Accessory detections" counts={summary.accessoryProjection} />
      <AnalyticsSectionCard title="Prohibited content checks" subtitle="Counts cover only received photos with a completed check. A photo can match more than one category.">
        <dl className={styles.metricsGrid}>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Photos checked</dt><dd className={styles.metricValue}>{summary.moderationPhotosReviewed ?? 0}</dd></div>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Photos flagged</dt><dd className={styles.metricValue}>{summary.moderationFlaggedPhotos ?? 0}</dd></div>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Flagged share of checked photos</dt><dd className={styles.metricValue}>{summary.moderationPhotosReviewed ? `${Math.round(((summary.moderationFlaggedPhotos || 0) / summary.moderationPhotosReviewed) * 1000) / 10}%` : 'Not available'}</dd></div>
        </dl>
      </AnalyticsSectionCard>
      <CountsTable title="Flagged categories" counts={summary.prohibitedContentCounts} />
      <CountsTable title="Check severity" counts={summary.moderationSeverityCounts} />

      <AnalyticsSectionCard title="Results by photo" subtitle={`Showing ${photos.length ? photoOffset + 1 : 0}–${Math.min(photoOffset + photos.length, photoTotal)} of ${photoTotal} individual results, each saved with its detection boxes.`}>
        {photos.length === 0 ? <p className={styles.shareNote}>No active photo rows were found.</p> : (
          <div className={styles.photoResultList}>
            {photos.map((photo) => (
              <article className={styles.photoResult} key={photo.cameraPhotoId}>
                <div className={styles.photoResultHeader}>
                  <h3>Camera photo {photo.cameraPhotoId}</h3>
                  <time>{formatDate(photo.analyzedAt)}</time>
                </div>
                <dl className={styles.photoResultMetrics}>
                  <div><dt>People detected</dt><dd>{photo.summary.peopleCounts?.measured ?? 0}</dd></div>
                  <div><dt>Person boxes</dt><dd>{photo.boxes.people?.length ?? 0}</dd></div>
                  <div><dt>Face boxes</dt><dd>{photo.boxes.faces?.length ?? 0}</dd></div>
                  <div><dt>Brand appearances</dt><dd>{mentionTotal(photo.summary.brandMentions)}</dd></div>
                  <div><dt>Club appearances</dt><dd>{mentionTotal(photo.summary.clubMentions)}</dd></div>
                  <div><dt>Merchandise detections</dt><dd>{countTotal(photo.summary.merchandiseCounts)}</dd></div>
                </dl>
                {photo.summary.moderation?.status === 'completed' && (
                  <p className={styles.shareNote}>
                    Content check: {photo.summary.moderation.flagged ? 'Flagged for review' : 'No prohibited content detected'}
                    {photo.summary.moderation.flags?.length ? ` — ${photo.summary.moderation.flags.map((flag) => LABELS[flag] || flag).join(', ')}` : ''}
                  </p>
                )}
                <details>
                  <summary>View saved detection boxes</summary>
                  <pre className={styles.boxesJson}>{JSON.stringify(photo.boxes, null, 2)}</pre>
                </details>
              </article>
            ))}
          </div>
        )}
        {photoTotal > 100 && (
          <div className={styles.paginationRow}>
            <button type="button" className={styles.paginationButton} disabled={photoOffset === 0} onClick={() => setPhotoOffset((current) => Math.max(0, current - 100))}>Previous 100</button>
            <button type="button" className={styles.paginationButton} disabled={photoOffset + photos.length >= photoTotal} onClick={() => setPhotoOffset((current) => current + 100)}>Next 100</button>
          </div>
        )}
      </AnalyticsSectionCard>
      <div><button type="button" className="btn btn-secondary" onClick={() => void load()}>Refresh results</button></div>
    </div>
  );
}
