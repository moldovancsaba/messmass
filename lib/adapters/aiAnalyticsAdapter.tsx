// lib/adapters/aiAnalyticsAdapter.tsx
// WHAT: Adapter configuration for the AI Analytics events table.
// WHY: The table was hand-rolled — its own <table>, its own status pills, no
//     row actions — instead of the UnifiedListView/AdminActionRail pattern
//     every other admin list (Events, Partners) uses. That made Check now /
//     Pause / Rescan reachable only from other pages entirely, and gave no way
//     to see, at a glance, whether an event's "complete" badge meant anything
//     beyond the base image pass.
// USAGE: createAiEventsAdapter(handlers) from AiAnalyticsView.tsx — a factory,
//     not a static export, because the row actions call back into the page's
//     own load/mutate functions (see chartsAdapter.tsx for the same
//     AdminSurfaceAction shape used statically, without a factory, where no
//     live handlers are needed).

import React from 'react';
import Link from 'next/link';
import type { AdminPageAdapter, AdminSurfaceAction } from '@/lib/adminDataAdapters';

export type AiEventStatus = 'not_connected' | 'analyzing' | 'complete' | 'error';

export interface AiEventListItem {
  _id: string; // = eventId, required by UnifiedListView<T extends {_id: string}>
  eventId: string;
  eventName: string;
  eventDate: string | null;
  status: AiEventStatus;
  progressPercent: number | null;
  imagesAnalyzed: number | null;
  imagesDiscovered: number | null;
  sources: string[];
  lastAnalyzedAt: string | null;
  isStale: boolean;
  lastError?: string;
  brandCount: number;
  merchandiseCount: number;
  peopleMeasured: number;
  demographicsAnalyzed: number;
  hasDriveFolder: boolean;
  drivePaused: boolean;
  driveSyncPending: boolean;
  rescanPending: boolean;
}

export type RescanModuleId = 'demographics' | 'brands' | 'poster_faces' | 'all';

export interface AiEventRowHandlers {
  onCheckNow: (eventId: string) => void;
  onPause: (eventId: string) => void;
  onResume: (eventId: string) => void;
  onRescan: (eventId: string, moduleId: RescanModuleId) => void;
  /** eventId currently mid-request, to disable its own row's actions while in flight. */
  busyEventId: string | null;
}

const STATUS_LABEL: Record<AiEventStatus, string> = {
  complete: 'Images complete',
  analyzing: 'Analysing',
  error: 'Failed',
  not_connected: 'No AI analytics',
};

// Shared global badge classes (app/globals.css), the same ones every other
// admin surface uses for status pills — not a page-local class.
const STATUS_BADGE_VARIANT: Record<AiEventStatus, string> = {
  complete: 'badge-success',
  analyzing: 'badge-warning',
  error: 'badge-danger',
  not_connected: 'badge-secondary',
};

function statusText(row: AiEventListItem): string {
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
  return days <= 7 ? `${days} d ago` : new Date(iso).toISOString().slice(0, 10);
}

// WHAT: The signal the badge alone cannot give — whether brands/merch/
//     demographics ran at all, independent of the base-pass status.
// WHY: This is the exact gap that made "Images complete" read as a lie for an
//     event with an empty Brands table and 0% demographics.
function DeepAnalysisCell({ row }: { row: AiEventListItem }) {
  if (row.status === 'not_connected') return <span>—</span>;
  const demographicsPct = row.peopleMeasured > 0
    ? Math.round((row.demographicsAnalyzed / row.peopleMeasured) * 100)
    : null;
  return (
    <span>
      Brands: {row.brandCount || 'none'}
      {' · '}
      Merch: {row.merchandiseCount || 'none'}
      {' · '}
      Demographics: {demographicsPct === null ? 'no people' : `${demographicsPct}%`}
    </span>
  );
}

