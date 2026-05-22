'use client';

import React from 'react';
import ColoredCard from '@/components/ColoredCard';
import styles from './AnalyticsSectionCard.module.css';

interface AnalyticsSectionCardProps {
  title?: string;
  subtitle?: string;
  accentColor?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  contentClassName?: string;
}

export default function AnalyticsSectionCard({
  title,
  subtitle,
  accentColor = 'var(--mm-color-primary-500)',
  actions,
  children,
  hoverable = false,
  className = '',
  contentClassName = '',
}: AnalyticsSectionCardProps) {
  const hasHeader = title || subtitle || actions;

  return (
    <ColoredCard accentColor={accentColor} hoverable={hoverable} className={className}>
      <div className={styles.card}>
        {hasHeader && (
          <div className={styles.header}>
            <div className={styles.heading}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {actions ? <div className={styles.actions}>{actions}</div> : null}
          </div>
        )}
        <div className={`${styles.content} ${contentClassName}`.trim()}>{children}</div>
      </div>
    </ColoredCard>
  );
}
