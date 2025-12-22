// WHAT: Hashtag Report Page (v12 Unified Architecture)
// WHY: Migrate from legacy UnifiedDataVisualization to v12 ReportContent system
// HOW: Use same components as event/partner reports for consistency

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import ReportHero from '@/app/report/[slug]/ReportHero';
import ReportContent from '@/app/report/[slug]/ReportContent';
import UnifiedProjectsSection from '@/components/UnifiedProjectsSection';
import { ReportCalculator } from '@/lib/report-calculator';
import { useReportStyle } from '@/hooks/useReportStyle';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import { exportPageWithSmartPagination } from '@/lib/export/pdf';
import styles from '@/app/styles/report-page.module.css';

interface HashtagReportData {
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
    createdAt: string;
    updatedAt: string;
  }>;
}

export default function HashtagReportPage() {
  const params = useParams();
  const hashtagParam = params?.hashtag as string;
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Data state
  const [reportData, setReportData] = useState<HashtagReportData | null>(null);
  const [charts, setCharts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [gridSettings, setGridSettings] = useState<any>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // WHAT: Apply custom style colors if template has styleId
  // WHY: Hashtag reports can have custom branding via styleId
  // HOW: useReportStyle fetches style and injects 26 CSS variables
  const { loading: styleLoading, error: styleError } = useReportStyle({ 
    styleId: styleId,
    enabled: !!styleId
  });
  
  // Check authentication on mount
  useEffect(() => {
    if (hashtagParam) {
      const authenticated = isAuthenticated(hashtagParam, 'hashtag');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      if (authenticated) {
        fetchHashtagData();
      }
    }
  }, [hashtagParam]);
  
  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    fetchHashtagData();
  };
  
  // Fetch hashtag aggregated stats
  const fetchHashtagData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏷️ [HashtagReport] Fetching data for:', hashtagParam);
      
      // Step 1: Fetch hashtag aggregated data
      const dataRes = await fetch(`/api/hashtags/${encodeURIComponent(hashtagParam)}`, {
        cache: 'no-store'
      });
      const data = await dataRes.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load hashtag statistics');
      }
      
      setReportData(data);
      
      // Step 2: Fetch report template (v12 system)
      const templateRes = await fetch(
        `/api/report-config/${encodeURIComponent(hashtagParam)}?type=hashtag`,
        { cache: 'no-store' }
      );
      const templateData = await templateRes.json();
      
      if (!templateData.success) {
        throw new Error(templateData.error || 'Failed to load report template');
      }
      
      const template = templateData.template;
      setBlocks(template.dataBlocks || []);
      setGridSettings(template.gridSettings || { desktopUnits: 3, tabletUnits: 2, mobileUnits: 1 });
      setStyleId(template.styleId || null); // Extract styleId from template
      
      // Step 3: Fetch chart configurations
      const chartsRes = await fetch('/api/chart-config/public', { cache: 'no-store' });
      const chartsData = await chartsRes.json();
      
      if (!chartsData.success) {
        throw new Error(chartsData.error || 'Failed to load charts');
      }
      
      setCharts(chartsData.configurations || []);
      
      console.log('✅ [HashtagReport] Data loaded successfully');
    } catch (err) {
      console.error('❌ [HashtagReport] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hashtag report');
    } finally {
      setLoading(false);
    }
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
    return <PagePasswordLogin pageId={hashtagParam} pageType="hashtag" onSuccess={handleLoginSuccess} />;
  }
  
  // Loading state
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading hashtag report...</p>
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
            No projects found with this hashtag.
          </p>
        </div>
      </div>
    );
  }
  
  // Format project-like object for ReportHero
  const projectForHero = {
    eventName: reportData.project.eventName,
    eventDate: reportData.project.dateRange.newest,
    _id: hashtagParam
  };
  
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section - REUSED from event reports */}
        <ReportHero 
          project={projectForHero}
          emoji="🏷️"
          showDate={true}
          showExport={true}
        />
        
        {/* Report Content Grid - REUSED from event reports */}
        <ReportContent 
          blocks={blocks}
          chartResults={chartResults}
          gridSettings={gridSettings}
        />
        
        {/* Related Projects List */}
        {reportData.projects && reportData.projects.length > 0 && (
          <UnifiedProjectsSection title="Related Events" projects={reportData.projects} />
        )}
      </div>
    </div>
  );
}