function rowActions(handlers: AiEventRowHandlers): AdminSurfaceAction<AiEventListItem>[] {
  const busy = (row: AiEventListItem) => handlers.busyEventId === row.eventId;
  return [
    {
      label: 'Check now',
      icon: '🔄',
      priority: 'primary',
      title: 'Check this event\'s Drive folder for new images now, instead of waiting for the next scheduled poll',
      disabled: (row) => !row.hasDriveFolder || row.drivePaused || row.driveSyncPending || busy(row),
      ariaLabel: (row) =>
        !row.hasDriveFolder ? 'No Drive folder linked to check'
        : row.drivePaused ? 'Resume this event before checking'
        : row.driveSyncPending ? 'Check already requested, waiting on fanmass'
        : `Check ${row.eventName} for new images now`,
      handler: (row) => handlers.onCheckNow(row.eventId),
    },
    {
      label: 'Pause',
      mobileLabel: 'Pause',
      icon: '⏸️',
      priority: 'primary',
      title: 'Stop fanmass from checking this event\'s Drive folder — use once it is done, or if it has no images',
      disabled: (row) => !row.hasDriveFolder || row.drivePaused || busy(row),
      ariaLabel: (row) => `Pause Drive checks for ${row.eventName}`,
      handler: (row) => handlers.onPause(row.eventId),
    },
    {
      label: 'Resume',
      icon: '▶️',
      priority: 'primary',
      title: 'Resume fanmass polling for this event\'s Drive folder',
      disabled: (row) => !row.hasDriveFolder || !row.drivePaused || busy(row),
      ariaLabel: (row) => `Resume Drive checks for ${row.eventName}`,
      handler: (row) => handlers.onResume(row.eventId),
    },
    {
      label: 'Rescan demographics',
      mobileLabel: 'Rescan demographics',
      icon: '🔁',
      priority: 'secondary',
      title: 'Force fanmass to re-run the demographics module against already-ingested images',
      disabled: (row) => row.status === 'not_connected' || row.rescanPending || busy(row),
      ariaLabel: (row) => `Rescan demographics for ${row.eventName}`,
      handler: (row) => handlers.onRescan(row.eventId, 'demographics'),
    },
    {
      label: 'Rescan brands',
      mobileLabel: 'Rescan brands',
      icon: '🔁',
      priority: 'overflow',
      title: 'Force fanmass to re-run brand, club, and merchandise detection against already-ingested images',
      disabled: (row) => row.status === 'not_connected' || row.rescanPending || busy(row),
      ariaLabel: (row) => `Rescan brands, clubs and merchandise for ${row.eventName}`,
      handler: (row) => handlers.onRescan(row.eventId, 'brands'),
    },
    {
      label: 'Restart everything',
      icon: '♻️',
      variant: 'danger',
      priority: 'overflow',
      title: 'Force fanmass to re-run every module against already-ingested images',
      disabled: (row) => row.status === 'not_connected' || row.rescanPending || busy(row),
      ariaLabel: (row) => `Restart all analysis for ${row.eventName}`,
      handler: (row) => handlers.onRescan(row.eventId, 'all'),
    },
  ];
}

export function createAiEventsAdapter(handlers: AiEventRowHandlers): AdminPageAdapter<AiEventListItem> {
  const actions = rowActions(handlers);
  return {
    pageName: 'AI analytics events',
    defaultView: 'list',
    searchFields: ['eventName'],
    emptyStateMessage: 'No events match the current filter.',
    emptyStateIcon: '🤖',
    listConfig: {
      columns: [
        {
          key: 'eventName',
          label: 'Event',
          sortable: true,
          minWidth: '200px',
          mobile: { behavior: 'primary' },
          render: (row) => (
            row.status !== 'not_connected' ? (
              <Link
                className="adapter-primary-field"
                href={`/admin/analytics/ai/${row.eventId}`}
                aria-label={`Open AI report for ${row.eventName}`}
              >
                {row.eventName}
              </Link>
            ) : (
              <span className="adapter-primary-field">{row.eventName}</span>
            )
          ),
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          width: '160px',
          mobile: { behavior: 'primary' },
          render: (row) => (
            <>
              <span className={`badge ${STATUS_BADGE_VARIANT[row.status]}`}>{statusText(row)}</span>
              {row.lastError && <div className="adapter-empty-value">{row.lastError}</div>}
              {row.drivePaused && <div className="adapter-empty-value">Paused</div>}
              {row.driveSyncPending && <div className="adapter-empty-value">Check requested…</div>}
              {row.rescanPending && <div className="adapter-empty-value">Rescan requested…</div>}
            </>
          ),
        },
        {
          key: 'imagesAnalyzed',
          label: 'Images',
          sortable: true,
          width: '120px',
          mobile: { behavior: 'secondary' },
          render: (row) => (
            <span>{row.imagesDiscovered === null ? '—' : `${row.imagesAnalyzed ?? 0} of ${row.imagesDiscovered}`}</span>
          ),
        },
        {
          key: 'brandCount',
          label: 'Deep analysis',
          width: '260px',
          mobile: { behavior: 'primary', label: 'Deep analysis' },
          render: (row) => <DeepAnalysisCell row={row} />,
        },
        {
          key: 'sources',
          label: 'Source',
          width: '110px',
          mobile: { behavior: 'hidden' },
          render: (row) => <span>{row.sources.length ? row.sources.join(', ') : '—'}</span>,
        },
        {
          key: 'lastAnalyzedAt',
          label: 'Last analysed',
          sortable: true,
          width: '140px',
          mobile: { behavior: 'secondary' },
          render: (row) => (
            <span>
              {row.lastAnalyzedAt ? relativeTime(row.lastAnalyzedAt) : 'Not recorded'}
              {row.isStale && ' · stale'}
            </span>
          ),
        },
      ],
      rowActions: actions,
      actionEmptyStateLabel: 'No actions',
    },
    cardConfig: {
      primaryField: 'eventName',
      secondaryField: (row) => statusText(row),
      metaFields: [
        { key: 'images', label: 'Images', render: (row) => (row.imagesDiscovered === null ? '—' : `${row.imagesAnalyzed ?? 0} of ${row.imagesDiscovered}`) },
        { key: 'deep', label: 'Deep analysis', render: (row) => <DeepAnalysisCell row={row} /> },
        { key: 'lastAnalyzedAt', label: 'Last analysed', render: (row) => relativeTime(row.lastAnalyzedAt) },
      ],
      cardActions: actions,
      actionEmptyStateLabel: 'No actions',
    },
  };
}
