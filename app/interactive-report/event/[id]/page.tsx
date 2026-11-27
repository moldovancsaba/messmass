import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import config from '@/lib/config';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { isPageProtected, requirePageAccessDecision } from '@/lib/pageAccess';
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
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ report?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Event ${id} — Interactive Analytics | Messmass`,
    description: `Match-level fan engagement, visual intelligence, and opt-in metrics for event ${id}.`,
  };
}

export default async function EventInteractiveReportPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const projectFilter = ObjectId.isValid(id)
    ? { $or: [{ _id: new ObjectId(id) }, { viewSlug: id }] }
    : { viewSlug: id };
  const projectDoc = await db.collection('projects').findOne(projectFilter, { projection: { _id: 1, viewSlug: 1 } });
  const candidateIds = [
    ...(projectDoc?.viewSlug ? [String(projectDoc.viewSlug)] : []),
    ...(projectDoc?._id ? [String(projectDoc._id)] : []),
    id,
  ];
  const accessDecision = await requirePageAccessDecision('event-report', candidateIds);
  if (!accessDecision.allowed) {
    let gatePageId = projectDoc?.viewSlug ? String(projectDoc.viewSlug) : id;
    for (const candidate of candidateIds) {
      if (await isPageProtected('event-report', candidate)) {
        gatePageId = candidate;
        break;
      }
    }
    return <ServerPageGate pageId={gatePageId} pageType="event-report" />;
  }

  const data = await getScopedInteractiveReportData({
    type: 'event',
    identifier: id,
  });

  if (!data) notFound();

  if (resolvedSearchParams.report === 'classic') {
    return (
      <main className={styles.pageMain}>
        <InteractiveReportDashboard initialData={data} />
      </main>
    );
  }

  const scope = await resolveScopeProjectIds('event', id, undefined, db);
  const report = await buildProjectsReport(db as unknown as ReportDb, scope.campaignProjects, data.scope?.name || id);

  return <FanmassDashboardPage report={report} base={data} />;
}
