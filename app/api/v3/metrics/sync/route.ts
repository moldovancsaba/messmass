// app/api/v3/metrics/sync/route.ts
// WHAT: Seed the metric catalog and materialize MetricValues for every
//     eligible activity -- messmass#232.
// WHY: This is what actually populates v3_metric_definitions/
//     v3_metric_values, both empty before this (checked against production).
//     Admin-only and org-agnostic (unlike the export route below) since
//     materializing writes to every activity regardless of org, mirroring
//     how the existing project/partner sync (lib/v3/syncEngine.ts) already
//     runs without per-org scoping -- it is a data-pipeline operation, not a
//     per-tenant read.

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { seedMetricDefinitions } from '@/lib/v3/metricCatalog';
import { materializeAllActivities } from '@/lib/v3/metricMaterializer';

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const definitionsWritten = await seedMetricDefinitions();
    const result = await materializeAllActivities();
    return NextResponse.json({ success: true, definitionsWritten, ...result });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to sync v3 metrics.' }, { status: 500 });
  }
}
