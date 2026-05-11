'use client';

import Link from 'next/link';
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
      <div className="loading-container">
        <div className="loading-card">
          <div className="text-4xl mb-4">📈</div>
          <div className="text-gray-600">Loading analytics workspace...</div>
        </div>
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

      <div className={styles.intro}>
        <ColoredCard accentColor="#3b82f6" hoverable={false}>
          <div className={styles.introBody}>
            <h2 className={styles.introTitle}>Choose the right analytics path</h2>
            <p className={styles.introText}>
              Sponsorship performance, executive reporting, marketing analysis, operations capacity, and anomaly review are all analytics workflows, but they should start from one place.
            </p>
            <ul className={styles.introList}>
              <li>Use <strong>Sponsorship Hub</strong> for partner, project, and organization performance.</li>
              <li>Use <strong>Partner Activation</strong> from Operations when the job is proof delivery, not analysis.</li>
              <li>Use <strong>Executive</strong>, <strong>Marketing</strong>, or <strong>Operations</strong> dashboards for role-specific portfolio views.</li>
              <li>Use <strong>Insights</strong> when you need anomalies, trends, and AI-generated review cues.</li>
            </ul>
          </div>
        </ColoredCard>

        <ColoredCard accentColor="#14b8a6" hoverable={false}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Analytics now has one home</h2>
            <p className={styles.summaryMeta}>Legacy routes remain reachable, but they now resolve back into this analytics workspace structure.</p>
            <p className={styles.summaryMeta}>Visible destinations are filtered by your current role.</p>
          </div>
        </ColoredCard>
      </div>

      <div className={styles.grid}>
        {analyticsItems.map((item) => (
          <Link key={item.path} href={item.path} className={styles.cardLink}>
            <ColoredCard accentColor={item.accentColor} hoverable={true}>
              <div className={styles.cardContent}>
                <div className={styles.cardIcon}>
                  <MaterialIcon name={item.icon} variant={item.iconVariant || 'outlined'} style={{ fontSize: '2rem' }} />
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
