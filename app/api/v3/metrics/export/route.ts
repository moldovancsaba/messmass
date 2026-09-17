// app/api/v3/metrics/export/route.ts
// WHAT: Pull-based REST feed of curated sponsorship metrics, for BI tools to
//     poll on their own schedule -- messmass#232.
// WHY: The org picked a pull model over adopting fanmass's push-model
//     contractVersion convention (2026-09-17) -- BI tools (Tableau, PowerBI,
//     Looker) typically poll a stable endpoint rather than receive pushes.
//     `contractVersion` on the response is still an explicit version
//     identifier, satisfying "schema versioning explicit" without adopting a
//     push shape that doesn't fit this consumer.
// HOW: Org-scoped via the same withOrgContext this issue was blocked on
//     (messmass#395, now fixed) -- a caller only ever sees MetricValues
//     whose organizationId matches their resolved scope.

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';
import connectV3 from '@/lib/mongoose-v3';
import V3MetricValue from '@/lib/models/v3/MetricValue';
import V3MetricDefinition from '@/lib/models/v3/MetricDefinition';
import V3Entity from '@/lib/models/v3/Entity';
import V3Activity from '@/lib/models/v3/Activity';
import { METRIC_CATALOG } from '@/lib/v3/metricCatalog';

const CONTRACT_VERSION = 'messmass.v3-sponsorship-export.v1';
const CATALOG_KEYS = METRIC_CATALOG.map((m) => m.key);

async function handler(req: Request): Promise<NextResponse> {
  await connectV3();
  const orgId = req.headers.get('x-v3-org-id');

  // WHAT: Restricted to this issue's own catalog keys.
  // WHY: v3_metric_values already held substantial unrelated data from an
  //     earlier, separate process (report-field snapshots like
  //     `reportText15`, `userRegistration`) before this sync ever ran --
  //     found live while verifying this route, not assumed. A "curated"
  //     export (the issue's own word) that surfaced every historical key
  //     alongside the 5 actually-classified ones would not be curated at
  //     all; it would just be everything.
  const [values, definitions] = await Promise.all([
    V3MetricValue.find({ organizationId: orgId, metricKey: { $in: CATALOG_KEYS } }).sort({ timestamp: -1 }).limit(1000).lean(),
    V3MetricDefinition.find({ key: { $in: CATALOG_KEYS } }).lean(),
  ]);

  const definitionByKey = new Map(definitions.map((d: any) => [d.key, d]));
  const entityIds = [...new Set(values.map((v: any) => v.entityId?.toString()).filter(Boolean))];
  const activityIds = [...new Set(values.map((v: any) => v.activityId?.toString()).filter(Boolean))];

  const [entities, activities] = await Promise.all([
    V3Entity.find({ _id: { $in: entityIds } }).select('name type').lean(),
    V3Activity.find({ _id: { $in: activityIds } }).select('name type startDate').lean(),
  ]);
  const entityById = new Map(entities.map((e: any) => [e._id.toString(), e]));
  const activityById = new Map(activities.map((a: any) => [a._id.toString(), a]));

  const rows = values.map((v: any) => {
    const definition = definitionByKey.get(v.metricKey);
    const entity = entityById.get(v.entityId?.toString());
    const activity = activityById.get(v.activityId?.toString());
    return {
      metricKey: v.metricKey,
      metricName: definition?.name || v.metricKey,
      metricType: definition?.type || 'number',
      classification: definition?.metadata?.classification || 'raw',
      value: v.value,
      timestamp: v.timestamp,
      entity: entity ? { id: entity._id.toString(), name: entity.name, type: entity.type } : null,
      activity: activity ? { id: activity._id.toString(), name: activity.name, type: activity.type, startDate: activity.startDate } : null,
    };
  });

  return NextResponse.json({
    success: true,
    contractVersion: CONTRACT_VERSION,
    organizationId: orgId,
    generatedAt: new Date().toISOString(),
    rowCount: rows.length,
    metrics: rows,
  });
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  return withOrgContext(req, handler);
}
