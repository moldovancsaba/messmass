'use client';

// components/fanmass/RunControlTab.tsx
// WHAT: Run Control tab content for /admin/fanmass — a read-only view of the
//     active analysis run for the selected batch (sourced from
//     sections.runControl on the fanmass_dashboard_snapshot the parent tab
//     shell already polls), plus Start/Stop actions that enqueue a command
//     via POST /api/admin/fanmass/commands.
// WHY no live ack: fanmass has no public URL, so a click cannot confirm
//     anything happened — it only enqueues a command that fanmass's own
//     poll loop (fanmass#80) picks up on its own schedule. The *next*
//     fanmass_dashboard_snapshot push is the only signal this tab will ever
//     get back. This file's job is to represent that honestly rather than
//     imply the button is instant (see the "enqueued" state below).
// HOW: activeRun (queued/running, or null) is the single explicit gate for
//     Start/Stop — no inference from job/heartbeat presence (that data
//     exists too but is display-only supplementary context here).
//     ponytail: camera-intake status is not shown — no per-batch "camera
//     connected" field exists anywhere in fanmass's data model (checked:
//     analytics_store.py, camera_sync.py, progress_status.py); inventing one
//     here would violate the "no opaque heuristics" rule this issue itself
//     mandates. Add when fanmass exposes a real field for it.

import React, { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Badge, Button, Progress, Stack, Group, Box, Text } from '@mantine/core';
import { useGdsConfirm } from '@sovereignsquad/gds-core/client';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import { apiPost } from '@/lib/apiClient';
import styles from './RunControlTab.module.css';

interface AnalysisRun {
  runId: string;
  name: string;
  status: string;
  progress?: { done?: number; total?: number; pct?: number; label?: string };
}

interface ActiveJob {
  status: string | null;
  label: string | null;
  heartbeatAgeSeconds: number | null;
}

interface BatchProgressStatus {
  expectedImages: number;
  uploadedImages: number;
  activeJob: ActiveJob | null;
  workerOnline: boolean;
  stalled: boolean;
}

export interface RunControlSection {
  progress?: BatchProgressStatus;
  activeRun?: AnalysisRun | null;
}

interface RunControlTabProps {
  batchId: string;
  runControl: RunControlSection | undefined;
  // ISO-8601 timestamp of the snapshot this runControl section came from —
  // used to clear the optimistic "enqueued" state as soon as a snapshot
  // generated after the command was sent arrives, without waiting out the
  // full window (Section 13's "whichever comes first").
  snapshotGeneratedAt: string | undefined;
}

const OPTIMISTIC_WINDOW_MS = 20_000;

function statusBadge(run: AnalysisRun | null | undefined) {
  if (!run) return <Badge color="gray">No active run</Badge>;
  if (run.status === 'running') return <Badge color="green">Running</Badge>;
  if (run.status === 'queued') return <Badge color="yellow">Queued</Badge>;
  return <Badge color="gray">{run.status}</Badge>;
}

