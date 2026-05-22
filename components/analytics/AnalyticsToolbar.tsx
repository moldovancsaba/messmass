'use client';

import React from 'react';
import AnalyticsSectionCard from './AnalyticsSectionCard';
import styles from './AnalyticsToolbar.module.css';

export interface AnalyticsToolbarPreset {
  key: string;
  label: string;
  description?: string;
  active?: boolean;
  onClick?: () => void;
}

interface AnalyticsToolbarProps {
  title: string;
  subtitle?: string;
  presets?: AnalyticsToolbarPreset[];
  children?: React.ReactNode;
  summary?: React.ReactNode;
  accentColor?: string;
}

export default function AnalyticsToolbar({
  title,
  subtitle,
  presets = [],
  children,
  summary,
  accentColor = 'var(--mm-color-primary-500)',
}: AnalyticsToolbarProps) {
  return (
    <AnalyticsSectionCard title={title} subtitle={subtitle} accentColor={accentColor}>
      <div className={styles.toolbar}>
        {presets.length > 0 && (
          <div className={styles.presets}>
            {presets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={`${styles.preset} ${preset.active ? styles.presetActive : ''}`.trim()}
                onClick={preset.onClick}
              >
                <span className={styles.presetLabel}>{preset.label}</span>
                {preset.description ? <span className={styles.presetDescription}>{preset.description}</span> : null}
              </button>
            ))}
          </div>
        )}
        {children ? <div className={styles.controls}>{children}</div> : null}
        {summary ? <div className={styles.summary}>{summary}</div> : null}
      </div>
    </AnalyticsSectionCard>
  );
}
