// lib/eventAggregation.ts
// WHAT: Incremental per-event analytics aggregation, callable from both the cron
//     route and the CLI script.
// WHY: This logic existed only inside `scripts/aggregateAnalytics.ts`, so the cron
//     route could not run it and called `lib/analytics-aggregator.ts` instead —
//     which writes a time-bucketed shape no working reader queries, and which
//     would double-count if mixed into this collection (audit F-023). Extracting
//     the per-event path gives the cron something correct to call and keeps one
//     implementation rather than two, which is the mistake F-015 was.
// HOW: Incremental on `projects.updatedAt >= lastRunTime`, capped per run, upserted
//     by `projectId` so re-running is safe and never deletes.

import { Db } from 'mongodb';
import clientPromise from './mongodb';
import config from './config';
import { aggregateEventMetrics, isProjectAggregatable } from './analyticsCalculator';
import type { AnalyticsAggregate } from './analytics.types';

const LAST_RUN_KEY = 'analytics_aggregation_last_run';
const MAX_PROJECTS_PER_RUN = 200;
const BATCH_SIZE = 50;

export interface EventAggregationResult {
  projectsFound: number;
  projectsProcessed: number;
  projectsSkipped: number;
  aggregatesWritten: number;   // inserted + updated, counted from the driver
  aggregatesUnchanged: number; // matched but identical
  durationMs: number;
  status: 'success' | 'partial' | 'noop';
}

async function getLastRunTime(db: Db): Promise<Date> {
  const setting = await db.collection('system_settings').findOne({ key: LAST_RUN_KEY });
  if (setting?.value) return new Date(setting.value as string);
  // No previous run: start from a week back rather than the whole history, so a
  // first run cannot stall on every project ever created.
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return sevenDaysAgo;
}

async function setLastRunTime(db: Db, when: Date): Promise<void> {
  await db.collection('system_settings').updateOne(
    { key: LAST_RUN_KEY },
    { $set: { key: LAST_RUN_KEY, value: when.toISOString(), updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}

// WHAT: Run one incremental aggregation pass.
// WHY: `forceRefresh` reprocesses everything from epoch rather than since the last
//     run — needed after a change to the metric calculation, useless otherwise.
export async function runEventAggregation(
  options: { forceRefresh?: boolean } = {}
): Promise<EventAggregationResult> {
  const started = Date.now();
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const runAt = new Date();

  const since = options.forceRefresh ? new Date(0) : await getLastRunTime(db);

  const projects = await db
    .collection('projects')
    .find({ updatedAt: { $gte: since.toISOString() } })
    .sort({ updatedAt: 1 })
    .limit(MAX_PROJECTS_PER_RUN)
    .toArray();

  if (projects.length === 0) {
    await setLastRunTime(db, runAt);
    return {
      projectsFound: 0, projectsProcessed: 0, projectsSkipped: 0,
      aggregatesWritten: 0, aggregatesUnchanged: 0,
      durationMs: Date.now() - started, status: 'noop',
    };
  }

  const aggregates: AnalyticsAggregate[] = [];
  let skipped = 0;

  for (const project of projects) {
    // Projects without attendance or image counts cannot produce a meaningful
    // aggregate. They are skipped, not failed — this is a data-entry gap, and
    // counting it as an error made every run look broken.
    if (!isProjectAggregatable(project as never)) {
      skipped++;
      continue;
    }
    try {
      aggregates.push(aggregateEventMetrics(project as never, 'event'));
    } catch {
      skipped++;
    }
  }

  let written = 0;
  let unchanged = 0;

  for (let i = 0; i < aggregates.length; i += BATCH_SIZE) {
    const batch = aggregates.slice(i, i + BATCH_SIZE);
    const result = await db.collection('analytics_aggregates').bulkWrite(
      batch.map((aggregate) => {
        // WHAT: Drop the generated _id from the replacement.
        // WHY: aggregateEventMetrics mints `_id: new ObjectId()` on every call. A
        //     replaceOne matched on projectId then tries to change the existing
        //     document's immutable _id and Mongo rejects it. With `ordered: false`
        //     those rejections are per-operation and silent, so inserts for new
        //     projects succeeded while every update to an existing aggregate
        //     failed — which is why the data appeared frozen while new events kept
        //     appearing. Omitting _id lets Mongo keep the existing one on update
        //     and generate one on insert.
        const { _id, ...withoutId } = aggregate as AnalyticsAggregate & { _id?: unknown };
        void _id;
        return {
          replaceOne: {
            filter: { projectId: aggregate.projectId },
            replacement: withoutId as never,
            upsert: true,
          },
        };
      }),
      { ordered: false }
    );
    // Counted from all three driver fields. The previous implementation reported
    // only upserted+modified, which showed 0 for a run that had in fact written
    // 47 documents — a job that under-reports its own work is why nobody noticed
    // aggregation had stopped.
    written += (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
    unchanged += Math.max(0, (result.matchedCount ?? 0) - (result.modifiedCount ?? 0));
  }

  await setLastRunTime(db, runAt);

  return {
    projectsFound: projects.length,
    projectsProcessed: aggregates.length,
    projectsSkipped: skipped,
    aggregatesWritten: written,
    aggregatesUnchanged: unchanged,
    durationMs: Date.now() - started,
    status: skipped > 0 ? 'partial' : 'success',
  };
}
