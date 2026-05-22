'use client';

import React from 'react';
import ColoredCard from '@/components/ColoredCard';
import styles from './AnalyticsStatePanel.module.css';

type AnalyticsStateVariant = 'loading' | 'empty' | 'error';

interface AnalyticsStatePanelProps {
  variant: AnalyticsStateVariant;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

const VARIANT_ICON: Record<AnalyticsStateVariant, string> = {
  loading: '⏳',
  empty: '📭',
  error: '⚠️',
};

const VARIANT_ACCENT: Record<AnalyticsStateVariant, string> = {
  loading: 'var(--mm-color-primary-500)',
  empty: 'var(--mm-chart-cyan)',
  error: 'var(--mm-error)',
};

export default function AnalyticsStatePanel({
  variant,
  title,
  description,
  action,
  className = '',
}: AnalyticsStatePanelProps) {
  return (
    <ColoredCard accentColor={VARIANT_ACCENT[variant]} hoverable={false} className={className}>
      <div className={styles.state}>
        <div className={styles.icon} aria-hidden="true">
          {VARIANT_ICON[variant]}
        </div>
        <div className={styles.copy}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
        {action ? <div className={styles.action}>{action}</div> : null}
      </div>
    </ColoredCard>
  );
}
