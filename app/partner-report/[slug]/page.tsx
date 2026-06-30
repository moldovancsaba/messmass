import { redirect } from 'next/navigation';
import getDb from '@/lib/db';
import { resolvePartnerIdentifier } from '@/lib/partnerIdentifier';
import { PartnerReportView } from '../PartnerReportView';

/**
 * Partner Report Page — public /partner-report/[slug].
 * WHAT: Aggregated reports for partner organizations.
 * WHY: Partners need to see metrics across all their events.
 */
export default async function PartnerReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const { slug } = await params;
  const { variant } = await searchParams;
  const db = await getDb();
  const resolved = await resolvePartnerIdentifier(db as any, slug);
  const canonicalSlug = resolved?.canonicalSlug || slug;

  if (resolved?.canonicalSlug && resolved.canonicalSlug !== slug) {
    redirect(`/partner-report/${resolved.canonicalSlug}${variant ? `?variant=${encodeURIComponent(variant)}` : ''}`);
  }

  return <PartnerReportView slug={canonicalSlug} variant={variant || null} />;
}
