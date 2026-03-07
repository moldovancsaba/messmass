'use client';

/**
 * SSO dashboard: Partner analytics (#47).
 * WHAT: Partner-level aggregated report at /dashboard/partner/[partnerId]; SSO required.
 */
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PartnerReportView } from '@/app/partner-report/PartnerReportView';
import styles from '@/app/styles/report-page.module.css';

export default function DashboardPartnerPage() {
  const params = useParams();
  const partnerId = (params?.partnerId as string) ?? '';
  return (
    <>
      <div className={styles.adminBackBar}>
        <Link href="/admin" className="dashboard-back">
          ← Back to Admin
        </Link>
      </div>
      <PartnerReportView slug={partnerId} />
    </>
  );
}
