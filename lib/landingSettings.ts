/**
 * WHAT: Landing page settings (which report drives main page, optional static snapshot)
 * WHY: Admin chooses report and can generate static content so messmass.com doesn't hit DB
 */

import { getDb } from './db';

const SETTINGS_ID = 'landingPage';

export interface LandingPageSettings {
  landingReportSlug: string;
  staticSnapshot?: StaticLandingSnapshot;
  generatedAt?: string; // ISO
}

export interface StaticLandingSnapshot {
  blocks: Array<{
    id: string;
    title: string;
    showTitle: boolean;
    order: number;
    charts: Array<{ chartId: string; width: number; order: number }>;
    blockAspectRatio?: string;
    tableHeightMultiplier?: number;
  }>;
  chartResults: Array<{ chartId: string; result: Record<string, unknown> }>;
  gridSettings: { desktop: number; tablet: number; mobile: number };
  style?: Record<string, string> | null;
  projectStats?: Record<string, unknown>;
}

export const DEFAULT_LANDING_SLUG = '84224c76-da45-4cb9-8185-9c27e2a4c466';

export async function getLandingSettings(): Promise<LandingPageSettings | null> {
  const db = await getDb();
  const doc = await db.collection('settings').findOne({ _id: SETTINGS_ID } as any);
  if (!doc) return null;
  return {
    landingReportSlug: doc.landingReportSlug ?? DEFAULT_LANDING_SLUG,
    staticSnapshot: doc.staticSnapshot ?? undefined,
    generatedAt: doc.generatedAt ?? undefined,
  };
}

export async function setLandingReportSlug(slug: string): Promise<void> {
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: SETTINGS_ID } as any,
    {
      $set: {
        landingReportSlug: slug,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}

export async function setLandingStaticSnapshot(snapshot: StaticLandingSnapshot): Promise<void> {
  const db = await getDb();
  await db.collection('settings').updateOne(
    { _id: SETTINGS_ID } as any,
    {
      $set: {
        staticSnapshot: snapshot,
        generatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}
