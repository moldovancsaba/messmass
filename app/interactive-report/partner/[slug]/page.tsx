import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import config from '@/lib/config';
import clientPromise from '@/lib/mongodb';
import { resolvePartnerIdentifier } from '@/lib/partnerIdentifier';
import { requirePageAccessDecision } from '@/lib/pageAccess';
import ServerPageGate from '@/components/ServerPageGate';
import { getScopedInteractiveReportData, resolveScopeProjectIds } from '@/lib/interactiveReportAggregator';
import { buildProjectsReport } from '@/lib/hashtagReport';
import type { ReportDb } from '@/lib/hashtagReport/measured';
import FanmassDashboardPage from '@/components/hashtagReport/FanmassDashboardPage';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

// Built from many events on the first request; the host default of 15 seconds is too short for it
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ report?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} — Interactive Partner Analytics | Messmass`,
    description: `Consolidated fan engagement, visual intelligence, and opt-in metrics for ${slug}.`,
  };
}

export default async function PartnerInteractiveReportPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const resolvedPartner = await resolvePartnerIdentifier(db as any, slug);
  const canonicalSlug = resolvedPartner?.canonicalSlug || slug;
  const accessDecision = await requirePageAccessDecision('partner-report', [canonicalSlug, slug]);
  if (!accessDecision.allowed) {
    return <ServerPageGate pageId={canonicalSlug} pageType="partner-report" />;
  }

  const data = await getScopedInteractiveReportData({
    type: 'partner',
    identifier: slug,
  });

  if (!data) notFound();

  if (resolvedSearchParams.report === 'classic') {
    return (
      <main className={styles.pageMain}>
        <InteractiveReportDashboard initialData={data} />
      </main>
    );
  }

  const scope = await resolveScopeProjectIds('partner', slug, undefined, db);
  const report = await buildProjectsReport(db as unknown as ReportDb, scope.campaignProjects, data.partner?.name || slug);

  return <FanmassDashboardPage report={report} base={data} />;
}
