import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ scopeType: string; identifier: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { scopeType, identifier } = await params;
  const validScopes = ['hashtag', 'partner', 'event'];
  if (!validScopes.includes(scopeType)) {
    return { title: 'Report Not Found' };
  }

  const isSzrt =
    identifier.toLowerCase() === 'szrt' ||
    identifier.toLowerCase() === 'szerencsejatek' ||
    identifier.toLowerCase() === 'tippmixreport2026';

  const title = isSzrt
    ? 'Szerencsejáték Zrt. — Interactive Analytics Dashboard | Messmass'
    : `${scopeType.toUpperCase()}: ${identifier} — Interactive Report | Messmass`;

  return {
    title,
    description:
      'Real-time interactive fan engagement and marketing opt-in analytics across national sports activations.',
  };
}

export default async function ScopedReportPage({ params }: PageProps) {
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
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={data} />
    </main>
  );
}
