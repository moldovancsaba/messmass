// app/interactive-report/[partnerSlug]/map/page.tsx
// Dedicated Geographic Intelligence & Hungary Territory Analytics Map Page

import { notFound } from 'next/navigation';
import { getInteractiveReportData } from '@/lib/interactiveReportAggregator';
import TerritoryMapCanvas from '@/components/theme/interactive-report/TerritoryMapCanvas';

export const dynamic = 'force-dynamic';

interface MapPageProps {
  params: Promise<{ partnerSlug: string }>;
}

export async function generateMetadata({ params }: MapPageProps) {
  const { partnerSlug } = await params;
  return {
    title: `Territory & Venues Visual Map • ${partnerSlug.toUpperCase()} • {messmass}`,
    description: `Interactive territory analytics, fan demographic lenses, and arena map for ${partnerSlug.toUpperCase()}.`,
  };
}

export default async function InteractiveReportMapPage({ params }: MapPageProps) {
  const { partnerSlug } = await params;

  if (!partnerSlug) {
    notFound();
  }

  const data = await getInteractiveReportData(partnerSlug);
  if (!data) {
    notFound();
  }

  return (
    <TerritoryMapCanvas
      matches={data.matches || []}
      vision={data.vision}
      partnerSlug={partnerSlug}
      partnerName={data.partner?.name || 'Szerencsejáték Zrt.'}
    />
  );
}
