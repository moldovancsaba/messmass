'use client';

/**
 * WHAT: Renders "Our core belief" value chain KPIs from landing-report API when available.
 * WHY: Main page can be driven by event data; edit stats in admin to change copy.
 * HOW: Fetches /api/landing-report; if chartResults exist, render them; else static fallback.
 */

import { useState, useEffect } from 'react';
import LandingKPIChart from '@/components/LandingKPIChart';

interface ChartResult {
  chartId: string;
  type: string;
  title: string;
  icon?: string;
  iconVariant?: string;
  kpiValue?: number | string;
  elements?: Array<{ label: string; value: number | string; color?: string }>;
  showTitle?: boolean;
}

const ACCENT_COLORS = [
  'var(--mm-color-primary-500)',
  'var(--mm-color-secondary-500)',
  'var(--mm-success)',
];

export default function LandingValueChainSection({ gridClassName }: { gridClassName?: string }) {
  const [chartResults, setChartResults] = useState<ChartResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/landing-report', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        const results = data.chartResults as ChartResult[] | undefined;
        if (Array.isArray(results) && results.length > 0) {
          setChartResults(results);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const content =
    chartResults && chartResults.length > 0 ? (
      <>
        {chartResults.map((r, i) => {
          const el = r.type === 'valuechain' && Array.isArray(r.elements) && r.elements.length >= 2 ? r.elements : null;
          const title = el ? (typeof el[0].value === 'string' ? el[0].value : '') : r.title;
          const value = el ? (typeof el[1].value === 'string' ? el[1].value : '') : (typeof r.kpiValue === 'string' || typeof r.kpiValue === 'number' ? String(r.kpiValue) : '');
          return (
            <LandingKPIChart
              key={r.chartId}
              title={title}
              value={value}
              icon={r.icon}
              accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
            />
          );
        })}
      </>
    ) : (
      <>
        <LandingKPIChart
          title="Private"
          value="Strictly proprietary."
          icon="lock"
          accentColor="var(--mm-color-primary-500)"
        />
        <LandingKPIChart
          title="Actionable"
          value="Ready for immediate action."
          icon="bolt"
          accentColor="var(--mm-color-secondary-500)"
        />
        <LandingKPIChart
          title="Secure"
          value="100% safe."
          icon="shield"
          accentColor="var(--mm-success)"
        />
      </>
    );

  return <div className={gridClassName}>{content}</div>;
}
