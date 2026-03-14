'use client';

import { useParams } from 'next/navigation';
import { OrganizationReportView } from '../OrganizationReportView';

/**
 * Organization Report Page
 * WHAT: Public or semi-public aggregated report for V3 Organizations
 */
export default function OrganizationReportPage() {
  const params = useParams();
  const id = (params?.id as string) ?? '';
  
  if (!id) return <div>Invalid ID</div>;
  
  return <OrganizationReportView id={id} />;
}
