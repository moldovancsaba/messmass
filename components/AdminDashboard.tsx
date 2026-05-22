'use client';

import React from 'react';
import Link from 'next/link';
import { AdminUser } from '@/lib/auth';
import ColoredCard from './ColoredCard';
import MaterialIcon from './MaterialIcon';
import { getAdminWorkspaceSections } from '@/lib/adminNavigation';
import { canAccessMenuItem } from '@/lib/permissions';
import styles from './AdminDashboard.module.css';

/* What: Admin dashboard navigation component
   Why: Provides quick access to all admin sections
   
   Design:
   - Uses centralized ColoredCard component for consistency
   - All styling controlled via ColoredCard (maintainable in one place)
   - Color-coded accent bars via accentColor prop
   - No custom CSS modules - pure component reuse */

interface AdminDashboardProps {
  user: AdminUser;
  permissions: {
    canManageUsers: boolean;
    canDelete: boolean;
    canRead: boolean;
    canWrite: boolean;
  };
}

export default function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  const adminWorkspaceSections = getAdminWorkspaceSections()
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessMenuItem(user.role, item.label)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {adminWorkspaceSections.map((section) => (
        <section key={section.key} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.sectionDescription}>{section.description}</p>
          </div>
          <div className={styles.grid}>
            {section.items.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={styles.cardLink}
              >
                <ColoredCard accentColor={item.accentColor} hoverable={true}>
                  <div className={styles.cardContent}>
                    <div className={styles.iconWrap}>
                      <MaterialIcon
                        name={item.icon}
                        variant={item.iconVariant || 'outlined'}
                        className={styles.icon}
                      />
                    </div>
                    <div className={styles.textContent}>
                      <h3 className={styles.cardTitle}>{item.label}</h3>
                      <p className={styles.cardDescription}>{item.description}</p>
                    </div>
                  </div>
                </ColoredCard>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
