'use client';

/**
 * AI event report
 *
 * WHAT: The full fanmass analysis for one event — brand mentions, club and
 *      federation mentions, merchandise, demographics, people counts, confidence
 *      and freshness — reached from the AI Analytics event list.
 * WHY: This report previously existed only on the fanmass machine. The summary
 *      transport (v12.1.50) brings the document across; this page renders it.
 * HOW: Pure consumer. Mentions arrive pre-ranked by fanmass and are rendered in
 *      that order; any share shown is share of detections in the same list —
 *      re-ranking or re-computing here would let two systems disagree about the
 *      same numbers.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';
import styles from './AiEventReport.module.css';

interface Mention { name: string; count: number }

interface SummaryDoc {
  eventId: string;
  batchId: string;
  contractVersion: string;
  receivedAt: string;
  generatedAt: string | null;
  summary: {
    imageCounts?: { total?: number; analyzed?: number };
    peopleCounts?: { measured?: number; projected?: number };
    genderProjection?: Record<string, number>;
    ageProjection?: Record<string, number>;
    merchandiseCounts?: Record<string, number>;
    emotionProjection?: Record<string, number>;
    smilingPct?: number | null;
    brandMentions?: Mention[];
    clubMentions?: Mention[];
    confidence?: number;
    warnings?: string[];
  };
}

interface EventRow {
  eventId: string;
  eventName: string;
  status: string;
  progressPercent: number | null;
  lastAnalyzedAt: string | null;
  isStale: boolean;
}

// WHAT: Rows shown before the list collapses behind "Show all".
// WHY: Twenty rows of brands would bury the header; the tail is one action away.
const VISIBLE_ROWS = 8;

function relativeTime(iso: string | null): string {
  if (!iso) return 'Not recorded';
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return 'Not recorded';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days <= 7 ? `${days} d ago` : new Date(iso).toISOString().slice(0, 10);
}

function MentionTable({ title, caption, mentions }: { title: string; caption: string; mentions: Mention[] }) {
  const [showAll, setShowAll] = useState(false);
  if (mentions.length === 0) {
    return <p className={styles.emptyNote}>None detected.</p>;
  }
  const total = mentions.reduce((sum, m) => sum + (m.count || 0), 0);
  const visible = showAll ? mentions : mentions.slice(0, VISIBLE_ROWS);
  return (
    <>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{title}</th>
              <th scope="col" className={styles.numeric}>Detections</th>
              <th scope="col" className={styles.numeric}>Share</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <tr key={m.name}>
                <th scope="row">{m.name}</th>
                <td className={styles.numeric}>{m.count}</td>
                <td className={styles.numeric}>{total > 0 ? `${Math.round((m.count / total) * 100)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Share of detections, not of attendees — conflating the two is the
          obvious misreading, so the label says which it is. */}
      <p className={styles.shareNote}>Share is of {total} detections in this list, not of attendees.</p>
      {mentions.length > VISIBLE_ROWS && (
        <button type="button" className={`btn btn-secondary ${styles.showAll}`} onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${mentions.length}`}
        </button>
      )}
    </>
  );
}

function CountsTable({ counts, caption, nameHeader }: { counts: Record<string, number>; caption: string; nameHeader: string }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className={styles.emptyNote}>Not available for this event.</p>;
  }
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{nameHeader}</th>
            <th scope="col" className={styles.numeric}>Count</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, count]) => (
            <tr key={name}>
              <th scope="row">{name}</th>
              <td className={styles.numeric}>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AiEventReportView() {
  const params = useParams();
  const eventId = String(params?.eventId || '');
  const [doc, setDoc] = useState<SummaryDoc | null>(null);
  const [eventRow, setEventRow] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSummary, setNoSummary] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setNoSummary(false);
    setUnauthenticated(false);
    try {
      const [sRes, eRes] = await Promise.all([
        fetch(`/api/analytics/ai/events/${eventId}/summary`, { cache: 'no-store' }),
        fetch('/api/analytics/ai/events?limit=500', { cache: 'no-store' }),
      ]);
      if (sRes.status === 401 || eRes.status === 401) {
        setUnauthenticated(true);
        return;
      }
      if (eRes.ok) {
        const e = await eRes.json();
        setEventRow((e.data?.events || []).find((row: EventRow) => row.eventId === eventId) || null);
      }
      if (sRes.status === 404) {
        setNoSummary(true);
        return;
      }
      if (!sRes.ok) throw new Error('Could not load the analysis summary.');
      const s = await sRes.json();
      setDoc(s.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the analysis summary.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <AnalyticsStatePanel variant="loading" title="Loading AI report" description="Reading the analysis summary for this event." />;
  }
  if (unauthenticated) {
    return <AnalyticsStatePanel variant="empty" title="Sign in to view this report" description="AI reports are available to any signed-in user." />;
  }
  if (noSummary) {
    return (
      <div className={styles.wrapper}>
        <Link className={styles.backLink} href="/admin/analytics/ai">← AI Analytics</Link>
        <AnalyticsStatePanel
          variant="empty"
          title="No analysis summary yet"
          description={`${eventRow?.eventName || 'This event'} has no stored AI analysis. Either its analysis has not completed a push yet, or it was analysed before summaries were transported (fanmass re-sends on its next scheduled push).`}
        />
      </div>
    );
  }
  if (error || !doc) {
    return (
      <AnalyticsStatePanel
        variant="error"
        title="Could not load the AI report"
        description={error || 'Unknown error.'}
        action={<button type="button" className="btn btn-secondary" onClick={load}>Retry</button>}
      />
    );
  }

  const s = doc.summary || {};
  const people = s.peopleCounts || {};
  const images = s.imageCounts || {};

  return (
    <div className={styles.wrapper}>
      <Link className={styles.backLink} href="/admin/analytics/ai">← AI Analytics</Link>

      <AnalyticsSectionCard
        title={eventRow?.eventName || 'AI event report'}
        subtitle="AI analysis of this event's images"
      >
        <div className={styles.headerMeta}>
          <span>
            Last analysed:{' '}
            <time dateTime={doc.receivedAt}>{relativeTime(doc.receivedAt)}</time>
            {eventRow?.isStale ? ' · stale' : ''}
          </span>
          {typeof s.confidence === 'number' && <span>Confidence: {Math.round(s.confidence * 100)}%</span>}
          {typeof s.smilingPct === 'number' && <span>Smiling: {s.smilingPct}%</span>}
          {eventRow?.progressPercent !== null && eventRow?.progressPercent !== undefined && (
            <span>Analysis progress: {eventRow.progressPercent}%</span>
          )}
        </div>
        <dl className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <dt className={styles.metricLabel}>People (measured)</dt>
            <dd className={styles.metricValue}>{people.measured ?? '—'}</dd>
          </div>
          <div className={styles.metricItem}>
            <dt className={styles.metricLabel}>People (projected)</dt>
            <dd className={styles.metricValue}>{people.projected ?? '—'}</dd>
          </div>
          <div className={styles.metricItem}>
            <dt className={styles.metricLabel}>Images analysed</dt>
            <dd className={styles.metricValue}>{images.analyzed ?? '—'}</dd>
          </div>
          <div className={styles.metricItem}>
            <dt className={styles.metricLabel}>Images total</dt>
            <dd className={styles.metricValue}>{images.total ?? '—'}</dd>
          </div>
        </dl>
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Brands" subtitle="Brand detections across this event's images">
        <MentionTable title="Brand" caption="Brand detections ranked by count" mentions={s.brandMentions || []} />
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Clubs & federations" subtitle="Club and federation detections">
        <MentionTable title="Club / federation" caption="Club and federation detections ranked by count" mentions={s.clubMentions || []} />
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Merchandise" subtitle="Merchandise kinds detected on fans">
        <CountsTable counts={s.merchandiseCounts || {}} caption="Merchandise detections by kind" nameHeader="Kind" />
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Fan demographics" subtitle="Projections from analysed faces">
        <h3 className={styles.srOnly}>Gender projection</h3>
        <CountsTable counts={s.genderProjection || {}} caption="Gender projection" nameHeader="Gender" />
        <h3 className={styles.srOnly}>Age projection</h3>
        <CountsTable counts={s.ageProjection || {}} caption="Age projection" nameHeader="Age group" />
        <h3 className={styles.srOnly}>Emotions</h3>
        <CountsTable counts={s.emotionProjection || {}} caption="Emotions detected on analysed faces" nameHeader="Emotion" />
      </AnalyticsSectionCard>
    </div>
  );
}
