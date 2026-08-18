'use client';

// components/fanmass/FanmassDashboardTabs.tsx
// WHAT: The tab shell for /admin/fanmass — an event picker plus five tabs
//     (Executive, Analytics, Run Control, Entity Curation, Settings), reading
//     from the fanmass_dashboard_snapshot collection Fanmass pushes to on its
//     own cadence. No live call back to Fanmass — Fanmass is always the
//     outbound caller (see lib/fanmassDashboardSnapshot.ts's module header).
// WHY tabs, not five pages: mirrors fanmass's own dashboard-tier grouping
//     (the FANMASS_PAGES catalogue this page replaced), and keeps the event
//     picker shared across all five instead of five separate selectors.
// HOW: Executive and Analytics render real content from the snapshot's
//     printableReport sections (this issue). Run Control, Entity Curation,
//     and Settings are placeholder tabs — their content ships in sibling
//     issues that extend this same shell rather than building a new one.

import React, { useEffect, useState } from 'react';
import { Badge, Checkbox, Select, Tabs } from '@mantine/core';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import AnalyticsStatePanel from '@/components/analytics/AnalyticsStatePanel';
import PrintableReportSections from './PrintableReportSections';
import RunControlTab, { type RunControlSection } from './RunControlTab';
import EntityCurationTab, { type EntityCurationSection } from './EntityCurationTab';
import SettingsTab from './SettingsTab';
import type { FanmassSettingsValues } from '@/lib/fanmassSettingsAllowlist';
import { apiGet } from '@/lib/apiClient';
import styles from './FanmassDashboardTabs.module.css';

// Run Control needs a live-ish view of the active run, so the snapshot is
// re-fetched on this interval whenever the page is open (not just once per
// event selection) — the other tabs get the side benefit of fresher data
// too. Cleared on unmount/event change; does not run in the background from
// an unmounted page.
const SNAPSHOT_REFRESH_INTERVAL_MS = 5_000;

interface FanmassSnapshotEvent {
  eventId: string;
  batchName: string | null;
  receivedAt: string;
  imageCount: number;
}

interface FanmassDashboardSnapshot {
  eventId: string;
  batchId: string;
  batchName: string | null;
  generatedAt: string;
  receivedAt: string;
  sections: {
    executive?: { title?: string; sections?: unknown[] };
    analytics?: { title?: string; sections?: unknown[] };
    runControl?: Record<string, unknown>;
    entityCuration?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };
}

// A snapshot is expected on the messmass_push_minutes cadence (fanmass
// default: 60 minutes). Anything older than 3x that is flagged stale rather
// than presented as current — a conservative default until the real
// configured cadence is echoed in the snapshot itself.
const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

