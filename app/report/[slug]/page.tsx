// WHAT: Event Report Page (v12.4.0 - Phase 3)
// WHY: Clean, performant report rendering using new v12 architecture with shared styles
// HOW: Uses useReportData and useReportLayout hooks with ReportCalculator

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReportHero from './ReportHero';
import ReportContent from './ReportContent';
import { useReportData } from '@/hooks/useReportData';
import { useReportLayoutForProject } from '@/hooks/useReportLayout';
import { useReportStyle } from '@/hooks/useReportStyle';
import { useReportExport } from '@/hooks/useReportExport';
import { ReportCalculator } from '@/lib/report-calculator';
import type { Chart } from '@/lib/report-calculator';
import { ensureDerivedMetrics } from '@/lib/dataValidator';
import { validateTemplateCompatibility, formatCompatibilityIssue, type CompatibilityResult } from '@/lib/templateCompatibilityValidator';
import { debug, info, warn, error as logError } from '@/lib/logger';
import styles from '@/app/styles/report-page.module.css'; // WHAT: Shared stylesheet (Phase 3)

/**
 * Event Report Page
 * 
 * WHAT: Main page component for event reports (/report/[slug])
 * WHY: Simplified architecture with clean separation of concerns
 * 
 * Architecture:
 * 1. Fetch project data + stats (useReportData)
 * 2. Fetch report layout (useReportLayout)
 * 3. Fetch chart configurations from API
 * 4. Calculate chart results (ReportCalculator)
 * 5. Render hero + content grid
 * 
 * Performance:
 * - Target: <800ms page load
 * - Chart calculation: memoized
 * - Data fetching: parallel hooks
 */
