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
import { apiPatch, apiPost } from '@/lib/apiClient';
import styles from './AiEventReport.module.css';

interface DriveFolderLink {
  _id: string;
  folderUrl: string;
  label?: string;
  status: 'pending' | 'analyzing' | 'complete' | 'empty' | 'error' | 'verified';
  lastError?: string;
  imagesDiscovered?: number;
  imagesAnalyzed?: number;
  paused?: boolean;
  syncRequestedAt?: string;
}

const DRIVE_STATUS_LABEL: Record<DriveFolderLink['status'], string> = {
  pending: 'Waiting to be read',
  analyzing: 'Analysing',
  complete: 'Images complete',
  empty: 'No images found',
  error: 'Failed',
  verified: 'Read, analysis unknown',
};

type RescanModuleId = 'demographics' | 'brands' | 'poster_faces' | 'all';

interface RescanRequest {
  moduleId: RescanModuleId;
  requestedAt: string;
}

const RESCAN_LABEL: Record<RescanModuleId, string> = {
  demographics: 'Rescan demographics',
  brands: 'Rescan brands, clubs & merchandise',
  poster_faces: 'Rescan poster faces',
  all: 'Restart everything',
};

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

function sumValues(counts: Record<string, number> | undefined): number {
  if (!counts) return 0;
  return Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);
}

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
  const [rescanPending, setRescanPending] = useState<RescanRequest | null>(null);
  const [rescanBusy, setRescanBusy] = useState<RescanModuleId | null>(null);
  const [rescanError, setRescanError] = useState('');
  const [folderLinks, setFolderLinks] = useState<DriveFolderLink[]>([]);
  const [folderError, setFolderError] = useState('');
  const [folderBusy, setFolderBusy] = useState<string | null>(null);

  const loadRescanStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/ai/events/${eventId}/rescan`, { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      setRescanPending(body.data || null);
    } catch {
      // Non-critical: the rescan buttons still work without knowing the
      // pending state, they just won't show "requested" until the next load.
    }
  }, [eventId]);

  // WHAT: Same Drive folder links the event editor's Drive Folders panel
  //     shows, reused here with Check now / Pause. Same endpoints, same data
  //     — this is the second place that data is worth acting on, not a
  //     separate system.
  const loadFolderLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/drive-folders?projectId=${eventId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const body = await res.json();
      if (body.success && Array.isArray(body.links)) setFolderLinks(body.links);
    } catch {
      // Non-critical: the report itself still renders without folder status.
    }
  }, [eventId]);

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
    loadRescanStatus();
    loadFolderLinks();
  }, [load, loadRescanStatus, loadFolderLinks]);

  async function handleFolderAction(linkId: string, action: 'pause' | 'resume' | 'sync') {
    setFolderError('');
    setFolderBusy(linkId);
    try {
      const data = await apiPatch(`/api/drive-folders/${linkId}?projectId=${eventId}`, { action });
      if (data.success) {
        loadFolderLinks();
      } else {
        setFolderError(data.error || `Failed to ${action} this folder.`);
      }
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setFolderBusy(null);
    }
  }

  async function handleRescan(moduleId: RescanModuleId) {
    setRescanError('');
    setRescanBusy(moduleId);
    try {
      const data = await apiPost(`/api/analytics/ai/events/${eventId}/rescan`, { moduleId });
      if (data.success) {
        setRescanPending(data.data);
      } else {
        setRescanError(data.error?.message || `Failed to request a rescan.`);
      }
    } catch (err) {
      setRescanError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setRescanBusy(null);
    }
  }

  // WHAT: One rescan button, disabled while a request is in flight or while
  //     any request for this event is already pending.
  // WHY: fanmass only picks up a rescan request on its next poll tick — a
  //     second click before that happens would just overwrite the pending
  //     request with an identical one, not speed anything up.
  function RescanButton({ moduleId }: { moduleId: RescanModuleId }) {
    const pendingThis = rescanPending?.moduleId === moduleId;
    const anyPending = rescanPending !== null;
    return (
      <button
        type="button"
        className={styles.rescanButton}
        disabled={rescanBusy !== null || anyPending}
        onClick={() => handleRescan(moduleId)}
        title={anyPending && !pendingThis ? 'Another rescan is already pending for this event' : undefined}
      >
        {pendingThis ? 'Requested…' : rescanBusy === moduleId ? 'Requesting…' : RESCAN_LABEL[moduleId]}
      </button>
    );
  }

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

  // WHAT: How many analysed people actually got a demographic label.
  // WHY: "Images analysed" counts the base pass (person/brand/merch detection),
  //     but gender/age/emotion come from a separate, narrower pass over those
  //     same images — a batch can show every image analysed while only a
  //     fraction of its measured people carry a demographic label. Summing one
  //     projection gives that true count instead of leaving it implied by a
  //     table that just looks sparse. The three projections should agree since
  //     they label the same detected faces; if they don't, the largest is the
  //     most complete one to anchor on.
  const demographicsAnalyzed = Math.max(
    sumValues(s.genderProjection),
    sumValues(s.ageProjection),
    sumValues(s.emotionProjection)
  );

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
        {rescanError && <p className={styles.errorDetail}>{rescanError}</p>}
        <div className={styles.rescanRow}>
          <RescanButton moduleId="all" />
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

      {folderLinks.length > 0 && (
        <AnalyticsSectionCard title="Drive folders" subtitle="Ingestion status for this event's linked folders">
          {folderError && <p className={styles.errorDetail}>{folderError}</p>}
          <div className={styles.folderList}>
            {folderLinks.map((link) => (
              <div key={link._id} className={styles.folderRow}>
                <div className={styles.folderInfo}>
                  <a href={link.folderUrl} target="_blank" rel="noopener noreferrer" className={styles.folderUrl}>
                    {link.label || link.folderUrl}
                  </a>
                  <div className={styles.folderMeta}>
                    <span className={styles.folderStatusBadge}>{DRIVE_STATUS_LABEL[link.status] || 'Unknown state'}</span>
                    {typeof link.imagesDiscovered === 'number' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{link.imagesAnalyzed ?? 0} of {link.imagesDiscovered} images</span>
                      </>
                    )}
                    {link.paused && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Paused — not checked by fanmass</span>
                      </>
                    )}
                    {!link.paused && link.syncRequestedAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Check requested…</span>
                      </>
                    )}
                    {link.status === 'error' && link.lastError && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className={styles.errorDetail}>{link.lastError}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.folderActions}>
                  {!link.paused && (
                    <button
                      type="button"
                      className={styles.rescanButton}
                      disabled={folderBusy !== null || Boolean(link.syncRequestedAt)}
                      onClick={() => handleFolderAction(link._id, 'sync')}
                    >
                      {link.syncRequestedAt ? 'Requested…' : 'Check now'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.rescanButton}
                    disabled={folderBusy !== null}
                    onClick={() => handleFolderAction(link._id, link.paused ? 'resume' : 'pause')}
                  >
                    {link.paused ? 'Resume' : 'Pause'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsSectionCard>
      )}

      <AnalyticsSectionCard title="Brands" subtitle="Brand detections across this event's images">
        {/* Brands, Clubs & federations, and Merchandise are all read from one
            pair of fanmass modules (sports_merchandise + fashion_brands) — one
            button covers all three sections, rather than three buttons that
            would request the same rescan three times. */}
        <div className={styles.rescanRow}>
          <RescanButton moduleId="brands" />
        </div>
        <MentionTable title="Brand" caption="Brand detections ranked by count" mentions={s.brandMentions || []} />
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Clubs & federations" subtitle="Club and federation detections">
        <MentionTable title="Club / federation" caption="Club and federation detections ranked by count" mentions={s.clubMentions || []} />
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Merchandise" subtitle="Merchandise kinds detected on fans">
        <CountsTable counts={s.merchandiseCounts || {}} caption="Merchandise detections by kind" nameHeader="Kind" />
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Fan demographics" subtitle="Projections from analysed faces">
        <div className={styles.rescanRow}>
          <RescanButton moduleId="demographics" />
        </div>
        {/* people.measured is every person detected in the base pass; the
            demographic pass runs over a subset of those, so this is the number
            that actually backs the tables below — not the images/people totals
            shown at the top, which would overstate coverage here. */}
        <p className={styles.shareNote}>
          Based on {demographicsAnalyzed} of {people.measured ?? 0} people analysed for demographics.
        </p>
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
