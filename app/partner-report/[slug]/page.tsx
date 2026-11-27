import { redirect } from 'next/navigation';
import getDb from '@/lib/db';
import { resolvePartnerIdentifier } from '@/lib/partnerIdentifier';
import { isPageProtected, requirePageAccessDecision } from '@/lib/pageAccess';
import { PartnerReportView } from '../PartnerReportView';
import ServerPageGate from '@/components/ServerPageGate';

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

  // WHAT: Enforce the partner report's page password before rendering anything.
  // WHY: F-001 — 63 partner reports have a password configured and none of them
  //     enforced it, in the browser or on the server. This is a server component,
  //     so the check happens before any partner data is fetched or streamed; there
  //     is no client gate to bypass because the data never leaves the server on the
  //     unauthorised path. A partner with no password configured is unaffected.
  const variantPageId = variant ? `${canonicalSlug}::variant=${variant}` : null;
  const candidateIds = variantPageId ? [variantPageId, canonicalSlug] : [canonicalSlug];
  const decision = await requirePageAccessDecision('partner-report', candidateIds);
  if (!decision.allowed) {
    const gatePageId =
      variantPageId && (await isPageProtected('partner-report', variantPageId))
        ? variantPageId
        : canonicalSlug;
    return <ServerPageGate pageId={gatePageId} pageType="partner-report" />;
  }

  return <PartnerReportView slug={canonicalSlug} variant={variant || null} />;
}
