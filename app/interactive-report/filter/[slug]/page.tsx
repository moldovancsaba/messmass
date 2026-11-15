import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScopedInteractiveReportData, isSzrtScopeIdentifier } from '@/lib/interactiveReportAggregator';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import ServerPageGate from '@/components/ServerPageGate';
import { getAdminUser } from '@/lib/auth';
import { hasPageAccess, isPageProtected } from '@/lib/pageAccess';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';
import config from '@/lib/config';
import clientPromise from '@/lib/mongodb';
import { buildFilterReport, filterSlugHashtags } from '@/lib/hashtagReport';
import type { ReportDb } from '@/lib/hashtagReport/measured';
import FanmassDashboardPage from '@/components/hashtagReport/FanmassDashboardPage';

// Built from many events on the first request; allow sufficient duration
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ report?: string; variant?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Filter Report (${slug.slice(0, 8)}) — Interactive Analytics Dashboard | Messmass`,
    description: `Consolidated fan engagement, visual intelligence, and activation metrics for filter ${slug}.`,
  };
}

export default async function FilterInteractiveReportPage({ params, searchParams }: PageProps) {
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

  // The unified report, like every hashtag and the global report (owner 2026-11-14: "this filter should be built
  // exactly the same way as everything"). The previous one stays at `?report=classic`; a saved variant is its layout.
  const { report, variant } = await searchParams;
  if (report !== 'classic' && !variant) {
    const db = (await clientPromise).db(config.dbName) as unknown as ReportDb;
    const tags = await filterSlugHashtags(db, decodeURIComponent(slug));
    if (!tags.length) notFound();
    // A filter of the SZRT campaign hashtag alone shows the vision Fanmass published for the campaign, read from the
    // campaign scope (whose cache is dropped when the figures or the publication change); a filter that adds other
    // hashtags keeps the vision of its own photos, since the campaign's would be the wrong scope
    const campaignTag = tags.every((tag) => isSzrtScopeIdentifier(tag)) ? tags[0] : null;
    const [report, base, campaign] = await Promise.all([
      buildFilterReport(db, tags, slug),
      getScopedInteractiveReportData({ type: 'filter', identifier: slug }).catch(() => null),
      campaignTag ? getScopedInteractiveReportData({ type: 'hashtag', identifier: campaignTag }).catch(() => null) : null,
    ]);
    const withVision = base && campaign?.vision ? { ...base, vision: campaign.vision } : base;
    return <FanmassDashboardPage report={report} base={withVision} />;
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
