'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';
import styles from './AiEventReport.module.css';

type Counts = Record<string, number>;
interface Mention { name: string; count: number }
interface SummaryDoc {
  eventId: string;
  receivedAt: string;
  cameraEvent?: {
    eventId: string | null;
    mongoId: string | null;
    analysisUrl: string | null;
  };
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
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setUnauthenticated(false);
    setNotFound(false);
    try {
      const response = await fetch(`/api/analytics/ai/events/${eventId}/summary`, { cache: 'no-store' });
      if (response.status === 401) {
        setUnauthenticated(true);
        return;
      }
      if (response.status === 404) {
        setNotFound(true);
        return;
      }
      if (!response.ok) throw new Error('Could not load this event’s photo results.');
      const body = await response.json();
      setSummaryDoc(body.data || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load this event’s photo results.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <AnalyticsStatePanel variant="loading" title="Loading photo results" description="Reading this event’s saved photo analysis rollups." />;
  if (unauthenticated) return <AnalyticsStatePanel variant="empty" title="Sign in to view these results" description="Photo analysis is available to administrators." />;
  if (error) return <AnalyticsStatePanel variant="error" title="Could not load the photo results" description={error} action={<button type="button" className="btn btn-secondary" onClick={() => void load()}>Retry</button>} />;
  if (notFound || !summaryDoc) {
    return <div className={styles.wrapper}><Link className={styles.backLink} href="/admin/analytics/ai">← AI analytics</Link><AnalyticsStatePanel variant="empty" title="No photo results stored" description="Messmass has not received a completed Fanmass photo analysis for this event." /></div>;
  }

  const summary = summaryDoc.summary;
  const resultCount = summary.photoResultsReceived ?? 0;

  return (
    <div className={styles.wrapper}>
      <Link className={styles.backLink} href="/admin/analytics/ai">← AI analytics</Link>
      <AnalyticsSectionCard title="Photo analysis results" subtitle="Messmass combines the stored results from individual Camera photos. No event-wide completion or audience projection is inferred.">
        <dl className={styles.metricsGrid}>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Photo results received</dt><dd className={styles.metricValue}>{resultCount}</dd></div>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>People model estimate (summed)</dt><dd className={styles.metricValue}>{summary.peopleCounts?.measured ?? 0}</dd></div>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Person boxes</dt><dd className={styles.metricValue}>{summary.personBoxes ?? 0}</dd></div>
          <div className={styles.metricItem}><dt className={styles.metricLabel}>Face boxes</dt><dd className={styles.metricValue}>{summary.faceBoxes ?? 0}</dd></div>
        </dl>
        <p className={styles.shareNote}>Latest individual photo analysis received: {formatDate(summary.lastAnalyzedAt || summaryDoc.receivedAt)}. People count is a summed model estimate across photos, distinct from bounding boxes and attendee counts.</p>
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

      <AnalyticsSectionCard
        title="Per-photo results and human review"
        subtitle="Individual photo inspection, bounding boxes, processing progress, and human review are managed directly in the Camera workspace."
      >
        <div className={styles.cameraLinkSection}>
          <p className={styles.shareNote}>
            Messmass aggregates and retains event-level rollups from durable photo results. To inspect one-photo cards, verify detection boxes, or confirm human reviews, open this event in Camera.
          </p>
          <div className={styles.actionRow}>
            {summaryDoc.cameraEvent?.analysisUrl ? (
              <a
                href={summaryDoc.cameraEvent.analysisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Open Camera Fanmass workspace ↗
              </a>
            ) : (
              <p className={styles.unlinkedNote}>
                This Messmass event is not linked to a Camera event workspace.
              </p>
            )}
          </div>
        </div>
      </AnalyticsSectionCard>

      <div><button type="button" className="btn btn-secondary" onClick={() => void load()}>Refresh results</button></div>
    </div>
  );
}