export default function ReportPage() {
  const params = useParams();
  const slug = params?.slug as string;

  // State for chart configurations
  const [charts, setCharts] = useState<Chart[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Fetch project data and stats
  const { 
    data: reportData,
    loading: dataLoading, 
    error: dataError 
  } = useReportData(slug);
  
  const project = reportData?.project;
  const stats = reportData?.project?.stats;

  // Fetch report layout
  const {
    report,
    blocks,
    gridSettings,
    loading: layoutLoading,
    error: layoutError
  } = useReportLayoutForProject(slug);

  // WHAT: Apply custom style colors if report has styleId
  // WHY: Reports can have custom branding via 26-color system
  // HOW: useReportStyle fetches style and injects CSS variables
  const { loading: styleLoading, error: styleError } = useReportStyle({ 
    styleId: report?.styleId ? String(report.styleId) : null,
    enabled: !!report // Only fetch style after report is loaded
  });


  // Fetch chart configurations when layout is loaded
  useEffect(() => {
    if (!blocks || blocks.length === 0) return;

    async function fetchCharts() {
      setChartsLoading(true);
      setChartsError(null);

      try {
        // Collect all unique chart IDs from all blocks
        const chartIds = Array.from(
          new Set(blocks.flatMap(block => block.charts.map(c => c.chartId)))
        );

        if (chartIds.length === 0) {
          setCharts([]);
          return;
        }

        // Fetch chart configurations from public admin source (chart_configurations)
        // Then filter to those actually used by the template (maintain order)
        debug(`[ReportPage] Fetching ${chartIds.length} chart configurations...`);
        const response = await fetch('/api/chart-config/public', {
          cache: 'no-store', // WHAT: Ensure fresh data on each load
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        debug(`[ReportPage] Chart fetch response:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          logError('[ReportPage] Chart fetch failed', {
            status: response.status,
            statusText: response.statusText,
            error: errorText.substring(0, 200)
          }, new Error(`Failed to fetch charts: ${response.status} ${response.statusText}`));
          throw new Error(`Failed to fetch charts: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();

        debug(`[ReportPage] Chart fetch data:`, {
          success: data.success,
          configurationsCount: data.configurations?.length || 0,
          requestedCount: chartIds.length
        });

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch charts');
        }

        // Map and filter to requested IDs preserving block order
        const byId: Record<string, any> = {};
        for (const cfg of data.configurations as any[]) {
          byId[cfg.chartId] = cfg;
        }
        const ordered = chartIds
          .map(id => byId[id])
          .filter(Boolean);

        debug(`[ReportPage] Chart matching:`, {
          requested: chartIds.length,
          found: ordered.length,
          missing: chartIds.filter(id => !byId[id])
        });

        setCharts(ordered as any);
      } catch (err) {
        logError('❌ Failed to fetch charts:', undefined, err instanceof Error ? err : new Error(String(err)));
        setChartsError(err instanceof Error ? err.message : 'Failed to load charts');
      } finally {
        setChartsLoading(false);
      }
    }

    fetchCharts();
  }, [blocks]);

  // A-R-12: Validate template compatibility with available data
  const compatibilityResult = useMemo<CompatibilityResult | null>(() => {
    if (!report || !charts || charts.length === 0 || !stats) {
      return null;
    }

    // Extract chart IDs from template blocks
    const blockChartIds = blocks.flatMap(block => 
      block.charts.map(c => c.chartId)
    );

    // Enrich stats with derived metrics (same as chart calculation)
    const enrichedStats = ensureDerivedMetrics(stats);

    // Validate template compatibility
    return validateTemplateCompatibility(
      report as any, // Report type matches ReportTemplate structure
      charts,
      enrichedStats as any,
      'project', // Event reports use 'project' entity type
      blockChartIds
    );
  }, [report, charts, stats, blocks]);

  // A-R-12: Log template compatibility issues to console (not displayed in UI for client-facing reports)
  useEffect(() => {
    if (compatibilityResult && compatibilityResult.issues.length > 0) {
      const errorIssues = compatibilityResult.issues.filter(issue => issue.severity === 'error');
      const warningIssues = compatibilityResult.issues.filter(issue => issue.severity === 'warning');
      
      if (errorIssues.length > 0) {
        warn('[ReportPage] Template Compatibility Issues:', {
          totalErrors: errorIssues.length,
          totalWarnings: warningIssues.length,
          errors: errorIssues.map(issue => formatCompatibilityIssue(issue)),
          summary: compatibilityResult.summary
        });
      } else if (warningIssues.length > 0) {
        info('[ReportPage] Template Compatibility Warnings:', {
          totalWarnings: warningIssues.length,
          warnings: warningIssues.map(issue => formatCompatibilityIssue(issue))
        });
      }
    }
  }, [compatibilityResult]);

  // Calculate chart results using ReportCalculator
  const chartResults = useMemo(() => {
    if (!stats || !charts || charts.length === 0) {
      warn('[ReportPage] Missing data for chart calculation:', {
        hasStats: !!stats,
        hasCharts: !!charts,
        chartsCount: charts?.length || 0,
        statsKeys: stats ? Object.keys(stats).length : 0,
        statsSample: stats ? Object.keys(stats).slice(0, 10) : []
      });
      return new Map();
    }

    // WHAT: Log stats availability for debugging
    // WHY: Need to see if required stats fields are present
    debug(`[ReportPage] Stats available:`, {
      totalKeys: Object.keys(stats).length,
      sampleKeys: Object.keys(stats).slice(0, 20),
      hasTotalFans: 'totalFans' in stats,
      hasAllImages: 'allImages' in stats,
      hasRemoteFans: 'remoteFans' in stats
    });

    // WHAT: Enrich stats with derived metrics before calculation
    // WHY: Formulas may depend on derived fields (totalFans, allImages, remoteFans) that need to be computed
    // HOW: ensureDerivedMetrics adds missing derived fields based on base metrics
    const enrichedStats = ensureDerivedMetrics(stats);
    
    debug(`[ReportPage] Stats after enrichment:`, {
      totalKeys: Object.keys(enrichedStats).length,
      hasTotalFans: 'totalFans' in enrichedStats,
      hasAllImages: 'allImages' in enrichedStats,
      hasRemoteFans: 'remoteFans' in enrichedStats,
      totalFansValue: enrichedStats.totalFans,
      allImagesValue: enrichedStats.allImages,
      remoteFansValue: enrichedStats.remoteFans
    });

    // Create calculator with enriched stats
    // WHAT: Type cast needed - ensureDerivedMetrics returns ProjectStats from dataValidator
    // WHY: ReportCalculator expects ProjectStats from report-calculator (narrower index signature)
    // HOW: Cast to compatible type (both allow string | number, enrichedStats may have boolean/object)
    const calculator = new ReportCalculator(charts, enrichedStats as any);
    const results = new Map();

    debug(`[ReportPage] Calculating ${charts.length} charts...`);
    let calculatedCount = 0;
    let errorCount = 0;
    let emptyCount = 0;

    for (const chart of charts) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) {
        if (result.chartError) {
          errorCount++;
          logError(`[ReportPage] Chart calculation error for ${chart.chartId}:`, undefined, new Error(result.chartError.message));
        } else if (result.type === 'kpi' && (result.kpiValue === undefined || result.kpiValue === 'NA')) {
          emptyCount++;
          warn(`[ReportPage] Empty KPI chart: ${chart.chartId}`, {
            value: result.kpiValue,
            formula: chart.formula,
            hasError: !!result.chartError,
            error: (result.chartError as any)?.message
          });
        } else if ((result.type === 'pie' || result.type === 'bar') && (!result.elements || result.elements.length === 0)) {
          emptyCount++;
          warn(`[ReportPage] Empty ${result.type} chart: ${chart.chartId}`, {
            elementsCount: result.elements?.length || 0,
            formula: chart.formula,
            elementsFormulas: chart.elements?.map((e: any) => e.formula) || []
          });
        } else if ((result.type === 'pie' || result.type === 'bar') && result.elements) {
          const total = result.elements.reduce((sum: number, el: any) => 
            sum + (typeof el.value === 'number' ? el.value : 0), 0
          );
          if (total === 0) {
            emptyCount++;
            warn(`[ReportPage] Empty ${result.type} chart (total=0): ${chart.chartId}`, {
              elements: result.elements.map((el: any) => ({
                label: el.label,
                value: el.value,
                valueType: typeof el.value
              })),
              formula: chart.formula
            });
          } else {
            calculatedCount++;
          }
        } else {
          calculatedCount++;
        }
        results.set(chart.chartId, result);
      } else {
        warn(`[ReportPage] Chart calculation returned null for: ${chart.chartId}`);
      }
    }

    debug(`[ReportPage] Chart calculation complete:`, {
      total: charts.length,
      calculated: calculatedCount,
      errors: errorCount,
      empty: emptyCount,
      resultsSize: results.size
    });

    return results;
  }, [stats, charts]);

  // WHAT: Unified export handlers using useReportExport hook
  // WHY: Centralized export logic eliminates duplication across report types
  // HOW: Pass project data and chart results to hook
  // IMPORTANT: Must be called before any conditional returns (React Rules of Hooks)
  const { handleCSVExport, handlePDFExport } = useReportExport({
    entity: project ? { ...project, createdAt: reportData?.project?.createdAt, updatedAt: reportData?.project?.updatedAt } : null,
    stats: stats || null,
    chartResults,
    charts: charts?.map(chart => ({ chartId: chart.chartId, order: chart.order })), // A-R-10 Phase 2: Pass charts for ordering
    reportType: 'Event Report'
  });

  // Determine overall loading state
  const loading = dataLoading || layoutLoading || chartsLoading || styleLoading;

  // WHAT: Loading timeout so user is not stuck on "Loading report..." (e.g. slow or failing API)
  // WHY: Report page can hang if one of useReportData / useReportLayout / charts fetch never resolves
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) {
      setLoadingTimedOut(false);
      return;
    }
    const t = setTimeout(() => setLoadingTimedOut(true), 12000);
    return () => clearTimeout(t);
  }, [loading]);

  // WHAT: Determine overall error state (exclude styleError)
  // WHY: Style errors should not block report rendering (fallback handles it)
  // HOW: Only check critical errors that prevent data/layout from loading
  const error = dataError || layoutError || chartsError;

  // Loading state
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading report...</p>
          {loadingTimedOut && (
            <p className={`${styles.loadingText} ${styles.loadingNote}`}>
              Taking longer than usual. Check your connection or{' '}
              <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>Retry</button>.
            </p>
          )}
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
          <h2 className={styles.errorTitle}>Failed to Load Report</h2>
          <p className={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!project || !stats || !report) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>📊</span>
          <h2 className={styles.errorTitle}>Report Not Found</h2>
          <p className={styles.errorText}>
            The requested report could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Get hero settings from report
  const { heroSettings } = report;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <div id="report-hero">
          <ReportHero 
            project={project}
            emoji={heroSettings?.showEmoji !== false ? reportData?.project?.partner1?.emoji : undefined} // WHAT: Respect heroSettings.showEmoji
            showDate={heroSettings?.showDateInfo ?? true}
            showExport={heroSettings?.showExportOptions ?? true}
            partnerLogo={reportData?.project?.partner1?.logoUrl} // WHAT: Show partner1 logo if available (before title)
            partner2Logo={reportData?.project?.partner2?.logoUrl} // WHAT: Show partner2 logo if available (after title, for match reports)
            onExportCSV={handleCSVExport}
            onExportPDF={handlePDFExport}
          />
        </div>

        {/* Report Content Grid */}
        <div id="report-content">
          <ReportContent 
            blocks={blocks}
            chartResults={chartResults}
            charts={charts ? new Map(charts.map(c => [c.chartId, c])) : null} // A-R-13: Pass chart configs for validation
            gridSettings={gridSettings}
          />
        </div>
      </div>
    </div>
  );
}