function relativeTime(iso: string | undefined): string {
  if (!iso) return 'unknown';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'unknown';
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function FanmassDashboardTabs() {
  const [events, setEvents] = useState<FanmassSnapshotEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  // WHAT: Whether events with no images yet appear in the picker.
  // WHY: Same rationale as AiAnalyticsView.tsx's "Show events without
  //     images" — most of the estate is provisioned but not yet analyzed;
  //     hidden by default so the picker leads with events that actually
  //     have something to show.
  const [showEmpty, setShowEmpty] = useState(false);

  const [snapshot, setSnapshot] = useState<FanmassDashboardSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadEvents() {
      setEventsLoading(true);
      setEventsError('');
      try {
        const res = await apiGet<{ success: boolean; data: { events: FanmassSnapshotEvent[] } }>('/api/admin/fanmass/events');
        if (cancelled) return;
        const list = res.data?.events || [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId((current) => {
            if (current) return current;
            const withImages = list.find((e) => e.imageCount > 0);
            return (withImages ?? list[0]).eventId;
          });
        }
      } catch (err) {
        if (!cancelled) setEventsError(err instanceof Error ? err.message : 'Could not load Fanmass-linked events.');
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    }
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    async function loadSnapshot(isFirstLoad: boolean) {
      if (isFirstLoad) setSnapshotLoading(true);
      try {
        const res = await apiGet<{ success: boolean; data: { snapshot: FanmassDashboardSnapshot | null } }>(
          `/api/admin/fanmass/snapshot?eventId=${encodeURIComponent(selectedEventId as string)}`
        );
        if (!cancelled) {
          setSnapshot(res.data?.snapshot ?? null);
          setSnapshotError('');
        }
      } catch (err) {
        // A transient refresh failure must not clear an already-loaded
        // snapshot — the last-known-good data stays on screen.
        if (!cancelled) setSnapshotError(err instanceof Error ? err.message : 'Could not load Fanmass dashboard data.');
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    }
    loadSnapshot(true);
    const id = setInterval(() => loadSnapshot(false), SNAPSHOT_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedEventId]);

  if (eventsLoading) {
    return <AnalyticsStatePanel variant="loading" title="Loading Fanmass-linked events" description="Checking which events have Fanmass data." />;
  }

  if (eventsError) {
    return <AnalyticsStatePanel variant="error" title="Could not load events" description={eventsError} />;
  }

  if (events.length === 0) {
    return (
      <AnalyticsStatePanel
        variant="empty"
        title="No Fanmass data yet"
        description="No event has reported a Fanmass dashboard snapshot yet. Fanmass pushes this automatically once an event is connected and analyzed — nothing to configure here."
      />
    );
  }

  const isStale = snapshot ? Date.now() - new Date(snapshot.receivedAt).getTime() > STALE_AFTER_MS : false;
  const visibleEvents = showEmpty ? events : events.filter((e) => e.imageCount > 0);
  const hiddenCount = showEmpty ? 0 : events.length - visibleEvents.length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.picker}>
        <Select
          label="Event"
          data={visibleEvents.map((e) => ({ value: e.eventId, label: e.batchName || e.eventId }))}
          value={selectedEventId}
          onChange={setSelectedEventId}
          searchable
          allowDeselect={false}
          aria-label="Select a Fanmass-linked event"
        />
        <Checkbox
          label={`Show events without images${hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}`}
          checked={showEmpty}
          onChange={(e) => setShowEmpty(e.currentTarget.checked)}
        />
        {snapshot && (
          <span className={isStale ? styles.staleness : styles.freshness} role="status">
            Last updated: {relativeTime(snapshot.receivedAt)}
            {isStale ? ' — may be out of date' : ''}
          </span>
        )}
      </div>

      {snapshotLoading && !snapshot ? (
        <AnalyticsStatePanel variant="loading" title="Loading Fanmass data" description="Fetching the latest dashboard snapshot for this event." />
      ) : !snapshot && snapshotError ? (
        <AnalyticsStatePanel variant="error" title="Could not load Fanmass data" description={snapshotError} />
      ) : !snapshot ? (
        <AnalyticsStatePanel
          variant="empty"
          title="Fanmass hasn't reported yet"
          description="This event has no Fanmass dashboard snapshot on record. It arrives automatically once Fanmass has analyzed this event's images."
        />
      ) : (
        <Tabs defaultValue="executive" keepMounted={false}>
          {/* A refresh failure never replaces an already-loaded snapshot — it
              only annotates it, so a healthy batch never appears to vanish
              because of one missed poll tick. */}
          {snapshotError && (
            <p className={styles.staleness} role="status">
              Could not refresh Fanmass data ({snapshotError}). Showing the last data received.
            </p>
          )}
          <Tabs.List>
            <Tabs.Tab value="executive">Executive Dashboard</Tabs.Tab>
            <Tabs.Tab value="analytics">Analytics</Tabs.Tab>
            <Tabs.Tab value="runControl">Run Control</Tabs.Tab>
            <Tabs.Tab value="entityCuration">Entity Curation</Tabs.Tab>
            <Tabs.Tab value="settings">Settings</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="executive" pt="md">
            <PrintableReportSections report={snapshot.sections.executive as any} />
          </Tabs.Panel>
          <Tabs.Panel value="analytics" pt="md">
            <PrintableReportSections report={snapshot.sections.analytics as any} />
          </Tabs.Panel>
          <Tabs.Panel value="runControl" pt="md">
            <RunControlTab
              batchId={snapshot.batchId}
              runControl={snapshot.sections.runControl as RunControlSection | undefined}
              snapshotGeneratedAt={snapshot.generatedAt}
            />
          </Tabs.Panel>
          <Tabs.Panel value="entityCuration" pt="md">
            <EntityCurationTab batchId={snapshot.batchId} entityCuration={snapshot.sections.entityCuration as EntityCurationSection | undefined} />
          </Tabs.Panel>
          <Tabs.Panel value="settings" pt="md">
            <SettingsTab settings={snapshot.sections.settings as FanmassSettingsValues | undefined} />
          </Tabs.Panel>
        </Tabs>
      )}
    </div>
  );
}
