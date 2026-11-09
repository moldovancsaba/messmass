import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';
import TerritoryMapCanvas from '@/components/theme/interactive-report/TerritoryMapCanvas';

export const dynamic = 'force-dynamic';

interface MapPageProps {
  params: Promise<{ scopeType: string; identifier: string }>;
}

export async function generateMetadata({ params }: MapPageProps) {
  const { scopeType, identifier } = await params;
  return {
    title: `Territory & Venues Visual Map • ${scopeType.toUpperCase()}: ${identifier} • {messmass}`,
    description: `Interactive territory analytics, fan demographic lenses, and arena map for ${identifier}.`,
  };
}

export default async function ScopedReportMapPage({ params }: MapPageProps) {
  const { scopeType, identifier } = await params;
  const validScopes = ['hashtag', 'partner', 'event'];
  if (!validScopes.includes(scopeType) || !identifier) {
    notFound();
  }

  const data = await getScopedInteractiveReportData({
    type: scopeType as 'hashtag' | 'partner' | 'event',
    identifier,
  });

  if (!data) {
    notFound();
  }

  return (
    <TerritoryMapCanvas
      matches={data.matches || []}
      vision={data.vision}
      partnerSlug={identifier}
      partnerName={data.scope?.name || data.partner?.name || 'Szerencsejáték Zrt.'}
    />
  );
}
