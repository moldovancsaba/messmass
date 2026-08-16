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

import { useCallback, useEffect, useMemo, useState } from 'react';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';
import UnifiedListView from '@/components/UnifiedListView';
import { apiPost } from '@/lib/apiClient';
import { createAiEventsAdapter, type AiEventListItem, type RescanModuleId } from '@/lib/adapters/aiAnalyticsAdapter';
import styles from './AiAnalyticsView.module.css';

interface CoverageSummary {
  totalEvents: number;
  connected: number;
  analyzing: number;
  complete: number;
  notConnected: number;
  stale: number;
}

type AiEventRow = Omit<AiEventListItem, '_id'>;

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

export default function AiAnalyticsView() {
  const [coverage, setCoverage] = useState<CoverageSummary | null>(null);
  const [events, setEvents] = useState<AiEventRow[]>([]);
  const [variables, setVariables] = useState<AiVariableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AiEventRow['status']>('all');
  // WHAT: Whether events with no discovered images appear in the default view.
  // WHY: Most of the estate is camera-provisioned events still waiting for photos
  //     — 152 rows of "Analysing · 0%" buried the handful with real analysis.
  //     Hidden by default; failed events stay visible regardless, because an
  //     error with no images is exactly what an operator needs to see.
  const [showEmpty, setShowEmpty] = useState(false);
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

  // WHAT: Check now / Pause / Resume / Rescan, called from the row actions
  //     below. All reuse endpoints already built for the per-event report and
  //     the event editor's Drive Folders panel — event-scoped variants of the
  //     same mutations, not a new backend.
  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const runDriveAction = useCallback(async (eventId: string, action: 'sync' | 'pause' | 'resume') => {
    setActionError('');
    setBusyEventId(eventId);
    try {
      const data = await apiPost(`/api/analytics/ai/events/${eventId}/drive-sync`, { action });
      if (data.success) {
        await load();
      } else {
        setActionError(data.error || `Failed to ${action} this event's Drive folder.`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setBusyEventId(null);
    }
  }, [load]);

  const runRescan = useCallback(async (eventId: string, moduleId: RescanModuleId) => {
    setActionError('');
    setBusyEventId(eventId);
    try {
      const data = await apiPost(`/api/analytics/ai/events/${eventId}/rescan`, { moduleId });
      if (data.success) {
        await load();
      } else {
        setActionError(data.error?.message || 'Failed to request a rescan.');
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setBusyEventId(null);
    }
  }, [load]);

  const eventsAdapter = useMemo(
    () => createAiEventsAdapter({
      busyEventId,
      onCheckNow: (eventId) => runDriveAction(eventId, 'sync'),
      onPause: (eventId) => runDriveAction(eventId, 'pause'),
      onResume: (eventId) => runDriveAction(eventId, 'resume'),
      onRescan: (eventId, moduleId) => runRescan(eventId, moduleId),
    }),
    [busyEventId, runDriveAction, runRescan]
  );

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

  const hasImagesOrError = (e: AiEventRow) => (e.imagesDiscovered ?? 0) > 0 || e.status === 'error';
  // An explicit status filter overrides the hide: choosing "No AI analytics" and
  // seeing nothing because of a default-hidden rule would read as a bug.
  const visibleEvents =
    statusFilter === 'all'
      ? events.filter((e) => showEmpty || hasImagesOrError(e))
      : events.filter((e) => e.status === statusFilter);
  const hiddenCount = statusFilter === 'all' && !showEmpty ? events.length - visibleEvents.length : 0;

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
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <input
                type="checkbox"
                className={styles.filterCheckbox}
                checked={showEmpty}
                onChange={(e) => setShowEmpty(e.target.checked)}
              />
              <span>Show events without images{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}</span>
            </label>
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
          </div>
        }
      >
        {actionError && <p className={styles.errorDetail}>{actionError}</p>}
        <UnifiedListView
          items={visibleEvents.slice(0, 200).map((row) => ({ ...row, _id: row.eventId }))}
          config={eventsAdapter.listConfig}
          emptyMessage="No events have this AI analysis status."
        />
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