export default function RunControlTab({ batchId, runControl, snapshotGeneratedAt }: RunControlTabProps) {
  const { confirm } = useGdsConfirm();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [commandBusy, setCommandBusy] = useState<'start' | 'stop' | null>(null);
  const [commandError, setCommandError] = useState('');
  const [optimisticAt, setOptimisticAt] = useState<number | null>(null);

  const activeRun = runControl?.activeRun ?? null;
  const progress = runControl?.progress;
  const enqueued = optimisticAt !== null;
  const busy = commandBusy !== null || enqueued;

  // Clears on whichever comes first: a snapshot generated after the command
  // was enqueued (reconciliation), or the bounded window elapsing (so a
  // delayed/lost snapshot can never leave the buttons stuck disabled).
  useEffect(() => {
    if (optimisticAt === null) return;
    if (snapshotGeneratedAt) {
      const generatedMs = new Date(snapshotGeneratedAt).getTime();
      if (!Number.isNaN(generatedMs) && generatedMs > optimisticAt) {
        setOptimisticAt(null);
        return;
      }
    }
    const remaining = OPTIMISTIC_WINDOW_MS - (Date.now() - optimisticAt);
    if (remaining <= 0) {
      setOptimisticAt(null);
      return;
    }
    const timer = setTimeout(() => setOptimisticAt(null), remaining);
    return () => clearTimeout(timer);
  }, [optimisticAt, snapshotGeneratedAt]);

  const pct =
    activeRun?.progress?.total ? Math.min(100, Math.round(((activeRun.progress.done || 0) / activeRun.progress.total) * 100)) : null;

  async function startBatch() {
    if (busy) return;
    setCommandBusy('start');
    setCommandError('');
    try {
      const data = await apiPost<{ success: boolean; error?: { message?: string } }>('/api/admin/fanmass/commands', {
        type: 'run_control.start_batch',
        payload: { batchId },
      });
      if (data.success) setOptimisticAt(Date.now());
      else setCommandError(data.error?.message || 'Failed to enqueue start command.');
    } catch (err) {
      setCommandError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setCommandBusy(null);
    }
  }

  async function stopBatch() {
    if (busy || !activeRun) return;
    const ok = await confirm({
      title: 'Stop batch',
      message: `Stop "${activeRun.name}"? fanmass will pick this up on its next check-in — this does not stop it immediately.`,
      danger: true,
    });
    if (!ok) return;
    setCommandBusy('stop');
    setCommandError('');
    try {
      const data = await apiPost<{ success: boolean; error?: { message?: string } }>('/api/admin/fanmass/commands', {
        type: 'run_control.stop_batch',
        payload: { batchId, runId: activeRun.runId },
      });
      if (data.success) setOptimisticAt(Date.now());
      else setCommandError(data.error?.message || 'Failed to enqueue stop command.');
    } catch (err) {
      setCommandError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setCommandBusy(null);
    }
  }

  return (
    <AnalyticsSectionCard
      title="Run Control"
      subtitle="Choose the active batch, start or stop directory processing, live worker progress."
    >
      <Stack gap="md">
        <Group gap="md" align="center">
          {statusBadge(activeRun)}
          {activeRun && <Text fw={600}>{activeRun.name}</Text>}
        </Group>

        {activeRun ? (
          <Box>
            <Progress
              value={pct ?? 100}
              striped={pct === null}
              animated={pct === null && !reduceMotion}
              aria-label={pct !== null ? `Batch progress: ${activeRun.progress?.done ?? 0} of ${activeRun.progress?.total ?? 0} processed` : 'Batch progress: in progress, total unknown'}
            />
            {progress?.activeJob && (
              <Text className={styles.jobLine}>
                Worker: {progress.workerOnline ? 'online' : progress.stalled ? 'stalled' : 'offline'}
                {progress.activeJob.label ? ` — ${progress.activeJob.label}` : ''}
              </Text>
            )}
          </Box>
        ) : (
          <Text className={styles.placeholder}>No active run for this batch.</Text>
        )}

        <div aria-live="polite">
          {enqueued && (
            <Text className={styles.enqueuedNote}>
              Command sent — fanmass applies this on its next check-in. This page will update automatically once it does.
            </Text>
          )}
          {commandError && <Text className={styles.errorText}>{commandError}</Text>}
        </div>

        <Group gap="sm">
          <Button onClick={startBatch} disabled={busy || !!activeRun} loading={commandBusy === 'start'}>
            {enqueued && commandBusy === null ? 'Starting…' : 'Start batch'}
          </Button>
          <Button onClick={stopBatch} disabled={busy || !activeRun} color="red" variant="outline" loading={commandBusy === 'stop'}>
            {enqueued && commandBusy === null ? 'Stopping…' : 'Stop batch'}
          </Button>
        </Group>
      </Stack>
    </AnalyticsSectionCard>
  );
}
