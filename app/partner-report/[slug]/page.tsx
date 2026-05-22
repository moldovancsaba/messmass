'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { PartnerReportView } from '../PartnerReportView';

/**
 * Partner Report Page — public /partner-report/[slug].
 * WHAT: Aggregated reports for partner organizations.
 * WHY: Partners need to see metrics across all their events.
 */
export default function PartnerReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) ?? '';
  const variant = searchParams?.get('variant');
  return <PartnerReportView slug={slug} variant={variant} />;
}
