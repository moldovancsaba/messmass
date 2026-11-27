'use client';

import React from 'react';
import Image from 'next/image';
import styles from './WorkspaceHeader.module.css';

export interface WorkspaceHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  logoUrl?: string | null;
  emoji?: string;
  status?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export default function WorkspaceHeader({
  eyebrow,
  title,
  subtitle,
  logoUrl,
  emoji,
  status,
  primaryAction,
  secondaryActions,
}: WorkspaceHeaderProps) {
  const normalizedStatus = status?.toLowerCase();
  const isInactive = normalizedStatus === 'inactive' || normalizedStatus === 'archived' || normalizedStatus === 'migrated';

  return (
    <header className={styles.header}>
      <div className={styles.identityGroup}>
        {(logoUrl || emoji) && (
          <div className={styles.mediaSlot}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${title} logo`}
                width={44}
                height={44}
                className={styles.logoImg}
                unoptimized
              />
            ) : (
              <span className={styles.emojiGlyph} aria-hidden="true">
                {emoji}
              </span>
            )}
          </div>
        )}

        <div className={styles.titleStack}>
          {(eyebrow || status) && (
            <div className={styles.eyebrowRow}>
              {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
              {status && (
                <span
                  className={`${styles.statusBadge} ${isInactive ? styles.statusInactive : styles.statusActive}`}
                >
                  {status}
                </span>
              )}
            </div>
          )}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>

      {(secondaryActions || primaryAction) && (
        <div className={styles.actionsGroup}>
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </header>
  );
}
