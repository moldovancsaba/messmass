'use client';

import Link from 'next/link';
import ColoredCard from '@/components/ColoredCard';
import MaterialIcon from '@/components/MaterialIcon';
import ReportingWorkspaceNav from '@/components/ReportingWorkspaceNav';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getReportingWorkspaceItems } from '@/lib/adminNavigation';
import { canAccessMenuItem } from '@/lib/permissions';
import styles from './page.module.css';

export default function ReportingHomePage() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="text-4xl mb-4">🧩</div>
          <div className="text-gray-600">Loading reporting workspace...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const reportingItems = getReportingWorkspaceItems().filter((item) =>
    canAccessMenuItem(user.role, item.label)
  );

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="Reporting Workspace"
        subtitle="Configure templates, themes, content assets, KPI formulas, tracked metrics, and live counter layouts."
        backLink="/admin"
      />

      <ReportingWorkspaceNav />

      <div className={styles.grid}>
        {reportingItems.map((item) => (
          <Link key={item.path} href={item.path} className={styles.cardLink}>
            <ColoredCard accentColor={item.accentColor} hoverable={true}>
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  <MaterialIcon name={item.icon} variant={item.iconVariant || 'outlined'} style={{ fontSize: '2rem' }} />
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardMeta}>Reporting Surface</p>
                  <h3 className={styles.cardTitle}>{item.label}</h3>
                  <p className={styles.cardDescription}>{item.description}</p>
                </div>
              </div>
            </ColoredCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
