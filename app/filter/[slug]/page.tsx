'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import UnifiedStatsHero from '@/components/UnifiedStatsHero';
import UnifiedDataVisualization from '@/components/UnifiedDataVisualization';
import UnifiedProjectsSection from '@/components/UnifiedProjectsSection';
import { ChartConfiguration, ChartCalculationResult, BlockAlignmentSettings } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import { DataVisualizationBlock } from '@/lib/pageStyleTypes';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import { exportPageWithSmartPagination } from '@/lib/export/pdf';

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
  const [pageStyle, setPageStyle] = useState<PageStyleEnhanced | null>(null);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridUnits, setGridUnits] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });
  const [alignmentSettings, setAlignmentSettings] = useState<BlockAlignmentSettings | undefined>(undefined);
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
        // WHAT: Extract alignment settings if available
        // WHY: Support block-level alignment in filter pages
        if (data.config.alignmentSettings) {
          setAlignmentSettings(data.config.alignmentSettings);
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

  /* What: Enhanced PDF export with smart pagination
     Why: Hero on every page, no element splitting, intelligent pagination */
  const handleExportPDF = useCallback(async () => {
    try {
      const hashtagsStr = hashtags.join('_');
      await exportPageWithSmartPagination(
        'filter-hero-section',
        'filter-content-section',
        {
          filename: `messmass_filter_${hashtagsStr}_stats`,
          orientation: 'portrait',
          quality: 0.95
        }
      );
      alert('PDF exported successfully! 📄');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
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
      <div className="loading-container">
        <div className="loading-card">
          <div className="curve-spinner"></div>
          <p className="mt-md text-gray-600 text-sm">Checking authentication...</p>
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
      <div className="loading-container">
        <div className="loading-card">
          <div className="curve-spinner"></div>
          <p className="mt-md text-gray-600 text-sm">Loading filter statistics...</p>
        </div>
      </div>
    );
  }

  /* What: Error state with flat TailAdmin V2 design
     Why: Modern card styling without glass-morphism effects */
  if (error || !project) {
    return (
      <div className="error-container">
        <div className="error-card max-w-2xl">
          <h1 className={`${error ? 'text-error' : 'text-warning'} mb-md text-2xl font-bold`}>
            {error ? '❌ Error' : '📊 Filter Not Found'}
          </h1>
          <p className="text-gray-600 text-base" style={{ lineHeight: 'var(--mm-line-height-md)' }}>
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
    <div 
      className="page-bg-gray" 
      style={(() => {
        if (!pageStyle) return { padding: 'var(--mm-space-4)' };
        const safeColor = (typeof pageStyle.typography?.primaryTextColor === 'string' && pageStyle.typography.primaryTextColor.trim()) ? pageStyle.typography.primaryTextColor.trim() : undefined;
        const safeFont = (typeof pageStyle.typography?.fontFamily === 'string' && pageStyle.typography.fontFamily.trim()) ? pageStyle.typography.fontFamily.trim() : undefined;
        return {
          padding: 'var(--mm-space-4)',
          background: generateGradientCSS(pageStyle.pageBackground),
          color: safeColor,
          fontFamily: safeFont
        };
      })()}
    >

      {/* What: Main content container wrapper for PDF export
          Why: Contains hero and content sections separately for smart pagination */}
      <div 
        className="w-full"
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
        {/* WHAT: Hero section with unique ID for PDF export
            WHY: Will be captured separately and repeated on every PDF page */}
        <div id="filter-hero-section">
          {/* Unified Hero Section with CSV and PDF export */}
          <UnifiedStatsHero
          title={`Aggregated Statistics - ${project.dateRange.formatted}`}
          hashtags={hashtags}
          createdDate={project.createdAt}
          lastUpdatedDate={project.updatedAt}
          pageStyle={pageStyle || undefined}
          onExportCSV={exportFilteredCSV}
          onExportPDF={handleExportPDF}
          />
        </div>

        {/* WHAT: Content section with unique ID for PDF export
            WHY: Contains all charts/blocks that will be paginated intelligently */}
        <div id="filter-content-section" className="w-full mt-lg">
          <UnifiedDataVisualization
            blocks={dataBlocks}
            chartResults={chartResults}
            loading={chartsLoading}
            gridUnits={gridUnits}
            alignmentSettings={alignmentSettings}
          />
        </div>

        {/* What: Projects list section showing all matched projects
            Why: Allow users to see which projects were aggregated */}
        {projects.length > 0 && (
          <div className="mt-lg">
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
