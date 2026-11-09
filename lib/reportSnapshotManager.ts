import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { InteractiveReportData } from '@/components/theme/interactive-report/types';
import { revalidateTag } from 'next/cache';

export interface ReportSnapshotQuery {
  scopeType: 'hashtag' | 'partner' | 'event';
  scopeIdentifier: string;
  sportFilter?: string;
  organizationId?: string;
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

  const snapshotQuery: any = {
    scopeType: query.scopeType,
    scopeIdentifier: query.scopeIdentifier.toLowerCase().trim(),
    sportFilter: query.sportFilter || 'all',
    expiresAt: { $gt: new Date() },
  };

  if (query.organizationId) {
    snapshotQuery.organizationId = new ObjectId(query.organizationId);
  }

  const cached = await db.collection('report_snapshots').findOne(snapshotQuery);
  return (cached?.data as InteractiveReportData) || null;
}

/**
 * Stores computed interactive report aggregates into report_snapshots with TTL.
 * Uses atomic upsert ($updateOne with upsert) to prevent write races.
 */
export async function saveReportSnapshot(
  query: ReportSnapshotQuery,
  data: InteractiveReportData,
  ttlSeconds: number = 3600
): Promise<void> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  const snapDoc: any = {
    scopeType: query.scopeType,
    scopeIdentifier: query.scopeIdentifier.toLowerCase().trim(),
    sportFilter: query.sportFilter || 'all',
    data,
    calculatedAt: now,
    expiresAt,
    version: 1,
  };

  if (query.organizationId) {
    snapDoc.organizationId = new ObjectId(query.organizationId);
  }

  await db.collection('report_snapshots').updateOne(
    {
      scopeType: query.scopeType,
      scopeIdentifier: query.scopeIdentifier.toLowerCase().trim(),
      sportFilter: query.sportFilter || 'all',
    },
    { $set: snapDoc },
    { upsert: true }
  );
}

/**
 * Invalidates cached snapshots and fires Next.js On-Demand Cache Revalidation.
 */
export async function invalidateReportSnapshot(
  query: Pick<ReportSnapshotQuery, 'scopeType' | 'scopeIdentifier' | 'organizationId'>
): Promise<void> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const deleteFilter: any = {
    scopeType: query.scopeType,
    scopeIdentifier: query.scopeIdentifier.toLowerCase().trim(),
  };

  if (query.organizationId) {
    deleteFilter.organizationId = new ObjectId(query.organizationId);
  }

  await db.collection('report_snapshots').deleteMany(deleteFilter);

  try {
    revalidateTag(`report-${query.scopeIdentifier.toLowerCase().trim()}`);
  } catch {
    // revalidateTag is only valid in server request lifecycle
  }
}
