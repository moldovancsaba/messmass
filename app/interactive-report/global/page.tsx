import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import ServerPageGate from '@/components/ServerPageGate';
import { getAdminUser } from '@/lib/auth';
import { hasPageAccess, isPageProtected } from '@/lib/pageAccess';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';
import config from '@/lib/config';
import clientPromise from '@/lib/mongodb';
import { buildAllEventsReport } from '@/lib/hashtagReport';
import type { ReportDb } from '@/lib/hashtagReport/measured';
import HashtagReportView from '@/components/hashtagReport/HashtagReportView';

export const dynamic = 'force-dynamic';
// The first load builds the report from every project (it is cached for an hour afterwards), which needs more
// than the default 15 seconds.
export const maxDuration = 60;

const GLOBAL_PAGE_ID = 'all';

export const metadata: Metadata = {
  title: 'All data — Interactive Analytics Dashboard | Messmass',
  description: 'Everything Messmass collects: fan engagement, photo activation, opt-in conversion and Fanmass visual intelligence across all events, partners and organizations.',
};

/**
 * The global report (public alias /report/global): the same interactive report as a hashtag, partner or event, for
 * everything Messmass collects. It spans every client, so it is never public: an admin session opens it, anyone else
 * needs the page password issued from its Reports workspace (/admin/global/reports), shared like every other report.
 */
interface PageProps {
  searchParams: Promise<{ report?: string; variant?: string }>;
}

export default async function GlobalInteractiveReportPage({ searchParams }: PageProps) {
  const user = await getAdminUser();
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'superadmin'));
  if (!isAdmin) {
    // No password issued yet means it was never shared: there is nothing to show, not even a login
    if (!(await isPageProtected('global-report', GLOBAL_PAGE_ID))) notFound();
    if (!(await hasPageAccess('global-report', GLOBAL_PAGE_ID))) {
      return <ServerPageGate pageId={GLOBAL_PAGE_ID} pageType="global-report" />;
    }
  }

  // Every event together, from Fanmass data and Messmass calculations only (owner 2026-11-14), like the hashtag report.
  // The previous report, partly typed in by hand, stays at `?report=classic`; a saved variant is a layout of that one.
  const { report, variant } = await searchParams;
  if (report !== 'classic' && !variant) {
    const client = await clientPromise;
    return <HashtagReportView report={await buildAllEventsReport(client.db(config.dbName) as unknown as ReportDb)} />;
  }

  const data = await getScopedInteractiveReportData({ type: 'global', identifier: GLOBAL_PAGE_ID });
  if (!data) notFound();

  return (
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={data} />
    </main>
  );
}
