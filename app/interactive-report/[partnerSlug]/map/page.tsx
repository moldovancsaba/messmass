// app/interactive-report/[partnerSlug]/map/page.tsx
// Dedicated venue and territory map page for one report scope

import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getInteractiveReportData } from '@/lib/interactiveReportAggregator';
import TerritoryMapCanvas from '@/components/theme/interactive-report/TerritoryMapCanvas';
import { getReportSlug } from '@/components/theme/interactive-report/reportSlug';

// Built from many events on the first request; the host default of 15 seconds is too short for it
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface MapPageProps {
  params: Promise<{ partnerSlug: string }>;
}

// generateMetadata and the page render in the same request and share one lookup
const loadReport = cache(getInteractiveReportData);

export async function generateMetadata({ params }: MapPageProps) {
  const { partnerSlug } = await params;

  let scopeName: string | undefined;
  try {
    const data = await loadReport(partnerSlug);
    scopeName = data?.scope?.name || data?.partner?.name || undefined;
  } catch {
    scopeName = undefined;
  }

  // The title names the resolved scope; without one it stays generic rather than echoing the URL slug
  if (!scopeName) {
    return {
      title: 'Territory & Venues Map • {messmass}',
      description: 'Interactive venue and territory map.',
    };
  }

  return {
    title: `Territory & Venues Map • ${scopeName} • {messmass}`,
    description: `Interactive venue and territory map for ${scopeName}.`,
  };
}

export default async function InteractiveReportMapPage({ params }: MapPageProps) {
  const { partnerSlug } = await params;

  if (!partnerSlug) {
    notFound();
  }

  const data = await loadReport(partnerSlug);
  if (!data) {
    notFound();
  }

  return (
    <TerritoryMapCanvas
      matches={data.matches || []}
      vision={data.vision}
      // Links built from this slug must address the scope the report was resolved for
      // (hashtag scopes need their hashtag- prefix; a bare hashtag reads as a partner)
      partnerSlug={getReportSlug(data) ?? undefined}
      partnerName={data.partner?.name || data.scope?.name || undefined}
      scope={data.scope}
    />
  );
}
