import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Event ${id} — Interactive Analytics | Messmass`,
    description: `Match-level fan engagement, visual intelligence, and opt-in metrics for event ${id}.`,
  };
}

export default async function EventInteractiveReportPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const data = await getScopedInteractiveReportData({
    type: 'event',
    identifier: id,
  });

  if (!data) notFound();

  return (
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={data} />
    </main>
  );
}
