'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ColoredCard from '@/components/ColoredCard';
import MaterialIcon from '@/components/MaterialIcon';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getReportingWorkspaceItems } from '@/lib/adminNavigation';
import { canAccessMenuItem } from '@/lib/permissions';
import styles from './ReportingWorkspaceNav.module.css';

export default function ReportingWorkspaceNav() {
  const pathname = usePathname();
  const { user } = useAdminAuth();

  if (!user) {
    return null;
  }

  const items = getReportingWorkspaceItems().filter((item) => canAccessMenuItem(user.role, item.label));

  return (
    <div className={styles.wrap}>
      <ColoredCard accentColor="#3b82f6" hoverable={false}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h2 className={styles.title}>Reporting Workspace</h2>
            <p className={styles.subtitle}>Move between builder, themes, content, and chart logic without backing out to the main admin workspace.</p>
          </div>
          <div className={styles.links}>
            {items.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.icon}>
                    <MaterialIcon name={item.icon} variant={item.iconVariant || 'outlined'} style={{ fontSize: '1rem' }} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </ColoredCard>
    </div>
  );
}
