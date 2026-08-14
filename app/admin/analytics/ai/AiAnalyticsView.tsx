'use client';

/**
 * AI Analytics workspace
 *
 * WHAT: Coverage, per-event analysis status, and the AI variable catalogue.
 * WHY: AI analytics exist on 155 events and were invisible in the product. A
 *      report author had no way to tell whether a variable is safe to put in a
 *      template — the merch variables sit at 1.3% fill, so a report built on one
 *      renders empty on 153 of 155 events and the author hears it from a customer.
 * HOW: Renders what the API returns. No thresholds or percentages are computed
 *      here; a second definition would drift from lib/aiAnalytics.ts.
 */

import { useCallback, useEffect, useState } from 'react';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';
import styles from './AiAnalyticsView.module.css';

interface CoverageSummary {
  totalEvents: number;
  connected: number;
  analyzing: number;
  complete: number;
  notConnected: number;
  stale: number;
}

interface AiEventRow {
  eventId: string;
  eventName: string;
  eventDate: string | null;
  status: 'not_connected' | 'analyzing' | 'complete' | 'error';
  progressPercent: number | null;
  imagesAnalyzed: number | null;
  imagesDiscovered: number | null;
  sources: string[];
  lastAnalyzedAt: string | null;
  isStale: boolean;
  lastError?: string;
}

interface AiVariableRow {
  name: string;
  label: string;
  type: string;
  registered: boolean;
  eventsWithValue: number;
  eventsTotalConnected: number;
  fillRate: number;
  formulaToken: string;
}

// WHAT: Below this, a variable is called out as risky to build a report on.
// WHY: Named once so the workspace and the authoring surface can agree.
const SPARSE_THRESHOLD = 50;

const STATUS_LABEL: Record<AiEventRow['status'], string> = {
  complete: 'Analysis complete',
  analyzing: 'Analysing',
  error: 'Failed',
  not_connected: 'No AI analytics',
};

function statusText(row: AiEventRow): string {
  const base = STATUS_LABEL[row.status] || 'Unknown state';
  if (row.status === 'analyzing' && row.progressPercent !== null) {
    return `${base} · ${row.progressPercent}%`;
  }
  return base;
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
  // Past a week a relative figure stops being useful; show the date instead.
  return days <= 7 ? `${days} d ago` : new Date(iso).toISOString().slice(0, 10);
}

