// WHAT: Event Report Page (v12.4.0 - Phase 3)
// WHY: Clean, performant report rendering using new v12 architecture with shared styles
// HOW: Uses useReportData and useReportLayout hooks with ReportCalculator

'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ReportHero from './ReportHero';
import ReportContent from './ReportContent';
import { useReportData } from '@/hooks/useReportData';
import { useReportLayoutForProject } from '@/hooks/useReportLayout';
import { useReportStyle } from '@/hooks/useReportStyle';
import { ReportCalculator } from '@/lib/report-calculator';
import type { Chart } from '@/lib/report-calculator';
import { exportReportToCSV } from '@/lib/export/csv';
import { exportPageWithSmartPagination } from '@/lib/export/pdf';
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
        const response = await fetch('/api/chart-config/public');
        const data = await response.json();

        if (!response.ok || !data.success) {
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

        setCharts(ordered as any);
      } catch (err) {
        console.error('❌ Failed to fetch charts:', err);
        setChartsError(err instanceof Error ? err.message : 'Failed to load charts');
      } finally {
        setChartsLoading(false);
      }
    }

    fetchCharts();
  }, [blocks]);

  // Calculate chart results using ReportCalculator
  const chartResults = useMemo(() => {
    if (!stats || !charts || charts.length === 0) {
      return new Map();
    }

    // Create calculator with charts and stats
    const calculator = new ReportCalculator(charts, stats);
    const results = new Map();

    for (const chart of charts) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) {
        results.set(chart.chartId, result);
      }
    }

    return results;
  }, [stats, charts]);

  // WHAT: CSV export handler
  // WHY: Download complete report data including stats, chart results, and content
  // HOW: Call exportReportToCSV with project data, stats, and chart results
  const handleCSVExport = useCallback(async () => {
    console.log('🔵 CSV Export clicked');
    console.log('   Project:', project ? '✅' : '❌');
    console.log('   Stats:', stats ? '✅' : '❌');
    console.log('   Chart Results:', chartResults ? `✅ (${chartResults.size} charts)` : '❌');
    
    if (!project || !stats || !chartResults) {
      const missingData = [];
      if (!project) missingData.push('project');
      if (!stats) missingData.push('stats');
      if (!chartResults) missingData.push('chart results');
      
      const message = `Report data not ready. Missing: ${missingData.join(', ')}. Please wait for the report to fully load.`;
      console.warn('⚠️ Cannot export CSV:', message);
      alert(message);
      return;
    }

    try {
      console.log('📄 Starting CSV export...');
      await exportReportToCSV(
        {
          eventName: project.eventName,
          eventDate: project.eventDate,
          createdAt: reportData?.project?.createdAt,
          updatedAt: reportData?.project?.updatedAt,
          _id: project._id
        },
        stats,
        chartResults
      );
      console.log('✅ CSV export completed successfully');
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export CSV: ${errorMessage}\n\nPlease check the browser console for details and try again.`);
    }
  }, [project, stats, chartResults, reportData]);

  // WHAT: PDF export handler
  // WHY: Generate A4 portrait PDF with hero on every page and no block breaks
  // HOW: Call exportPageWithSmartPagination with hero and content IDs
  const handlePDFExport = useCallback(async () => {
    console.log('🗔️ PDF Export clicked');
    console.log('   Project:', project ? '✅' : '❌');
    
    if (!project) {
      const message = 'Report data not ready. Project information is missing. Please wait for the report to fully load.';
      console.warn('⚠️ Cannot export PDF:', message);
      alert(message);
      return;
    }
    
    // Verify DOM elements exist
    const heroElement = document.getElementById('report-hero');
    const contentElement = document.getElementById('report-content');
    
    if (!heroElement) {
      console.error('❌ Hero element not found (id: report-hero)');
      alert('Cannot export PDF: Report hero section not found. Please refresh the page and try again.');
      return;
    }
    
    if (!contentElement) {
      console.error('❌ Content element not found (id: report-content)');
      alert('Cannot export PDF: Report content section not found. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('📝 Starting PDF export...');
      console.log('   Hero element:', '✅');
      console.log('   Content element:', '✅');
      
      await exportPageWithSmartPagination(
        'report-hero',
        'report-content',
        {
          filename: `${project.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_report`,
          format: 'a4',
          orientation: 'portrait',
          quality: 0.95,
          margin: 10
        }
      );
      console.log('✅ PDF export completed successfully');
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export PDF: ${errorMessage}\n\nPlease check the browser console for details and try again.`);
    }
  }, [project]);

  // Determine overall loading state
  const loading = dataLoading || layoutLoading || chartsLoading || styleLoading;

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
            partnerLogo={reportData?.project?.partner1?.logoUrl} // WHAT: Show partner1 logo if available
            onExportCSV={handleCSVExport}
            onExportPDF={handlePDFExport}
          />
        </div>

        {/* Report Content Grid */}
        <div id="report-content">
          <ReportContent 
            blocks={blocks}
            chartResults={chartResults}
            gridSettings={gridSettings}
          />
        </div>
      </div>
    </div>
  );
}
