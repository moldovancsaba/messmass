'use client';

/**
 * Shared partner report view — used by /partner-report/[slug] and /dashboard/partner/[partnerId] (#47).
 * WHAT: Renders partner aggregated report given a slug or partner id.
 */
import React, { useMemo } from 'react';
import ReportHero from '@/app/report/[slug]/ReportHero';
import ReportContent from '@/app/report/[slug]/ReportContent';
import PartnerEventsList from '@/app/partner-report/[slug]/PartnerEventsList';
import { usePartnerReportData } from '@/hooks/useReportData';
import { useReportStyle } from '@/hooks/useReportStyle';
import { useReportExport } from '@/hooks/useReportExport';
import { ReportCalculator } from '@/lib/report-calculator';
import styles from '@/app/styles/report-page.module.css';

export interface PartnerReportViewProps {
  slug: string;
  variant?: string | null;
}

export function PartnerReportView({ slug, variant }: PartnerReportViewProps) {
  console.log('🏗️ [PartnerReportView] Multi-tenant view mounting with slug:', slug);
  const { data: partnerData, loading: dataLoading, error: dataError } = usePartnerReportData(slug, variant);
  
  console.log('📦 [PartnerReportView] Hook dataLoading:', dataLoading);
  console.log('📦 [PartnerReportView] Hook partnerData stats:', partnerData?.aggregatedStats ? 'Yes' : 'No');
  
  const partner = partnerData?.partner;
  const events = partnerData?.events || [];
  const charts = partnerData?.charts || [];
  const stats = partnerData?.aggregatedStats || null;
  const report = partnerData?.report || null;
  const blocks = useMemo(() => (report?.layout?.blocks || []).sort((a, b) => a.order - b.order), [report]);
  const gridSettings = useMemo(() => ({
    desktop: report?.layout?.gridColumns?.desktop || 3,
    tablet: report?.layout?.gridColumns?.tablet || 2,
    mobile: report?.layout?.gridColumns?.mobile || 1,
  }), [report]);

  const { loading: styleLoading } = useReportStyle({
    styleId: report?.styleId ? String(report.styleId) : null,
    enabled: !!report,
  });

  console.log('📦 [PartnerReportView] styleLoading:', styleLoading);


  const chartResults = useMemo(() => {
    const chartsArray = partnerData?.charts || [];
    if (!stats || !chartsArray || chartsArray.length === 0) return new Map();
    const calculator = new ReportCalculator(chartsArray, stats);
    const results = new Map();
    for (const chart of chartsArray) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) results.set(chart.chartId, result);
    }
    return results;
  }, [stats, partnerData?.charts]);

  const { handleCSVExport, handlePDFExport } = useReportExport({
    entity: partner ? { ...partner, createdAt: (partner as any).createdAt, updatedAt: (partner as any).updatedAt } : null,
    stats: stats || null,
    chartResults,
    charts: partnerData?.charts?.map((chart) => ({ chartId: chart.chartId, order: chart.order })),
    filenamePrefix: 'partner_report',
    reportType: 'Partner Report',
  });

  const loading = dataLoading || styleLoading;
  const error = dataError;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading partner report...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <h2 className={styles.errorTitle}>Failed to Load Partner Report</h2>
          <p className={styles.errorText}>{error}</p>
          <p className={styles.errorMeta}>
            Partner: {slug}
          </p>
        </div>
      </div>
    );
  }
  if (!partner || !stats || !report) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>📊</span>
          <h2 className={styles.errorTitle}>Partner Report Not Found</h2>
          <p className={styles.errorText}>The requested partner report could not be found.</p>
        </div>
      </div>
    );
  }

  const { heroSettings } = report;
  const partnerAsProject = {
    eventName: partner.name,
    eventDate: new Date().toISOString(),
    _id: partner._id,
  };
  const reportVariant = (partnerData as any)?.reportVariant;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div id="report-hero">
          <ReportHero
            project={partnerAsProject}
            emoji={heroSettings?.showEmoji !== false && partner.showEmoji !== false ? partner.emoji : undefined}
            partnerLogo={(partner as any).logoUrl}
            showDate={false}
            customSubtitle={reportVariant ? `${reportVariant.name} · ${reportVariant.period?.label || 'All Time'}` : undefined}
            showExport={heroSettings?.showExportOptions ?? true}
            onExportCSV={handleCSVExport}
            onExportPDF={handlePDFExport}
          />
        </div>
        <div id="report-content">
          <ReportContent blocks={blocks} chartResults={chartResults} gridSettings={gridSettings} />
        </div>
        {events.length > 0 && (
          <PartnerEventsList
            events={events}
            partnerName={partner.name}
            showEventsList={partner.showEventsList}
            showEventsListTitle={partner.showEventsListTitle}
            showEventsListDetails={partner.showEventsListDetails}
          />
        )}
      </div>
    </div>
  );
}
