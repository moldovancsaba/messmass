'use client';

import React from 'react';
import Link from 'next/link';
import { AdminUser } from '@/lib/auth';
import styles from './AdminDashboard.module.css';

/* What: Admin dashboard navigation component
   Why: Provides quick access to all admin sections
   
   Modernization:
   - Replaced gradient cards with flat TailAdmin V2 design
   - Added color-coded accent bars
   - Using CSS Modules for styling
   - Equal card widths per Board Card Width Rule
   - Improved accessibility with Link component */

interface AdminDashboardProps {
  user: AdminUser;
  permissions: {
    canManageUsers: boolean;
    canDelete: boolean;
    canRead: boolean;
    canWrite: boolean;
  };
}

/* What: Navigation card data structure
   Why: Centralize card configuration for easier maintenance */
interface NavCard {
  href: string;
  icon: string;
  title: string;
  description: string;
  colorClass: string;
}

const navCards: NavCard[] = [
  {
    href: '/admin/projects',
    icon: '🍿',
    title: 'Manage Projects',
    description: 'Create, edit, delete, and organize all your events',
    colorClass: styles.colorGreen,
  },
  {
    href: '/admin/filter',
    icon: '🔍',
    title: 'Hashtag Filter',
    description: 'Advanced multi-hashtag filtering and search',
    colorClass: styles.colorCyan,
  },
  {
    href: '/admin/hashtags',
    icon: '🏷️',
    title: 'Hashtag Manager',
    description: 'Manage hashtag categories and colors',
    colorClass: styles.colorPurple,
  },
  {
    href: '/admin/categories',
    icon: '🌍',
    title: 'Category Manager',
    description: 'Organize and group hashtag categories',
    colorClass: styles.colorOrange,
  },
  {
    href: '/admin/design',
    icon: '🎨',
    title: 'Design Manager',
    description: 'Customize styles and visualization layouts',
    colorClass: styles.colorPink,
  },
  {
    href: '/admin/charts',
    icon: '📊',
    title: 'Chart Algorithm Manager',
    description: 'Configure chart algorithms and calculations',
    colorClass: styles.colorYellow,
  },
  {
    href: '/admin/variables',
    icon: '🔢',
    title: 'Variable Manager',
    description: 'Manage dynamic variables and formulas',
    colorClass: styles.colorBlue,
  },
  {
    href: '/admin/visualization',
    icon: '📈',
    title: 'Visualization Manager',
    description: 'Control chart display and ordering',
    colorClass: styles.colorTeal,
  },
];

export default function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  return (
    <>
      {/* What: Welcome section
          Why: Personalized greeting and context */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>Welcome back, {user.name}! 👋</h1>
        <p className={styles.welcomeText}>
          You're logged in as <strong>{user.role}</strong>. Choose a management area below to get started.
        </p>
      </div>

      {/* What: Navigation cards grid
          Why: Quick access to all admin sections with visual differentiation */}
      <div className={styles.dashboardGrid}>
        {navCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`${styles.navCard} ${card.colorClass}`}
          >
            <div className={styles.navIcon}>{card.icon}</div>
            <div className={styles.navContent}>
              <h2 className={styles.navTitle}>{card.title}</h2>
              <p className={styles.navDescription}>{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
