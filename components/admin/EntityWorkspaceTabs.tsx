'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './EntityWorkspaceTabs.module.css';

export interface EntityWorkspaceTab {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
}

interface EntityWorkspaceTabsProps {
  ariaLabel: string;
  tabs: EntityWorkspaceTab[];
  backHref?: string;
  backLabel?: string;
}

export default function EntityWorkspaceTabs({
  ariaLabel,
  tabs,
  backHref,
  backLabel = 'Back',
}: EntityWorkspaceTabsProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.bar} aria-label={ariaLabel}>
      <div className={styles.links}>
        {backHref && (
          <Link href={backHref} className={styles.backLink}>
            <MaterialIcon name="arrow_back" variant="outlined" className={styles.icon} />
            <span>{backLabel}</span>
          </Link>
        )}
        {tabs.map((tab) => {
          const isActive = !tab.external && pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              target={tab.external ? '_blank' : undefined}
              rel={tab.external ? 'noopener noreferrer' : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            >
              {tab.icon && (
                <MaterialIcon name={tab.icon} variant="outlined" className={styles.icon} />
              )}
              <span>{tab.label}</span>
              {tab.external && <span className={styles.externalGlyph} aria-hidden="true">↗</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
