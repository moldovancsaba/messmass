import { notFound } from 'next/navigation';
import { isPageProtected, requirePageAccessDecision } from '@/lib/pageAccess';
import ServerPageGate from '@/components/ServerPageGate';
import OrganizationReportView from '../OrganizationReportView';

/**
 * Organization Report Page
 * WHAT: Public or password-protected aggregated report for V3 Organizations
 */
export default async function OrganizationReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ variant?: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const variant = resolvedSearchParams.variant || null;
  const variantPageId = variant ? `${id}::variant=${variant}` : null;
  const candidateIds = variantPageId ? [variantPageId, id] : [id];

  const decision = await requirePageAccessDecision('organization-report', candidateIds);
  if (!decision.allowed) {
    const gatePageId =
      variantPageId && (await isPageProtected('organization-report', variantPageId))
        ? variantPageId
        : id;
    return <ServerPageGate pageId={gatePageId} pageType="organization-report" />;
  }

  return <OrganizationReportView id={id} variant={variant} />;
}
