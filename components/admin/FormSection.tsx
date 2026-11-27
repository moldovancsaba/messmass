'use client';

import React, { useId } from 'react';
import styles from './FormSection.module.css';

export interface FormSectionProps {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}

export default function FormSection({
  title,
  description,
  badge,
  children,
}: FormSectionProps) {
  const headingId = useId();

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 id={headingId} className={styles.title}>
            {title}
          </h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
