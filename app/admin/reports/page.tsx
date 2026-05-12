'use client';

import Link from 'next/link';
import ColoredCard from '@/components/ColoredCard';
import MaterialIcon from '@/components/MaterialIcon';
import ReportingWorkspaceNav from '@/components/ReportingWorkspaceNav';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getReportingNavItems } from '@/lib/adminNavigation';
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

  const reportingItems = getReportingNavItems().filter(
    (item) => item.path !== '/admin/reports' && canAccessMenuItem(user.role, item.label)
  );

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="Reporting Workspace"
        subtitle="Start report setup from one place, then move into builder, themes, content, or chart logic based on the job you need to complete."
        backLink="/admin"
      />

      <ReportingWorkspaceNav />

      <div className={styles.intro}>
        <ColoredCard accentColor="#3b82f6" hoverable={false}>
          <div className={styles.introBody}>
            <h2 className={styles.introTitle}>Choose the right reporting setup path</h2>
            <p className={styles.introText}>
              Report setup is one workflow with multiple specialized surfaces. It should feel like one workspace, not four disconnected products.
            </p>
            <ul className={styles.introList}>
              <li>Use <strong>Report Builder</strong> for templates, blocks, layout, and preview composition.</li>
              <li>Use <strong>Report Themes</strong> for branded styling and reusable visual systems.</li>
              <li>Use <strong>Content Library</strong> for text and image variables used in report formulas.</li>
              <li>Use <strong>Chart Algorithms</strong> for chart logic, formulas, and variable-driven chart behavior.</li>
              <li>Use <strong>KYC Variables</strong> and <strong>Clicker Sets</strong> when the reporting workflow depends on variable definitions or editor input layout.</li>
            </ul>
          </div>
        </ColoredCard>

        <ColoredCard accentColor="#14b8a6" hoverable={false}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Reporting now has one home</h2>
            <p className={styles.summaryMeta}>The admin card grid now points to this workspace first instead of treating each reporting tool as its own top-level destination.</p>
            <p className={styles.summaryMeta}>Variable schema and clicker layout are now treated as reporting dependencies, not isolated setup islands.</p>
            <p className={styles.summaryMeta}>Visible destinations are filtered by your current role.</p>
          </div>
        </ColoredCard>
      </div>

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
