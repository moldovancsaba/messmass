'use client';

import { useParams, useSearchParams } from 'next/navigation';
import OrganizationReportView from '../OrganizationReportView';

/**
 * Organization Report Page
 * WHAT: Public or semi-public aggregated report for V3 Organizations
 */
export default function OrganizationReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = (params?.id as string) ?? '';
  const variant = searchParams?.get('variant');
  
  if (!id) return <div>Invalid ID</div>;
  
  return <OrganizationReportView id={id} variant={variant} />;
}
