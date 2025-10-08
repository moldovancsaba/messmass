'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import UnifiedStatsHero from '@/components/UnifiedStatsHero';
import UnifiedDataVisualization from '@/components/UnifiedDataVisualization';
import UnifiedProjectsSection from '@/components/UnifiedProjectsSection';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import { PageStyle, DataVisualizationBlock } from '@/lib/pageStyleTypes';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import { exportPageToPDF } from '@/lib/export/pdf';

interface ProjectStats {
  remoteImages: number;
  hostessImages: number;
  selfies: number;
  indoor: number;
  outdoor: number;
  stadium: number;
  female: number;
  male: number;
  genAlpha: number;
  genYZ: number;
  genX: number;
  boomer: number;
  merched: number;
  jersey: number;
  scarf: number;
  flags: number;
  baseballCap: number;
  other: number;
  approvedImages?: number;
  rejectedImages?: number;
  visitQrCode?: number;
  visitShortUrl?: number;
  visitWeb?: number;
  visitFacebook?: number;
  visitInstagram?: number;
  visitYoutube?: number;
  visitTiktok?: number;
  visitX?: number;
  visitTrustpilot?: number;
  eventAttendees?: number;
  eventTicketPurchases?: number;
  eventResultHome?: number;
  eventResultVisitor?: number;
  eventValuePropositionVisited?: number;
  eventValuePropositionPurchases?: number;
}

