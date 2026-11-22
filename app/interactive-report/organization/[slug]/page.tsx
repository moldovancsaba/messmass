import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import config from '@/lib/config';
import clientPromise from '@/lib/mongodb';
import { getScopedInteractiveReportData, resolveScopeProjectIds } from '@/lib/interactiveReportAggregator';
import { buildProjectsReport } from '@/lib/hashtagReport';
import type { ReportDb } from '@/lib/hashtagReport/measured';
import { matchesVariantEventFilter, type CompetitionFilter } from '@/lib/sportCompetitions';
import FanmassDashboardPage from '@/components/hashtagReport/FanmassDashboardPage';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import ServerPageGate from '@/components/ServerPageGate';
import { getAdminUser } from '@/lib/auth';
import { hasPageAccess, isPageProtected } from '@/lib/pageAccess';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ report?: string; variant?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  return {
    title: `Organization Report (${decoded}) — Interactive Analytics Dashboard | Messmass`,
    description: `Consolidated fan engagement, partner breakdown, and activation metrics for organization ${decoded}.`,
  };
}

export default async function OrganizationInteractiveReportPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const decoded = decodeURIComponent(slug);
  const user = await getAdminUser();
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'superadmin'));
  if (!isAdmin) {
    if (await isPageProtected('organization-report', decoded)) {
      if (!(await hasPageAccess('organization-report', decoded))) {
        return <ServerPageGate pageId={decoded} pageType="organization-report" />;
      }
    }
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const data = await getScopedInteractiveReportData({
    type: 'organization',
    identifier: decoded,
  });

  if (!data) notFound();

  if (resolvedSearchParams.report === 'classic') {
    return (
      <main className={styles.pageMain}>
        <InteractiveReportDashboard initialData={data} />
      </main>
    );
  }

  const client = await clientPromise;
  const db = client.db(config.dbName);
  const scope = await resolveScopeProjectIds('organization', decoded, undefined, db);

  let targetProjects = scope.campaignProjects;
  let scopedBase = data;
  if (resolvedSearchParams.variant) {
    const variantDoc = await db.collection('report_variants').findOne({
      ownerType: 'organization',
      ownerId: scope.scopeHeader.id,
      slug: resolvedSearchParams.variant,
    });
    if (variantDoc?.eventFilter) {
      const evFilter = variantDoc.eventFilter as CompetitionFilter;
      targetProjects = scope.campaignProjects.filter((p) => matchesVariantEventFilter(p, evFilter));
      const allowedIds = new Set(targetProjects.map((p) => String(p._id)));
      const allowedNames = new Set(targetProjects.map((p) => String(p.eventName || '').toLowerCase().trim()));
      scopedBase = {
        ...data,
        scope: data.scope
          ? { ...data.scope, name: `${data.scope.name} — ${String(variantDoc.name)}` }
          : undefined,
        matches: data.matches.filter((m) => allowedIds.has(m.id) || allowedNames.has((m.matchName || '').toLowerCase().trim())),
      };
    }
  }

  const report = await buildProjectsReport(db as unknown as ReportDb, targetProjects, scopedBase.scope?.name || decoded);

  return <FanmassDashboardPage report={report} base={scopedBase} />;
}
