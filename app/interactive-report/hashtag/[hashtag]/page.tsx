import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import config from '@/lib/config';
import clientPromise from '@/lib/mongodb';
import { getAdminUser } from '@/lib/auth';
import { hasPageAccess, isPageProtected } from '@/lib/pageAccess';
import { getScopedInteractiveReportData, isSzrtScopeIdentifier } from '@/lib/interactiveReportAggregator';
import { buildHashtagReport } from '@/lib/hashtagReport';
import type { ReportDb } from '@/lib/hashtagReport/measured';
import HashtagReportView from '@/components/hashtagReport/HashtagReportView';
import InteractiveReportDashboard from '@/components/theme/interactive-report/InteractiveReportDashboard';
import ServerPageGate from '@/components/ServerPageGate';
import styles from '@/components/theme/interactive-report/interactive-report.module.css';

// Built from many events on the first request; the host default of 15 seconds is too short for it
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ hashtag: string }>;
  searchParams: Promise<{ report?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { hashtag } = await params;
  return {
    title: `#${hashtag} — Hashtag report | Messmass`,
    description: `What Fanmass and Camera measured across the events of #${hashtag}, and what Messmass calculates from it.`,
  };
}

export default async function HashtagInteractiveReportPage({ params, searchParams }: PageProps) {
  const hashtag = decodeURIComponent((await params).hashtag || '').trim().replace(/^#/, '');
  if (!hashtag) notFound();

  // The SZRT campaign keeps its previous report until its events carry the hashtag and its photos are linked to
  // them; `?report=unified` shows what the unified report makes of it today. Every other hashtag gets the unified report.
  if (isSzrtScopeIdentifier(hashtag) && (await searchParams).report !== 'unified') {
    const data = await getScopedInteractiveReportData({ type: 'hashtag', identifier: hashtag });
    if (!data) notFound();
    return (
      <main className={styles.pageMain}>
        <InteractiveReportDashboard initialData={data} />
      </main>
    );
  }

  // Public unless the hashtag has a page password, like every other hashtag report; an admin session always passes
  const user = await getAdminUser();
  const isAdmin = Boolean(user && (user.role === 'admin' || user.role === 'superadmin'));
  if (!isAdmin && (await isPageProtected('hashtag', hashtag)) && !(await hasPageAccess('hashtag', hashtag))) {
    return <ServerPageGate pageId={hashtag} pageType="hashtag" />;
  }

  const client = await clientPromise;
  const report = await buildHashtagReport(client.db(config.dbName) as unknown as ReportDb, hashtag);
  return <HashtagReportView report={report} />;
}
