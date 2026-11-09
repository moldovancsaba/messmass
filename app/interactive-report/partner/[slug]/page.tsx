import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} — Interactive Partner Analytics | Messmass`,
    description: `Consolidated fan engagement, visual intelligence, and opt-in metrics for ${slug}.`,
  };
}

export default async function PartnerInteractiveReportPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const data = await getScopedInteractiveReportData({
    type: 'partner',
    identifier: slug,
  });

  if (!data) notFound();

  return (
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={data} />
    </main>
  );
}
