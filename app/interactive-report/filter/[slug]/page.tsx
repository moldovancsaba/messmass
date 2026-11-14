import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import ServerPageGate from '@/components/ServerPageGate';
import { getAdminUser } from '@/lib/auth';
import { hasPageAccess, isPageProtected } from '@/lib/pageAccess';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

// Built from many events on the first request; allow sufficient duration
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Filter Report (${slug.slice(0, 8)}) — Interactive Analytics Dashboard | Messmass`,
    description: `Consolidated fan engagement, visual intelligence, and activation metrics for filter ${slug}.`,
  };
}

export default async function FilterInteractiveReportPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const user = await getAdminUser();
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'superadmin'));
  if (!isAdmin) {
    if (await isPageProtected('filter', slug)) {
      if (!(await hasPageAccess('filter', slug))) {
        return <ServerPageGate pageId={slug} pageType="filter" />;
      }
    }
  }

  const data = await getScopedInteractiveReportData({
    type: 'filter',
    identifier: slug,
  });

  if (!data) notFound();

  return (
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={data} />
    </main>
  );
}
