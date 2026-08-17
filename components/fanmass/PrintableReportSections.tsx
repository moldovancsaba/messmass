'use client';

// components/fanmass/PrintableReportSections.tsx
// WHAT: Renders a fanmass printable-dashboard-report.v1 (Executive or
//     Analytics section of a dashboard snapshot) as a list of
//     AnalyticsSectionCards, each a semantic description list of rows.
// WHY: Reuses the exact shape fanmass's own read models already compute
//     (schemaVersion, title, sections[].rows[].{label,value}) rather than
//     reshaping it — see lib/fanmassDashboardSnapshot.ts's module header.

import React from 'react';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import styles from './PrintableReportSections.module.css';

interface PrintableReportRow {
  key?: string;
  label?: string;
  value?: string;
  meta?: string;
}

interface PrintableReportSection {
  key?: string;
  title?: string;
  description?: string;
  rows?: PrintableReportRow[];
}

interface PrintableReport {
  title?: string;
  sections?: PrintableReportSection[];
}

export default function PrintableReportSections({ report }: { report: PrintableReport | null | undefined }) {
  const sections = report?.sections?.filter((section) => (section.rows?.length ?? 0) > 0) ?? [];

  if (sections.length === 0) {
    return <p className={styles.empty}>No data reported for this section yet.</p>;
  }

  return (
    <div className={styles.stack}>
      {sections.map((section, index) => (
        <AnalyticsSectionCard
          key={section.key || section.title || index}
          title={section.title}
          subtitle={section.description}
        >
          <dl className={styles.rowList}>
            {(section.rows || []).map((row, rowIndex) => (
              <div className={styles.row} key={row.key || `${row.label}-${rowIndex}`}>
                <dt className={styles.rowLabel}>{row.label}</dt>
                <dd className={styles.rowValue}>
                  {row.value}
                  {row.meta ? <span className={styles.rowMeta}> {row.meta}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </AnalyticsSectionCard>
      ))}
    </div>
  );
}
