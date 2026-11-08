import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInteractiveReportData } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/interactive-report/InteractiveReportDashboard';
import styles from '@/components/interactive-report/interactive-report.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ partnerSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { partnerSlug } = await params;
  const isSzrt =
    partnerSlug.toLowerCase() === 'szrt' ||
    partnerSlug.toLowerCase() === 'szerencsejatek' ||
    partnerSlug === 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd';

  const title = isSzrt
    ? 'Szerencsejáték Zrt. — Interactive Analytics Dashboard | Messmass'
    : 'Interactive Partner Report | Messmass';

  return {
    title,
    description: 'Real-time interactive fan engagement and marketing opt-in analytics across national sports activations.',
  };
}

export default async function InteractiveReportPage({ params }: PageProps) {
  const { partnerSlug } = await params;
  if (!partnerSlug) {
    notFound();
  }

  const data = await getInteractiveReportData(partnerSlug);
  if (!data) {
    notFound();
  }

  return (
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={data} />
    </main>
  );
}