export default function AiAnalyticsView() {
  const [coverage, setCoverage] = useState<CoverageSummary | null>(null);
  const [events, setEvents] = useState<AiEventRow[]>([]);
  const [variables, setVariables] = useState<AiVariableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AiEventRow['status']>('all');
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setUnauthenticated(false);
    try {
      // Parallel: three independent reads should not queue behind each other.
      const [cRes, eRes, vRes] = await Promise.all([
        fetch('/api/analytics/ai/coverage', { cache: 'no-store' }),
        fetch('/api/analytics/ai/events?limit=500', { cache: 'no-store' }),
        fetch('/api/analytics/ai/variables', { cache: 'no-store' }),
      ]);
      if ([cRes, eRes, vRes].some((r) => r.status === 401)) {
        setUnauthenticated(true);
        return;
      }
      if (!cRes.ok || !eRes.ok || !vRes.ok) {
        throw new Error('One or more AI analytics requests failed.');
      }
      const [c, e, v] = await Promise.all([cRes.json(), eRes.json(), vRes.json()]);
      setCoverage(c.data);
      setEvents(e.data?.events || []);
      setVariables(v.data?.variables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load AI analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyToken = useCallback(async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(token);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      // Clipboard can be denied; the token is visible as text either way.
    }
  }, []);

  if (loading) {
    return <AnalyticsStatePanel variant="loading" title="Loading AI analytics" description="Reading coverage, event status and variable fill rates." />;
  }
  if (unauthenticated) {
    return (
      <AnalyticsStatePanel
        variant="empty"
        title="Sign in to view AI analytics"
        description="This workspace is available to any signed-in user."
      />
    );
  }
  if (error) {
    return (
      <AnalyticsStatePanel
        variant="error"
        title="Could not load AI analytics"
        description={error}
        action={<button type="button" className="btn btn-secondary" onClick={load}>Retry</button>}
      />
    );
  }

  const visibleEvents = statusFilter === 'all' ? events : events.filter((e) => e.status === statusFilter);

  return (
    <div className={styles.wrapper}>
      <AnalyticsSectionCard title="Coverage" subtitle="How much of the estate has AI analytics">
        {coverage && (
          <dl className={styles.coverageGrid}>
            <div className={styles.coverageItem}>
              <dt className={styles.coverageLabel}>Connected</dt>
              <dd className={styles.coverageValue}>{coverage.connected}</dd>
            </div>
            <div className={styles.coverageItem}>
              <dt className={styles.coverageLabel}>Analysing</dt>
              <dd className={styles.coverageValue}>{coverage.analyzing}</dd>
            </div>
            <div className={styles.coverageItem}>
              <dt className={styles.coverageLabel}>Complete</dt>
              <dd className={styles.coverageValue}>{coverage.complete}</dd>
            </div>
            <div className={styles.coverageItem}>
              <dt className={styles.coverageLabel}>No AI analytics</dt>
              <dd className={styles.coverageValue}>{coverage.notConnected}</dd>
            </div>
            <div className={styles.coverageItem}>
              <dt className={styles.coverageLabel}>Stale</dt>
              <dd className={styles.coverageValue}>{coverage.stale}</dd>
            </div>
          </dl>
        )}
        <p className={styles.note}>
          {coverage?.totalEvents} events in total. &ldquo;Stale&rdquo; means analytics older than 24 hours; events
          analysed before freshness was recorded show as not recorded rather than stale.
        </p>
      </AnalyticsSectionCard>

      <AnalyticsSectionCard
        title="Events"
        subtitle="Analysis status per event"
        actions={
          <label className={styles.filterLabel}>
            <span>Status</span>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">All</option>
              <option value="analyzing">Analysing</option>
              <option value="complete">Complete</option>
              <option value="error">Failed</option>
              <option value="not_connected">No AI analytics</option>
            </select>
          </label>
        }
      >
        {visibleEvents.length === 0 ? (
          <AnalyticsStatePanel variant="empty" title="No events match" description="No events have this AI analysis status." />
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Events with their AI analysis status, progress and freshness</caption>
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Status</th>
                  <th scope="col">Images</th>
                  <th scope="col">Source</th>
                  <th scope="col">Last analysed</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.slice(0, 200).map((row) => (
                  <tr key={row.eventId}>
                    <th scope="row" className={styles.eventName}>{row.eventName}</th>
                    <td>
                      <span className={`${styles.badge} ${styles[`status_${row.status}`] || ''}`}>{statusText(row)}</span>
                      {row.lastError && <span className={styles.errorDetail}> {row.lastError}</span>}
                    </td>
                    <td className={styles.numeric}>
                      {row.imagesDiscovered === null
                        ? '—'
                        : `${row.imagesAnalyzed ?? 0} of ${row.imagesDiscovered}`}
                    </td>
                    <td>{row.sources.length ? row.sources.join(', ') : '—'}</td>
                    <td>
                      {row.lastAnalyzedAt ? (
                        <time dateTime={row.lastAnalyzedAt}>{relativeTime(row.lastAnalyzedAt)}</time>
                      ) : (
                        'Not recorded'
                      )}
                      {row.isStale && <span className={styles.staleNote}> · stale</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AnalyticsSectionCard>

      <AnalyticsSectionCard
        title="AI variables"
        subtitle="How completely each variable is filled, and the token to use in a report"
      >
        {/* Denominator comes from coverage, not from the loaded event list: the
            list can be filtered or truncated, and a sentence disagreeing with the
            per-row "N of M" underneath it would undermine the whole table. */}
        <p className={styles.note}>
          Fill rate is measured across the {coverage?.connected ?? 0} events that have AI analytics, not all events.
          A variable below {SPARSE_THRESHOLD}% will render empty for most events if you build it into a shared report.
        </p>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>AI variables with fill rate and formula token</caption>
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col">Type</th>
                <th scope="col">Fill rate</th>
                <th scope="col">Use in a report</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((v) => {
                const sparse = v.fillRate < SPARSE_THRESHOLD;
                return (
                  <tr key={v.name}>
                    <th scope="row" className={styles.eventName}>
                      {v.label}
                      <span className={styles.variableName}>{v.name}</span>
                      {!v.registered && <span className={styles.warnNote}>not registered as a variable</span>}
                    </th>
                    <td>{v.type}</td>
                    <td className={styles.numeric}>
                      <span
                        role="progressbar"
                        aria-valuenow={v.fillRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${v.label} fill rate: ${v.fillRate} percent, on ${v.eventsWithValue} of ${v.eventsTotalConnected} events`}
                      >
                        {v.fillRate}%
                      </span>
                      <span className={styles.fillDetail}>
                        {v.eventsWithValue} of {v.eventsTotalConnected} events
                      </span>
                      {sparse && <span className={styles.warnNote}>may render empty in a shared report</span>}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => copyToken(v.formulaToken)}
                        aria-label={`Copy formula token for ${v.label}`}
                      >
                        {copied === v.formulaToken ? 'Copied' : v.formulaToken}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p aria-live="polite" className={styles.srOnly}>{copied ? `${copied} copied to clipboard` : ''}</p>
      </AnalyticsSectionCard>
    </div>
  );
}
