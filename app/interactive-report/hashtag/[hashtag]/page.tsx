import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ hashtag: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { hashtag } = await params;
  return {
    title: `#${hashtag} — Interactive Analytics Dashboard | Messmass`,
    description: `Consolidated fan engagement, visual intelligence, and opt-in metrics for campaign #${hashtag}.`,
  };
}

export default async function HashtagInteractiveReportPage({ params }: PageProps) {
  const { hashtag } = await params;
  if (!hashtag) notFound();

  const data = await getScopedInteractiveReportData({
    type: 'hashtag',
    identifier: hashtag,
  });

  if (!data) notFound();

  return (
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={data} />
    </main>
  );
}
