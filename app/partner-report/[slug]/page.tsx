// WHAT: Partner Report Page (v12.4.0 - Phase 2 Complete)
// WHY: Partner-level aggregated reports using clean v12 architecture with server-side aggregation
// HOW: Reuses ReportHero/Content/Chart from event reports with server-aggregated partner data

'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import ReportHero from '@/app/report/[slug]/ReportHero';
import ReportContent from '@/app/report/[slug]/ReportContent';
import PartnerEventsList from './PartnerEventsList';
import { usePartnerReportData } from '@/hooks/useReportData';
import { useReportLayoutForPartner } from '@/hooks/useReportLayout';
import { useReportStyle } from '@/hooks/useReportStyle';
import { useReportExport } from '@/hooks/useReportExport';
import { ReportCalculator } from '@/lib/report-calculator';
import styles from '@/app/styles/report-page.module.css'; // WHAT: Shared stylesheet (Phase 3)

/**
 * Partner Report Page
 * 
 * WHAT: Aggregated reports for partner organizations (/partner-report/[slug])
 * WHY: Partners need to see metrics across all their events
 * 
 * Architecture:
 * - Uses SAME components as event reports (ReportHero, ReportContent, ReportChart)
 * - Different data source: usePartnerReportData (aggregated across events)
 * - Different layout: useReportLayoutForPartner (partner-specific templates)
 * 
 * Demonstrates v12 architecture benefit: 100% component reuse between report types
 */
export default function PartnerReportPage() {
  const params = useParams();
  const slug = params?.slug as string;

  // Fetch partner data and aggregated stats (includes charts already)
  const { 
    data: partnerData,
    loading: dataLoading, 
    error: dataError 
  } = usePartnerReportData(slug);

  // Extract partner, charts, and aggregated stats from data
  // WHAT: All data comes from single hook - no redundant fetching
  // WHY: usePartnerReportData already fetches charts and aggregates stats
  // HOW: Server-side aggregation (Phase 2 - v12.4.0) eliminates client computation
  const partner = partnerData?.partner;
  const events = partnerData?.events || [];
  const charts = partnerData?.charts || [];
  const stats = partnerData?.aggregatedStats || null;
  
  // Debug logging (development only)
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV === 'development') {
    console.log('[PartnerReport] Partner data:', { 
      hasData: !!partnerData, 
      partner: partner?._id,
      eventsCount: events.length,
      statsKeys: stats ? Object.keys(stats) : []
    });
  }

  // Fetch report layout for partner (only after we have partner ID)
  // WHAT: useReportLayoutForPartner requires a valid MongoDB ObjectId
  // WHY: Can't fetch layout until we have the partner's _id from the API
  // HOW: Pass partner._id only when partner is loaded, otherwise skip fetch
  const {
    report,
    blocks,
    gridSettings,
    loading: layoutLoading,
    error: layoutError
  } = useReportLayoutForPartner(partner?._id || null);

  // WHAT: Apply custom style colors if report/template has styleId
  // WHY: Partners can have custom branding via styleId that overrides template
  // HOW: useReportStyle fetches style and injects 26 CSS variables
  const { loading: styleLoading, error: styleError } = useReportStyle({ 
    styleId: report?.styleId ? String(report.styleId) : null,
    enabled: !!report // Only fetch style after report is loaded
  });

  // Calculate chart results using ReportCalculator
  // SAME calculator as event reports - works with aggregated stats
  const chartResults = useMemo(() => {
    // Move charts check inside useMemo to avoid dependency warning
    const chartsArray = partnerData?.charts || [];
    if (!stats || !chartsArray || chartsArray.length === 0) {
      return new Map();
    }

    // Create calculator with charts and aggregated partner stats
    const calculator = new ReportCalculator(chartsArray, stats);
    const results = new Map();

    for (const chart of chartsArray) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) {
        results.set(chart.chartId, result);
      }
    }

    return results;
  }, [stats, partnerData?.charts]);

  // WHAT: Unified export handlers using useReportExport hook
  // WHY: Centralized export logic eliminates duplication across report types
  // HOW: Pass partner data and aggregated stats to hook
  // IMPORTANT: Must be called before any conditional returns (React Rules of Hooks)
  const { handleCSVExport, handlePDFExport } = useReportExport({
    entity: partner ? { ...partner, createdAt: (partner as any).createdAt, updatedAt: (partner as any).updatedAt } : null,
    stats: stats || null,
    chartResults,
    filenamePrefix: 'partner_report',
    reportType: 'Partner Report'
  });

  // Determine overall loading state
  // WHAT: Single loading state from unified data source
  // WHY: Removed chartsLoading (no longer needed with unified fetch)
  const loading = dataLoading || layoutLoading || styleLoading;

  // WHAT: Determine overall error state (exclude styleError)
  // WHY: Style errors should not block report rendering (fallback handles it)
  // HOW: Only check critical errors that prevent data/layout from loading
  const error = dataError || layoutError;

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <h2 className={styles.errorTitle}>Failed to Load Partner Report</h2>
          <p className={styles.errorText}>{error}</p>
          {/* WHAT: Additional debug info styling for error state - WHY: Smaller, muted text for technical slug info (legitimate styling) */}
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <p className={styles.errorText} style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Partner slug: {slug}
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!partner || !stats || !report) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>📊</span>
          <h2 className={styles.errorTitle}>Partner Report Not Found</h2>
          <p className={styles.errorText}>
            The requested partner report could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Get hero settings from report
  const { heroSettings } = report;

  // Debug: Log partner logo (development only)
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV === 'development') {
    console.log('🖼️ [PartnerReport] Partner logo URL:', (partner as any).logoUrl);
  }

  // Format partner data as project-like object for ReportHero
  // WHAT: ReportHero expects project shape, adapt partner data to match
  // WHY: Component reuse without modification
  const partnerAsProject = {
    eventName: partner.name,
    eventDate: new Date().toISOString(), // Partner reports don't have single date
    _id: partner._id
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section - REUSED from event reports */}
        <div id="report-hero">
          <ReportHero 
            project={partnerAsProject}
            emoji={heroSettings?.showEmoji !== false ? partner.emoji : undefined} // WHAT: Respect heroSettings.showEmoji
            partnerLogo={(partner as any).logoUrl} // WHAT: Show partner logo if available
            showDate={false} // Partners don't have single date
            showExport={heroSettings?.showExportOptions ?? true}
            onExportCSV={handleCSVExport}
            onExportPDF={handlePDFExport}
          />
        </div>

        {/* Report Content Grid - REUSED from event reports */}
        <div id="report-content">
          <ReportContent 
            blocks={blocks}
            chartResults={chartResults}
            gridSettings={gridSettings}
          />
        </div>

        {/* Related Events List - Shows all events for this partner */}
        {events.length > 0 && (
          <PartnerEventsList events={events} partnerName={partner.name} />
        )}
      </div>
    </div>
  );
}
