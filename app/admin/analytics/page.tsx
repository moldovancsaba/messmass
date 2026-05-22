'use client';

import Link from 'next/link';
import AnalyticsWorkspaceNav from '@/components/AnalyticsWorkspaceNav';
import { AnalyticsSectionCard, AnalyticsStatePanel } from '@/components/analytics';
import ColoredCard from '@/components/ColoredCard';
import MaterialIcon from '@/components/MaterialIcon';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getAnalyticsNavItems } from '@/lib/adminNavigation';
import { canAccessMenuItem } from '@/lib/permissions';
import styles from './page.module.css';

export default function AnalyticsHomePage() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="page-container">
        <AnalyticsStatePanel
          variant="loading"
          title="Loading analytics workspace"
          description="Preparing the canonical analytics entry point and your available reporting lenses."
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const analyticsItems = getAnalyticsNavItems().filter(
    (item) => item.path !== '/admin/analytics' && canAccessMenuItem(user.role, item.label)
  );

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="Analytics Workspace"
        subtitle="Use one analytics entry point, then choose the reporting lens that matches the decision you need to make."
        backLink="/admin"
      />

      <AnalyticsWorkspaceNav />

      <div className={styles.intro}>
        <AnalyticsSectionCard
          accentColor="var(--mm-color-primary-500)"
          title="Choose the right analytics path"
          subtitle="Sponsorship performance, executive reporting, marketing analysis, operations capacity, and anomaly review are all analytics workflows, but they should start from one place."
        >
          <ul className={styles.introList}>
            <li>Use <strong>Sponsorship Hub</strong> for partner, project, and organization performance.</li>
            <li>Use <strong>Partner Activation</strong> from Operations when the job is proof delivery, not analysis.</li>
            <li>Use <strong>Executive</strong>, <strong>Marketing</strong>, or <strong>Operations</strong> dashboards for role-specific portfolio views.</li>
            <li>Use <strong>Insights</strong> when you need anomalies, trends, and AI-generated review cues.</li>
          </ul>
        </AnalyticsSectionCard>

        <AnalyticsSectionCard
          accentColor="var(--mm-chart-teal)"
          title="Analytics now has one home"
          subtitle="Legacy routes remain reachable, but they now resolve back into this analytics workspace structure."
        >
          <div className={styles.summaryCard}>
            <p className={styles.summaryMeta}>Visible destinations are filtered by your current role.</p>
            <p className={styles.summaryMeta}>Shared KPI, card, filter, and state patterns are now the target grammar for the analytics workspace.</p>
          </div>
        </AnalyticsSectionCard>
      </div>

      <div className={styles.grid}>
        {analyticsItems.map((item) => (
          <Link key={item.path} href={item.path} className={styles.cardLink}>
            <ColoredCard accentColor={item.accentColor} hoverable={true} className={styles.cardSurface}>
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  <MaterialIcon name={item.icon} variant={item.iconVariant || 'outlined'} className={styles.cardMaterialIcon} />
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardMeta}>Analytics Surface</p>
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
