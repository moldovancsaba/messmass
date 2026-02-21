'use client';

/**
 * SSO dashboard: Partner analytics (#47).
 * WHAT: Partner-level aggregated report at /dashboard/partner/[partnerId]; SSO required.
 */
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PartnerReportView } from '@/app/partner-report/PartnerReportView';

export default function DashboardPartnerPage() {
  const params = useParams();
  const partnerId = (params?.partnerId as string) ?? '';
  return (
    <>
      <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Link href="/admin" className="dashboard-back">
          ← Back to Admin
        </Link>
      </div>
      <PartnerReportView slug={partnerId} />
    </>
  );
}
