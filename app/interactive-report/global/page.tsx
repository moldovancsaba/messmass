import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import ServerPageGate from '@/components/ServerPageGate';
import { getAdminUser } from '@/lib/auth';
import { hasPageAccess, isPageProtected } from '@/lib/pageAccess';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

export const dynamic = 'force-dynamic';

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
export default async function GlobalInteractiveReportPage() {
  const user = await getAdminUser();
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'superadmin'));
  if (!isAdmin) {
    // No password issued yet means it was never shared: there is nothing to show, not even a login
    if (!(await isPageProtected('global-report', GLOBAL_PAGE_ID))) notFound();
    if (!(await hasPageAccess('global-report', GLOBAL_PAGE_ID))) {
      return <ServerPageGate pageId={GLOBAL_PAGE_ID} pageType="global-report" />;
    }
  }

  const data = await getScopedInteractiveReportData({ type: 'global', identifier: GLOBAL_PAGE_ID });
  if (!data) notFound();

  return (
    <main className={styles.pageMain}>
      <InteractiveReportDashboard initialData={data} />
    </main>
  );
}
