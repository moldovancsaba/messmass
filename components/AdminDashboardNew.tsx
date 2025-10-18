'use client';

import React from 'react';
import ColoredCard from './ColoredCard';
import { AdminUser } from '@/lib/auth';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
  user: AdminUser;
  permissions: {
    canManageUsers: boolean;
    canDelete: boolean;
    canRead: boolean;
    canWrite: boolean;
  };
}

/* WHAT: Admin dashboard landing page with navigation cards
   WHY: Provides centralized access to admin features with clear visual hierarchy
   HOW: Gradient navigation cards, project management hub, and quick access sections */
export default function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  return (
    <div className="admin-container">
      {/* Hero Section with Navigation */}
      <ColoredCard>
        <div className={styles.heroSection}>
          <h1 className={`title ${styles.heroTitle}`}>
            MessMass Admin
          </h1>
          <p className={`subtitle ${styles.heroSubtitle}`}>
            Welcome back, {user.name}! Manage your projects and system settings.
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className={styles.navGrid}>
          <a
            href="/admin/dashboard"
            className={`${styles.navCard} ${styles.navCardPurple}`}
          >
            <div className={styles.navCardEmoji}>📊</div>
            <div className={styles.navCardContent}>
              <div className={styles.navCardTitle}>Dashboard</div>
              <div className={styles.navCardDescription}>
                Dashboard Overview, Success Manager, Statistics & Multi-Hashtag Filter
              </div>
            </div>
          </a>

          <a
            href="/admin/charts"
            className={`${styles.navCard} ${styles.navCardPink}`}
          >
            <div className={styles.navCardEmoji}>📊</div>
            <div className={styles.navCardContent}>
              <div className={styles.navCardTitle}>Chart Algorithm Manager</div>
              <div className={styles.navCardDescription}>
                Configure chart algorithms, data processing & visualization settings
              </div>
            </div>
          </a>

          <a
            href="/admin/design"
            className={`${styles.navCard} ${styles.navCardBlue}`}
          >
            <div className={styles.navCardEmoji}>🎨</div>
            <div className={styles.navCardContent}>
              <div className={styles.navCardTitle}>Design Manager</div>
              <div className={styles.navCardDescription}>
                Manage page styles and data visualization layouts
              </div>
            </div>
          </a>

          <a
            href="/admin/hashtags"
            className={`${styles.navCard} ${styles.navCardGreen}`}
          >
            <div className={styles.navCardEmoji}>🏷️</div>
            <div className={styles.navCardContent}>
              <div className={styles.navCardTitle}>Hashtag Manager</div>
              <div className={styles.navCardDescription}>
                Manage hashtag categories and individual hashtag colors
              </div>
            </div>
          </a>
        </div>
      </ColoredCard>

      {/* Project Management Section */}
      <ColoredCard>
        <div className={styles.sectionHeader}>
          <h2 className="section-title">📊 Project Management</h2>
          <a 
            href="/admin/projects"
            className={`btn btn-primary ${styles.manageButton}`}
            title="Manage all projects - create, edit, delete, and organize"
          >
            📊 Manage Projects
          </a>
        </div>
        
        <div className={styles.infoSection}>
          <div className={styles.infoSectionEmoji}>📊</div>
          <h3 className={styles.infoSectionTitle}>
            Project Management Hub
          </h3>
          <p className={styles.infoSectionDescription}>
            Create, edit, and manage all your event projects in one place. Each project includes comprehensive statistics tracking, hashtag categorization, and detailed analytics.
          </p>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureCardEmoji}>➕</div>
              <div className={styles.featureCardTitle}>Create Projects</div>
              <div className={styles.featureCardDescription}>Add new events with hashtags</div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureCardEmoji}>✏️</div>
              <div className={styles.featureCardTitle}>Edit & Update</div>
              <div className={styles.featureCardDescription}>Modify project details</div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureCardEmoji}>🔍</div>
              <div className={styles.featureCardTitle}>Search & Filter</div>
              <div className={styles.featureCardDescription}>Find projects by any criteria</div>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureCardEmoji}>📈</div>
              <div className={styles.featureCardTitle}>View Statistics</div>
              <div className={styles.featureCardDescription}>Access detailed analytics</div>
            </div>
          </div>
        </div>
      </ColoredCard>

      {/* Quick Info Section */}
      <ColoredCard>
        <h2 className="section-title">Quick Access</h2>
        <div className={styles.quickAccessGrid}>
          <div className={`${styles.quickAccessCard} ${styles.quickAccessCardSuccess}`}>
            <div className={styles.quickAccessEmoji}>🎯</div>
            <div className={`${styles.quickAccessTitle} ${styles.quickAccessTitleSuccess}`}>Success Metrics</div>
            <div className={styles.quickAccessDescription}>Track engagement and performance</div>
          </div>
          
          <div className={`${styles.quickAccessCard} ${styles.quickAccessCardInfo}`}>
            <div className={styles.quickAccessEmoji}>📊</div>
            <div className={`${styles.quickAccessTitle} ${styles.quickAccessTitleInfo}`}>Data Visualization</div>
            <div className={styles.quickAccessDescription}>Beautiful charts and analytics</div>
          </div>
          
          <div className={`${styles.quickAccessCard} ${styles.quickAccessCardWarning}`}>
            <div className={styles.quickAccessEmoji}>🏷️</div>
            <div className={`${styles.quickAccessTitle} ${styles.quickAccessTitleWarning}`}>Smart Tagging</div>
            <div className={styles.quickAccessDescription}>Categorize with hashtags</div>
          </div>
        </div>
      </ColoredCard>
    </div>
  );
}
