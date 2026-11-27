'use client';

import React from 'react';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './StatsStrip.module.css';

export interface StatStripItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
}

export interface StatsStripProps {
  items: StatStripItem[];
  ariaLabel?: string;
}

export default function StatsStrip({ items, ariaLabel = 'Key metrics summary' }: StatsStripProps) {
  return (
    <section className={styles.strip} aria-label={ariaLabel}>
      {items.map((item) => (
        <div key={item.label} className={styles.tile}>
          <div className={styles.labelRow}>
            <span className={styles.label}>{item.label}</span>
            {item.icon && <MaterialIcon name={item.icon} variant="outlined" className={styles.icon} />}
          </div>
          <span className={styles.value}>
            {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
          </span>
          {item.subtext && <span className={styles.subtext}>{item.subtext}</span>}
        </div>
      ))}
    </section>
  );
}
