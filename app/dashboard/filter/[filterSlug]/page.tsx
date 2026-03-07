'use client';

/**
 * SSO dashboard: Filter analytics (#47).
 * WHAT: Multi-hashtag filter report at /dashboard/filter/[filterSlug]; SSO required; no password gate.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReportHero from '@/app/report/[slug]/ReportHero';
import ReportContent from '@/app/report/[slug]/ReportContent';
import UnifiedProjectsSection from '@/components/UnifiedProjectsSection';
import { ReportCalculator } from '@/lib/report-calculator';
import { useReportStyle } from '@/hooks/useReportStyle';
import styles from '@/app/styles/report-page.module.css';

interface FilterReportData {
  project: {
    eventName: string;
    eventDate: string;
    dateRange: { oldest: string; newest: string; formatted: string };
    hashtags?: string[];
    stats: Record<string, number | string>;
    projectCount: number;
  };
  projects: Array<{
    _id: string;
    eventName: string;
    eventDate: string;
    viewSlug?: string;
    hashtags?: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  hashtags: string[];
}

export default function DashboardFilterPage() {
  const params = useParams();
  const filterSlug = (params?.filterSlug as string) ?? '';

  const [reportData, setReportData] = useState<FilterReportData | null>(null);
  const [charts, setCharts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [gridSettings, setGridSettings] = useState<any>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { loading: styleLoading } = useReportStyle({ styleId, enabled: !!styleId });

  const fetchFilterData = useCallback(async () => {
    if (!filterSlug) return;
    try {
      setLoading(true);
      setError(null);
      const dataRes = await fetch(`/api/hashtags/filter-by-slug/${filterSlug}`, { cache: 'no-store' });
      const data = await dataRes.json();
      if (!data.success) throw new Error(data.error || 'Failed to load filter statistics');
      setReportData(data);

      const templateRes = await fetch(`/api/report-config/${filterSlug}?type=filter`, { cache: 'no-store' });
      const templateData = await templateRes.json();
      if (!templateData.success) throw new Error(templateData.error || 'Failed to load report template');
      const template = templateData.template;
      setBlocks(template.dataBlocks || []);
      setGridSettings(template.gridSettings || { desktopUnits: 3, tabletUnits: 2, mobileUnits: 1 });
      setStyleId(template.styleId || null);

      const chartsRes = await fetch('/api/chart-config/public', { cache: 'no-store' });
      const chartsData = await chartsRes.json();
      if (!chartsData.success) throw new Error(chartsData.error || 'Failed to load charts');
      setCharts(chartsData.configurations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load filter report');
    } finally {
      setLoading(false);
    }
  }, [filterSlug]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  const chartResults = useMemo(() => {
    if (!reportData?.project?.stats || !charts.length) return new Map();
    const calculator = new ReportCalculator(charts, reportData.project.stats);
    const results = new Map();
    for (const chart of charts) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) results.set(chart.chartId, result);
    }
    return results;
  }, [reportData?.project?.stats, charts]);

  const isLoading = loading || styleLoading;

  if (isLoading) {
    return (
      <>
        <div className={styles.adminBackBar}>
          <Link href="/admin">← Back to Admin</Link>
        </div>
        <div className={styles.page}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Loading filter report...</p>
          </div>
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <div className={styles.adminBackBar}>
          <Link href="/admin">← Back to Admin</Link>
        </div>
        <div className={styles.page}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            <h2 className={styles.errorTitle}>Failed to Load Report</h2>
            <p className={styles.errorText}>{error}</p>
          </div>
        </div>
      </>
    );
  }
  if (!reportData?.project) {
    return (
      <>
        <div className={styles.adminBackBar}>
          <Link href="/admin">← Back to Admin</Link>
        </div>
        <div className={styles.page}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>📊</span>
            <h2 className={styles.errorTitle}>No Data Found</h2>
            <p className={styles.errorText}>No projects found for this filter.</p>
          </div>
        </div>
      </>
    );
  }

  const projectForHero = {
    eventName: reportData.project.eventName,
    eventDate: reportData.project.dateRange.newest,
    _id: filterSlug,
  };

  return (
    <>
      <div className={styles.adminBackBar}>
        <Link href="/admin">← Back to Admin</Link>
      </div>
      <div className={styles.page}>
        <div className={styles.container}>
          <ReportHero project={projectForHero} emoji="🔍" showDate showExport={false} />
          <ReportContent blocks={blocks} chartResults={chartResults} gridSettings={gridSettings} />
          {reportData.projects?.length > 0 && (
            <UnifiedProjectsSection title="Related Events" projects={reportData.projects} />
          )}
        </div>
      </div>
    </>
  );
}
