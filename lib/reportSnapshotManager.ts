import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import config from "@/lib/config";
import { InteractiveReportData } from "@/components/theme/interactive-report/types";
import { revalidateTag } from "next/cache";

export interface ReportSnapshotQuery {
  scopeType: "hashtag" | "partner" | "event";
  scopeIdentifier: string;
  sportFilter?: string;
  organizationId?: string;
}

export interface SnapshotResult {
  data: InteractiveReportData;
  cached: boolean;
  timestamp: string;
}

// In-flight request stampede deduplication lock (INV-003)
const inFlightSnapshots = new Map<string, Promise<SnapshotResult>>();

function buildSnapshotKey(query: ReportSnapshotQuery): string {
  const org = query.organizationId || "global";
  const type = query.scopeType;
  const id = query.scopeIdentifier.toLowerCase().trim();
  const sport = (query.sportFilter || "all").toLowerCase().trim();
  return `${org}:${type}:${id}:${sport}`;
}

/**
 * Retrieves a pre-computed materialized snapshot from the report_snapshots collection.
 * Enforces multi-tenant isolation (INV-001) and TTL validity.
 */
export async function getCachedReportSnapshot(
  query: ReportSnapshotQuery
): Promise<InteractiveReportData | null> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const cleanId = query.scopeIdentifier.toLowerCase().trim();
  const sport = query.sportFilter || "all";

  const snapshotQuery: any = {
    scopeType: query.scopeType,
    $or: [{ scopeIdentifier: cleanId }, { identifier: cleanId }],
    sportFilter: sport,
    expiresAt: { $gt: new Date() },
  };

  if (query.organizationId) {
    if (ObjectId.isValid(query.organizationId)) {
      snapshotQuery.$and = [
        {
          $or: [
            { organizationId: new ObjectId(query.organizationId) },
            { organizationId: query.organizationId },
          ],
        },
      ];
    } else {
      snapshotQuery.organizationId = query.organizationId;
    }
  }

  const cached = await db.collection("report_snapshots").findOne(snapshotQuery);
  if (!cached) return null;
  return (cached.metrics || cached.data) as InteractiveReportData;
}

/**
 * Stores computed interactive report aggregates into report_snapshots with TTL.
 * Uses atomic replaceOne with upsert (INV-003) to guarantee deterministic state idempotency.
 */
export async function saveReportSnapshot(
  query: ReportSnapshotQuery,
  data: InteractiveReportData,
  ttlSeconds: number = 86400 // Default 24 hours
): Promise<void> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const cleanId = query.scopeIdentifier.toLowerCase().trim();
  const sport = query.sportFilter || "all";

  const filter: any = {
    scopeType: query.scopeType,
    scopeIdentifier: cleanId,
    sportFilter: sport,
  };

  if (query.organizationId) {
    filter.organizationId = query.organizationId;
  }

  const snapDoc: any = {
    organizationId: query.organizationId || "global",
    scopeType: query.scopeType,
    scopeIdentifier: cleanId,
    identifier: cleanId,
    sportFilter: sport,
    snapshotVersion: 1,
    version: 1,
    metrics: data,
    data: data,
    calculatedAt: now,
    createdAt: now.toISOString(),
    expiresAt: expiresAt,
  };

  await db.collection("report_snapshots").replaceOne(filter, snapDoc, { upsert: true });
}

/**
 * Cache-aside resolution with stampede protection lock.
 * Decouples heavy multi-event aggregation from HTTP requests.
 */
export async function getOrGenerateSnapshot(
  query: ReportSnapshotQuery,
  generator: () => Promise<InteractiveReportData | null>,
  forceRefresh: boolean = false
): Promise<SnapshotResult | null> {
  const key = buildSnapshotKey(query);

  // 1. Check persistent DB cache first if not forced refresh
  if (!forceRefresh) {
    const cached = await getCachedReportSnapshot(query);
    if (cached) {
      return {
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // 2. Prevent cache stampede: check if another worker is already computing this snapshot
  const pending = inFlightSnapshots.get(key);
  if (pending) {
    return pending;
  }

  // 3. Acquire lock and execute generation
  const computePromise = (async () => {
    try {
      const freshData = await generator();
      if (!freshData) return null;

      await saveReportSnapshot(query, freshData);
      return {
        data: freshData,
        cached: false,
        timestamp: new Date().toISOString(),
      };
    } finally {
      inFlightSnapshots.delete(key);
    }
  })();

  inFlightSnapshots.set(key, computePromise as Promise<SnapshotResult>);
  return computePromise;
}

/**
 * Invalidates cached snapshots and fires Next.js On-Demand Cache Revalidation.
 */
export async function invalidateReportSnapshot(
  query: Pick<ReportSnapshotQuery, "scopeType" | "scopeIdentifier" | "organizationId">
): Promise<void> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const cleanId = query.scopeIdentifier.toLowerCase().trim();
  const deleteFilter: any = {
    scopeType: query.scopeType,
    $or: [{ scopeIdentifier: cleanId }, { identifier: cleanId }],
  };

  if (query.organizationId) {
    deleteFilter.organizationId = query.organizationId;
  }

  await db.collection("report_snapshots").deleteMany(deleteFilter);

  // Invalidate in-flight map
  const prefix = `${query.organizationId || "global"}:${query.scopeType}:${cleanId}:`;
  for (const k of inFlightSnapshots.keys()) {
    if (k.startsWith(prefix)) {
      inFlightSnapshots.delete(k);
    }
  }

  try {
    revalidateTag(`report-${cleanId}`);
  } catch {
    // revalidateTag is only valid in server request lifecycle
  }
}
