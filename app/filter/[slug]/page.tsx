// WHAT: Filter Report Page (v12 Unified Architecture)
// WHY: Migrate from legacy UnifiedDataVisualization to v12 ReportContent system
// HOW: Use same components as event/partner reports for consistency

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ReportHero from '@/app/report/[slug]/ReportHero';
import ReportContent from '@/app/report/[slug]/ReportContent';
import UnifiedProjectsSection from '@/components/UnifiedProjectsSection';
import { ReportCalculator } from '@/lib/report-calculator';
import { useReportStyle } from '@/hooks/useReportStyle';
import PagePasswordLogin, { isAuthenticated, clearAuthentication } from '@/components/PagePasswordLogin';
import styles from '@/app/styles/report-page.module.css';

interface FilterReportData {
  project: {
    eventName: string;
    eventDate: string;
    dateRange: {
      oldest: string;
      newest: string;
      formatted: string;
    };
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

export default function FilterReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const filterSlug = params?.slug as string;
  const variant = searchParams?.get('variant');
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Data state
  const [reportData, setReportData] = useState<FilterReportData | null>(null);
  const [charts, setCharts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [gridSettings, setGridSettings] = useState<any>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // WHAT: Apply custom style colors if template has styleId
  // WHY: Filter reports can have custom branding via styleId
  // HOW: useReportStyle fetches style and injects 26 CSS variables
  const { loading: styleLoading, error: styleError } = useReportStyle({ 
    styleId: styleId,
    enabled: !!styleId
  });
  
  // Check authentication on mount
  // Fetch filter aggregated stats
  const fetchFilterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [FilterReport] Fetching data for:', filterSlug);
      
      // Step 1: Fetch filter aggregated data
      const query = variant ? `?variant=${encodeURIComponent(variant)}` : '';
      const dataRes = await fetch(`/api/hashtags/filter-by-slug/${filterSlug}${query}`, {
        cache: 'no-store'
      });
      const data = await dataRes.json();

      // WHAT: The server now enforces the page password, and its grant cookie can
      //     expire while this tab's sessionStorage flag lives on.
      // WHY: Without this the visitor would see a generic error instead of the
      //     password prompt they can actually act on. Re-prompting is the correct
      //     response to PAGE_PASSWORD_REQUIRED, not an error screen.
      if (dataRes.status === 401 && data?.code === 'PAGE_PASSWORD_REQUIRED') {
        clearAuthentication(variant ? `${filterSlug}::variant=${variant}` : filterSlug, 'filter');
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to load filter statistics');
      }
      
      setReportData(data);
      
      // Step 2: Fetch report template (v12 system)
      const template = data.report;
      if (!template) {
        throw new Error('Failed to load report template');
      }
      setBlocks(template.layout?.blocks || []);
      setGridSettings(template.layout?.gridColumns || { desktop: 3, tablet: 2, mobile: 1 });
      setStyleId(data.styleId || template.styleId || null);
      
      // Step 3: Fetch chart configurations
      const chartsRes = await fetch('/api/chart-config/public', { cache: 'no-store' });
      const chartsData = await chartsRes.json();
      
      if (!chartsData.success) {
        throw new Error(chartsData.error || 'Failed to load charts');
      }
      
      setCharts(chartsData.configurations || []);
      
      console.log('✅ [FilterReport] Data loaded successfully');
    } catch (err) {
      console.error('❌ [FilterReport] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load filter report');
    } finally {
      setLoading(false);
    }
  }, [filterSlug, variant]);

  useEffect(() => {
    if (filterSlug) {
      const authenticated = isAuthenticated(variant ? `${filterSlug}::variant=${variant}` : filterSlug, 'filter');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      if (authenticated) {
        fetchFilterData();
      }
    }
  }, [fetchFilterData, filterSlug, variant]);
  
  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    fetchFilterData();
  };
  
  
  // Calculate chart results using ReportCalculator (v12 system)
  const chartResults = useMemo(() => {
    if (!reportData?.project?.stats || !charts || charts.length === 0) {
      return new Map();
    }
    
    const calculator = new ReportCalculator(charts, reportData.project.stats);
    const results = new Map();
    
    for (const chart of charts) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) {
        results.set(chart.chartId, result);
      }
    }
    
    return results;
  }, [reportData?.project?.stats, charts]);
  
  // Show password gate if not authenticated
  if (checkingAuth) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Checking access...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return <PagePasswordLogin pageId={variant ? `${filterSlug}::variant=${variant}` : filterSlug} pageType="filter" onSuccess={handleLoginSuccess} />;
  }
  
  // Loading state
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading filter report...</p>
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
  if (!reportData || !reportData.project) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>📊</span>
          <h2 className={styles.errorTitle}>No Data Found</h2>
          <p className={styles.errorText}>
            No projects found with this filter combination.
          </p>
        </div>
      </div>
    );
  }
  
  // Format project-like object for ReportHero
  const projectForHero = {
    eventName: reportData.project.eventName,
    eventDate: reportData.project.dateRange.newest,
    _id: filterSlug
  };

  // WHAT: PDF export — same server-side mechanism as the event/partner report page
  // (see hooks/useReportExport.ts and app/api/export/pdf/route.ts).
  // WHY: showExport was already true here with no onExportPDF handler wired, so the
  // button silently no-opped (ReportHero's own fallback just console.warns). This is
  // the live route (/hashtag/* permanently redirects to /filter/* — next.config.js —
  // so app/hashtag/[hashtag]/page.tsx, wired earlier, is unreachable by normal
  // navigation; this file is where the fix actually needed to land).
  const handlePDFExport = () => {
    const filename = (reportData?.project?.eventName || filterSlug || 'report').replace(/[^a-zA-Z0-9]/g, '_');
    const exportUrl = `/api/export/pdf?path=${encodeURIComponent(window.location.pathname + window.location.search)}&filename=${encodeURIComponent(filename)}`;
    window.location.href = exportUrl;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section - REUSED from event reports */}
        {/* WHAT: id="report-hero"/"report-content" match app/report/[slug]/page.tsx's
            structure exactly. WHY: app/api/export/pdf/route.ts's readiness check waits
            for #report-content to mount — it had no id to find here at all until this,
            so a PDF export of this page could never succeed regardless of how fast the
            data loaded (confirmed by direct reproduction: "Waiting for selector
            #report-content failed" against real filter data that HAD finished loading). */}
        <div id="report-hero">
          <ReportHero
            project={projectForHero}
            emoji="🔍"
            showDate={true}
            customSubtitle={(reportData as any).reportVariant ? `${(reportData as any).reportVariant.name} · ${(reportData as any).reportVariant.period?.label || 'All Time'}` : undefined}
            showExport={true}
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
        
        {/* Related Projects List */}
        {reportData.projects && reportData.projects.length > 0 && (
          <UnifiedProjectsSection title="Related Events" projects={reportData.projects} />
        )}
      </div>
    </div>
  );
}
