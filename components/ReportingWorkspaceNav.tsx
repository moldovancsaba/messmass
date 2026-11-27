'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  const workspaceItems = getReportingWorkspaceItems().filter((item) => canAccessMenuItem(user.role, item.label));
  const items = [
    ...(canAccessMenuItem(user.role, 'Reporting Workspace')
      ? [{ label: 'Overview', path: '/admin/reports', icon: 'dashboard_customize', iconVariant: 'outlined' as const }]
      : []),
    ...workspaceItems,
  ];

  return (
    <nav className={styles.wrap} aria-label="Reporting workspace">
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
              <span className={styles.icon} aria-hidden="true">
                <MaterialIcon name={item.icon} variant={item.iconVariant || 'outlined'} className={styles.materialIcon} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
