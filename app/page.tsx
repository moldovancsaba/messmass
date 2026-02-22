import type { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';
import { getLandingSettings } from '@/lib/landingSettings';
import type { StaticLandingSnapshot } from '@/lib/landingSettings';

/**
 * WHAT: Main page (messmass.com) — same report as /report/[slug] for content and style
 * WHY: Style and content editable only in the report; no copies; uses ReportContent + same APIs
 * HOW: Snapshot loaded on server so first paint has static content; no client fetch required.
 */
export const metadata: Metadata = {
  title: 'MessMass — Sovereign Decision Intelligence',
  description: 'Data privacy and agentic AI without compromises. Your data stays with you; the AI comes to it. Local-first decision intelligence for enterprises.',
  openGraph: {
    title: 'MessMass — Sovereign Decision Intelligence',
    description: 'Data privacy and agentic AI without compromises. Local-first agentic AI for data-driven companies.',
  },
};
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Ensure snapshot is JSON-serializable and block ids are strings (MongoDB may return ObjectId) */
function normalizeSnapshot(snap: StaticLandingSnapshot | undefined): StaticLandingSnapshot | null {
  if (!snap?.blocks?.length) return null;
  const blocks = snap.blocks.map((b) => ({
    ...b,
    id: typeof b.id === 'string' ? b.id : String((b as any).id ?? b.order ?? ''),
  }));
  return {
    ...snap,
    blocks,
    chartResults: Array.isArray(snap.chartResults) ? snap.chartResults : [],
  };
}

export default async function HomePage() {
  const settings = await getLandingSettings();
  const snapshot = normalizeSnapshot(settings?.staticSnapshot);
  const initialStaticPayload =
    snapshot != null
      ? {
          staticSnapshot: snapshot,
          landingReportSlug: settings?.landingReportSlug ?? '',
          generatedAt: settings?.generatedAt ?? null,
        }
      : null;

  return <LandingPage initialStaticPayload={initialStaticPayload} />;
}