interface Project {
  eventName: string;
  eventDate: string;
  dateRange: {
    oldest: string;
    newest: string;
    formatted: string;
  };
  hashtags?: string[];
  stats: ProjectStats;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectListItem {
  _id: string;
  eventName: string;
  eventDate: string;
  viewSlug?: string;
  hashtags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function FilterPage() {
  const params = useParams();
  const filterSlug = params?.slug as string;
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [chartConfigurations, setChartConfigurations] = useState<ChartConfiguration[]>([]);
  const [chartResults, setChartResults] = useState<ChartCalculationResult[]>([]);
  const [pageStyle, setPageStyle] = useState<PageStyle | null>(null);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridUnits, setGridUnits] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });
  const [hashtags, setHashtags] = useState<string[]>([]);

  // Function to fetch page configuration
  const fetchPageConfig = useCallback(async (opts?: { styleId?: string | null; hashtags?: string[] }) => {
    try {
      let qs = '';
      if (opts?.styleId) {
        qs = `?styleId=${encodeURIComponent(opts.styleId)}`;
      } else if (opts?.hashtags && opts.hashtags.length > 0) {
        qs = `?hashtags=${encodeURIComponent(opts.hashtags.join(','))}`;
      }
      const response = await fetch(`/api/page-config${qs}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setPageStyle(data.config.pageStyle);
        setDataBlocks(data.config.dataBlocks);
        if (data.config.gridSettings) {
          const gs = data.config.gridSettings;
          setGridUnits({ desktop: gs.desktopUnits, tablet: gs.tabletUnits, mobile: gs.mobileUnits });
        }
      }
    } catch (err) {
      console.error('Failed to fetch page config:', err);
    }
  }, []);

  // Function to fetch filter data
  const fetchFilterData = useCallback(async () => {
    try {
      console.log('🔍 Fetching filter data for slug:', filterSlug);
      const response = await fetch(`/api/hashtags/filter-by-slug/${filterSlug}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
        setProjects(data.projects || []);
        setHashtags(data.hashtags || []);
        if (data.styleId) {
          fetchPageConfig({ styleId: data.styleId });
        } else if (data.hashtags) {
          fetchPageConfig({ hashtags: data.hashtags });
        }
      } else {
        setError(data.error || 'Failed to load filter statistics');
      }
    } catch (err) {
      console.error('Failed to fetch filter stats:', err);
      setError('Failed to load filter statistics');
    } finally {
      setLoading(false);
    }
  }, [filterSlug, fetchPageConfig]);

  // Load chart configurations
  const loadChartConfigurations = useCallback(async () => {
    try {
      const response = await fetch('/api/chart-config/public', { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setChartConfigurations(data.configurations);
      }
    } catch (err) {
      console.error('Failed to fetch chart configurations:', err);
    }
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    if (filterSlug) {
      const authenticated = isAuthenticated(filterSlug, 'filter');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      // Only load data if authenticated
      if (authenticated) {
        fetchFilterData();
        // page config will be fetched after hashtags are loaded
        loadChartConfigurations();
      }
    }
  }, [filterSlug, fetchFilterData, fetchPageConfig, loadChartConfigurations]);

  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    // Load data after successful authentication
    fetchFilterData();
    // page config will be fetched after hashtags are loaded
    loadChartConfigurations();
  };

  // After hashtags are loaded, fetch page style config based on hashtag assignments
  useEffect(() => {
    if (hashtags && hashtags.length > 0) {
      fetchPageConfig({ hashtags });
    }
  }, [hashtags, fetchPageConfig]);

  // Calculate chart results when project and configurations are loaded
  useEffect(() => {
    if (project && chartConfigurations.length > 0) {
      setChartsLoading(true);
      try {
        const results = calculateActiveCharts(chartConfigurations, project.stats);
        setChartResults(results);
      } catch (err) {
        console.error('Failed to calculate chart results:', err);
        setChartResults([]);
      } finally {
        setChartsLoading(false);
      }
    }
  }, [project, chartConfigurations]);

  /* What: PDF export function for full filter page
     Why: Allow users to save aggregated stats page as PDF document */
  const handleExportPDF = useCallback(async () => {
    try {
      const hashtagsStr = hashtags.join('_');
      await exportPageToPDF('filter-page-content', {
        filename: `messmass_filter_${hashtagsStr}_stats`,
        orientation: 'portrait',
        quality: 0.95
      });
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  }, [hashtags]);

  /* What: Export filtered results as CSV (2-column table: Variable, Value)
     Why: Export aggregated statistics for spreadsheet analysis */
  const [includeDerived, setIncludeDerived] = useState(false);
  const exportFilteredCSV = () => {
    if (!project) return;

    const stats = project.stats;

    const esc = (v: any) => {
      const s = String(v ?? '');
      return '"' + s.replace(/"/g, '""') + '"';
    };

    const rows: Array<[string, string | number]> = [];

    // Context variables
    rows.push(['Filter Tags', hashtags.map(tag => `#${tag}`).join(' AND ')]);
    rows.push(['Projects Matched', project.projectCount]);
    if (project.dateRange) {
      rows.push(['Date Range Oldest', project.dateRange.oldest]);
      rows.push(['Date Range Newest', project.dateRange.newest]);
      rows.push(['Date Range (Formatted)', project.dateRange.formatted]);
    }

    // Derived metrics (optional)
    if (includeDerived) {
      const totalImages = project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies;
      const totalFans = project.stats.indoor + project.stats.outdoor + project.stats.stadium;
      const totalGender = project.stats.female + project.stats.male;
      const totalUnder40 = project.stats.genAlpha + project.stats.genYZ;
      const totalOver40 = project.stats.genX + project.stats.boomer;
      const totalAge = totalUnder40 + totalOver40;
      const totalMerch = project.stats.merched + project.stats.jersey + project.stats.scarf + project.stats.flags + project.stats.baseballCap + project.stats.other;
      rows.push(['totalImages', totalImages]);
      rows.push(['totalFans', totalFans]);
      rows.push(['totalGender', totalGender]);
      rows.push(['totalUnder40', totalUnder40]);
      rows.push(['totalOver40', totalOver40]);
      rows.push(['totalAge', totalAge]);
      rows.push(['totalMerch', totalMerch]);
    }

    // Stats variables
    Object.entries(stats).forEach(([key, value]) => {
      rows.push([key, typeof value === 'number' || typeof value === 'string' ? value : '']);
    });

    const header = ['Variable', 'Value'];
    const csv = [header, ...rows]
      .map(([k, v]) => `${esc(k)},${esc(v)}`)
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `messmass_filter_${hashtags.join('_')}_variables.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /* What: Loading state while checking authentication
     Why: Show user-friendly loading indicator during auth check */
  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--mm-gray-50)'
      }}>
        <div style={{
          background: 'var(--mm-white)',
          borderRadius: 'var(--mm-radius-lg)',
          boxShadow: 'var(--mm-shadow-lg)',
          padding: 'var(--mm-space-8)',
          textAlign: 'center'
        }}>
          <div className="curve-spinner"></div>
          <p style={{ 
            marginTop: 'var(--mm-space-4)',
            color: 'var(--mm-gray-600)',
            fontSize: 'var(--mm-font-size-sm)'
          }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authorized
  if (!isAuthorized) {
    return (
      <PagePasswordLogin
        pageId={filterSlug}
        pageType="filter"
        onSuccess={handleLoginSuccess}
      />
    );
  }

  /* What: Loading state while fetching filter data
     Why: Show user-friendly loading indicator with context */
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--mm-gray-50)'
      }}>
        <div style={{
          background: 'var(--mm-white)',
          borderRadius: 'var(--mm-radius-lg)',
          boxShadow: 'var(--mm-shadow-lg)',
          padding: 'var(--mm-space-8)',
          textAlign: 'center'
        }}>
          <div className="curve-spinner"></div>
          <p style={{ 
            marginTop: 'var(--mm-space-4)',
            color: 'var(--mm-gray-600)',
            fontSize: 'var(--mm-font-size-sm)'
          }}>Loading filter statistics...</p>
        </div>
      </div>
    );
  }

  /* What: Error state with flat TailAdmin V2 design
     Why: Modern card styling without glass-morphism effects */
  if (error || !project) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--mm-space-6)',
        backgroundColor: 'var(--mm-gray-50)'
      }}>
        <div style={{
          background: 'var(--mm-white)',
          borderRadius: 'var(--mm-radius-lg)',
          boxShadow: 'var(--mm-shadow-lg)',
          textAlign: 'center',
          padding: 'var(--mm-space-8)',
          maxWidth: '32rem',
          width: '100%',
          borderTop: `4px solid ${error ? 'var(--mm-error)' : 'var(--mm-warning)'}`
        }}>
          <h1 style={{ 
            color: error ? 'var(--mm-error)' : 'var(--mm-warning)', 
            marginBottom: 'var(--mm-space-4)',
            fontSize: 'var(--mm-font-size-2xl)',
            fontWeight: 'var(--mm-font-weight-bold)'
          }}>
            {error ? '❌ Error' : '📊 Filter Not Found'}
          </h1>
          <p style={{ 
            color: 'var(--mm-gray-600)',
            fontSize: 'var(--mm-font-size-base)',
            lineHeight: 'var(--mm-line-height-md)'
          }}>
            {error || "The filter you're looking for might not exist or may have been removed."}
          </p>
        </div>
      </div>
    );
  }

  /* What: Main filter page container with flat TailAdmin V2 design
     Why: Modern, clean layout with proper spacing and typography
     
     Features:
     - Flat white background with subtle gray page background
     - Proper spacing using design system tokens
     - Optional custom page style gradients
     - Responsive padding for different screen sizes
     - Aggregated statistics display with project list */
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--mm-gray-50)',
      padding: 'var(--mm-space-4)'
    }}>
      {/* Inject resolved page style for custom gradients (optional) */}
      {pageStyle && (
        <style
          // WHAT: Set CSS variables for custom backgrounds if configured
          // WHY: Allow hashtag-specific branding while maintaining base TailAdmin V2 design
          dangerouslySetInnerHTML={{
            __html: `
              .filter-page-custom-bg { background: linear-gradient(${pageStyle.backgroundGradient}); }
              .filter-hero-custom-bg { background: linear-gradient(${pageStyle.headerBackgroundGradient}); }
            `
          }}
        />
      )}

      {/* What: Main content container with id for PDF export
          Why: Constrain content width on large screens, enable PDF export of entire page */}
      <div 
        id="filter-page-content"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {/* Unified Hero Section with CSV and PDF export */}
        <UnifiedStatsHero
          title={`Aggregated Statistics - ${project.dateRange.formatted}`}
          hashtags={hashtags}
          createdDate={project.createdAt}
          lastUpdatedDate={project.updatedAt}
          pageStyle={pageStyle || undefined}
          onExportCSV={exportFilteredCSV}
          onExportPDF={handleExportPDF}
          extraContent={(
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--mm-space-2)', 
              cursor: 'pointer',
              fontSize: 'var(--mm-font-size-sm)',
              color: 'var(--mm-gray-700)'
            }}>
              <input
                type="checkbox"
                checked={includeDerived}
                onChange={(e) => setIncludeDerived(e.target.checked)}
                style={{
                  cursor: 'pointer',
                  width: '16px',
                  height: '16px'
                }}
              />
              <span>Include derived metrics</span>
            </label>
          )}
        />

        {/* What: Data visualization section with modern spacing
            Why: Unified component handles all chart rendering with proper grid layout */}
        {/* WHAT: Chart section wrapper using utility classes */}
        <div className="w-full mt-lg">
          <UnifiedDataVisualization
            blocks={dataBlocks}
            chartResults={chartResults}
            loading={chartsLoading}
            gridUnits={gridUnits}
          />
        </div>

        {/* What: Projects list section showing all matched projects
            Why: Allow users to see which projects were aggregated */}
        {projects.length > 0 && (
          <div style={{ marginTop: 'var(--mm-space-6)' }}>
            <UnifiedProjectsSection
              projects={projects}
              title={`Projects with ${hashtags.map(h => `#${h}`).join(' + ')} (${projects.length})`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
