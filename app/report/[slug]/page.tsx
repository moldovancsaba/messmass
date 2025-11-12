'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import UnifiedStatsHero from '@/components/UnifiedStatsHero';
import UnifiedDataVisualization from '@/components/UnifiedDataVisualization';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import StandardState from '@/components/StandardState';
import DataQualityInsights from '@/components/DataQualityInsights';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import { DataVisualizationBlock } from '@/lib/pageStyleTypes';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';
import { exportPageWithSmartPagination } from '@/lib/export/pdf';
import { generateDataQualityInsights } from '@/lib/dataValidator';
import styles from './page.module.css';

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
  // Merchandise pricing variables
  jerseyPrice?: number;
  scarfPrice?: number;
  flagsPrice?: number;
  capPrice?: number;
  otherPrice?: number;
}

interface Partner {
  _id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
}

interface Project {
  eventName: string;
  eventDate: string;
  hashtags?: string[]; // Array of hashtag strings (traditional/general)
  categorizedHashtags?: { [categoryName: string]: string[] }; // Categorized hashtags
  allHashtagRepresentations?: string[]; // All possible representations
  stats: ProjectStats;
  partner1?: Partner | null; // Home team
  partner2?: Partner | null; // Away team
  createdAt: string;
  updatedAt: string;
}

export default function StatsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [project, setProject] = useState<Project | null>(null);
  const [chartConfigurations, setChartConfigurations] = useState<ChartConfiguration[]>([]);
  const [chartResults, setChartResults] = useState<ChartCalculationResult[]>([]);
  const [pageStyle, setPageStyle] = useState<PageStyleEnhanced | null>(null);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gridUnits, setGridUnits] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });
  const [resolving, setResolving] = useState(true);
  const [showInsights, setShowInsights] = useState(false); // Toggle for data quality insights (default hidden)
  
  // WHAT: Generate data quality insights at top level (React hooks rule)
  // WHY: useMemo must be called unconditionally, not inside conditional rendering
  const dataQualityInsights = useMemo(() => {
    if (!project) return null;
    return generateDataQualityInsights(project.stats as Partial<ProjectStats>, project);
  }, [project]);

  // Function to force refresh data
  const refreshData = async () => {
    setError(null);
    await fetchProjectData();
  };

  // Function to fetch project data
  const fetchProjectData = useCallback(async () => {
    setResolving(true);
    try {
      console.log('🔍 Fetching project stats for slug:', slug);
      // Add cache-busting parameter to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/projects/stats/${slug}?refresh=${timestamp}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
        setError(null);
        
        // WHAT: Check if project has direct styleIdEnhanced (highest priority)
        // WHY: Projects can override template styling with their own custom style
        if (data.project.styleIdEnhanced) {
          try {
            console.log('🎨 Project has direct styleIdEnhanced:', data.project.styleIdEnhanced);
            const styleResponse = await fetch(`/api/page-styles-enhanced?styleId=${data.project.styleIdEnhanced}`, { cache: 'no-store' });
            const styleData = await styleResponse.json();
            if (styleData.success && styleData.style) {
              setPageStyle(styleData.style);
              console.log('✅ Loaded project direct style:', styleData.style.name);
            }
          } catch (styleErr) {
            console.warn('⚠️  Could not fetch project direct style:', styleErr);
          }
        }
      } else {
        setError(data.error || 'Failed to load project');
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
      setError('Failed to load project data');
    } finally {
      setResolving(false);
    }
  }, [slug]);

  // WHAT: Fetch report configuration using new template resolution API (v11.0.0)
  // WHY: Support per-partner and per-event report customization
  // HOW: Template hierarchy - Project → Partner → Default → Hardcoded
  const fetchPageConfig = useCallback(async (projectIdentifier?: string) => {
    try {
      if (!projectIdentifier) {
        console.warn('⚠️  [Stats] No project identifier provided');
        return;
      }

      console.log('🎨 [Stats] Fetching report config with template system:', { projectIdentifier });
      
      // Use new template resolution API
      const response = await fetch(`/api/report-config/${encodeURIComponent(projectIdentifier)}?type=project`, { cache: 'no-store' });
      const data = await response.json();

      console.log('🎨 [Stats] Report config response:', {
        success: data.success,
        templateName: data.template?.name,
        resolvedFrom: data.resolvedFrom,
        source: data.source,
        blocksCount: data.template?.dataBlocks?.length
      });

      if (data.success && data.template) {
        const template = data.template;
        
        // WHAT: Fetch page style from template if not already set by project direct styleId
        // WHY: Template styleId is fallback if project doesn't have direct style
        if (template.styleId && !pageStyle) {
          // Fetch the actual style document
          try {
            console.log('🎨 Template has styleId:', template.styleId);
            const styleResponse = await fetch(`/api/page-styles-enhanced?styleId=${template.styleId}`, { cache: 'no-store' });
            const styleData = await styleResponse.json();
            if (styleData.success && styleData.style) {
              setPageStyle(styleData.style);
              console.log('✅ Loaded template style:', styleData.style.name);
            }
          } catch (styleErr) {
            console.warn('⚠️  Could not fetch template style, using default:', styleErr);
          }
        }
        
        // Convert template dataBlocks to page dataBlocks
        // Template has blockId references, need to fetch actual blocks
        if (template.dataBlocks && template.dataBlocks.length > 0) {
          // For now, fetch blocks from old API to get full block data
          // TODO: In future, report-config API should return hydrated blocks
          const blockResponse = await fetch('/api/data-blocks', { cache: 'no-store' });
          const blockData = await blockResponse.json();
          
          if (blockData.success) {
            // Map template block references to actual blocks
            const orderedBlocks = template.dataBlocks
              .map((ref: any) => {
                const block = blockData.blocks.find((b: any) => b._id === ref.blockId || b._id.toString() === ref.blockId);
                if (!block) return null;
                
                // Apply template overrides if present
                return {
                  ...block,
                  showTitle: ref.overrides?.showTitle ?? block.showTitle,
                  name: ref.overrides?.customTitle || block.name
                };
              })
              .filter(Boolean);
            
            setDataBlocks(orderedBlocks);
            console.log(`✅ [Stats] Loaded ${orderedBlocks.length} blocks from template "${template.name}" (${data.resolvedFrom})`);
          }
        }
        
        // Set grid settings from template
        if (template.gridSettings) {
          const gs = template.gridSettings;
          setGridUnits({ desktop: gs.desktopUnits, tablet: gs.tabletUnits, mobile: gs.mobileUnits });
        }
      }
    } catch (err) {
      console.error('❌ [Stats] Failed to fetch report config:', err);
      // Fallback to old API if new one fails
      try {
        console.log('🔄 [Stats] Falling back to legacy page-config API');
        const fallbackResponse = await fetch(`/api/page-config?projectId=${encodeURIComponent(projectIdentifier || '')}`, { cache: 'no-store' });
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.success) {
          setPageStyle(fallbackData.config.pageStyle);
          setDataBlocks(fallbackData.config.dataBlocks);
          if (fallbackData.config.gridSettings) {
            const gs = fallbackData.config.gridSettings;
            setGridUnits({ desktop: gs.desktopUnits, tablet: gs.tabletUnits, mobile: gs.mobileUnits });
          }
        }
      } catch (fallbackErr) {
        console.error('❌ [Stats] Fallback API also failed:', fallbackErr);
      }
    }
  }, [pageStyle]);

  // Check authentication on component mount
  useEffect(() => {
    if (slug) {
      const authenticated = isAuthenticated(slug, 'event-report');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      // Only load data if authenticated
      if (authenticated) {
        fetchProjectData();
        // Pass the slug as identifier; API matches id, viewSlug, or editSlug
        fetchPageConfig(slug);
      }
    }
    // WHAT: Intentionally omit fetchProjectData and fetchPageConfig from deps
    // WHY: These functions are wrapped in useCallback with dependencies that change (pageStyle)
    // HOW: They should only run once on mount or when slug changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Handle successful login
  const handleLoginSuccess = (isAdmin: boolean) => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    // Load data after successful authentication
    fetchProjectData();
    fetchPageConfig(slug);
  };

  // Fetch chart configurations
  const fetchChartConfigurations = useCallback(async () => {
    try {
      console.log('📊 Fetching chart configurations...');
      const response = await fetch('/api/chart-config/public', { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setChartConfigurations(data.configurations);
        console.log(`✅ Loaded ${data.configurations.length} chart configurations`);
      } else {
        console.error('Failed to load chart configurations:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch chart configurations:', err);
    }
  }, []);

  useEffect(() => {
    fetchChartConfigurations();
  }, [fetchChartConfigurations]);

  // Calculate chart results when project and configurations are loaded
  useEffect(() => {
    if (project && chartConfigurations.length > 0) {
      try {
        console.log('🧮 Calculating chart results with project stats...');
        console.log('Project stats:', project.stats);
        console.log('Chart configurations:', chartConfigurations);
        
        // Try to import the calculateActiveCharts function
        if (typeof calculateActiveCharts !== 'function') {
          console.error('❌ calculateActiveCharts is not a function:', calculateActiveCharts);
          throw new Error('calculateActiveCharts is not a function');
        }
        
        const results = calculateActiveCharts(chartConfigurations, project.stats);
        console.log('Raw calculation results:', results);
        setChartResults(results);
        console.log(`✅ Calculated ${results.length} chart results`);
      } catch (err) {
        console.error('❌ Failed to calculate chart results:', err);
        if (err instanceof Error) {
          console.error('Error details:', err.message, err.stack);
        }
        // Set empty results to show the error in debug panel
        setChartResults([]);
      }
    }
  }, [project, chartConfigurations]);

  // Calculate totals
  const totalImages = project ? project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies : 0;
  const totalFans = project ? project.stats.indoor + project.stats.outdoor + project.stats.stadium : 0;
  const totalGender = project ? project.stats.female + project.stats.male : 0;
  const totalUnder40 = project ? project.stats.genAlpha + project.stats.genYZ : 0;
  const totalOver40 = project ? project.stats.genX + project.stats.boomer : 0;
  const totalAge = totalUnder40 + totalOver40;
  const totalMerch = project ? project.stats.merched + project.stats.jersey + project.stats.scarf + project.stats.flags + project.stats.baseballCap + project.stats.other : 0;

  /* What: Enhanced PDF export with smart pagination
     Why: Hero on every page, no element splitting, intelligent pagination */
  const handleExportPDF = useCallback(async () => {
    try {
      await exportPageWithSmartPagination(
        'stats-hero-section',
        'stats-content-section',
        {
          filename: project ? `${project.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_stats` : 'messmass-stats',
          orientation: 'portrait',
          quality: 0.95
        }
      );
      alert('PDF exported successfully! 📄');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  }, [project]);

  /* What: CSV export function (2-column table: Variable, Value)
     Why: Export all relevant variables as name/value rows for easy spreadsheet usage */
  const [includeDerived, setIncludeDerived] = useState(false);
  const exportCSV = () => {
    if (!project) return;

    const stats = project.stats;

    // Helper to CSV-escape values and always wrap in quotes for safety
    const esc = (v: any) => {
      const s = String(v ?? '');
      return '"' + s.replace(/"/g, '""') + '"';
    };

    // Collect rows as [Variable, Value]
    const rows: Array<[string, string | number]> = [];

    // High-level metadata first (timestamps must already be ISO 8601 with ms in DB)
    rows.push(['Event Name', project.eventName]);
    rows.push(['Event Date', project.eventDate]);
    rows.push(['Created At', project.createdAt]);
    rows.push(['Updated At', project.updatedAt]);

    // Derived metrics (optional)
    if (includeDerived) {
      rows.push(['totalImages', totalImages]);
      rows.push(['totalFans', totalFans]);
      rows.push(['totalGender', totalGender]);
      rows.push(['totalUnder40', totalUnder40]);
      rows.push(['totalOver40', totalOver40]);
      rows.push(['totalAge', totalAge]);
      rows.push(['totalMerch', totalMerch]);
    }

    // All stats variables exactly as stored
    Object.entries(stats).forEach(([key, value]) => {
      rows.push([key, typeof value === 'number' || typeof value === 'string' ? value : '']);
    });

    // Build CSV with header
    const header = ['Variable', 'Value'];
    const csv = [header, ...rows]
      .map(([k, v]) => `${esc(k)},${esc(v)}`)
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const base = project.eventName.replace(/[^a-zA-Z0-9]/g, '_') || 'event';
      link.setAttribute('href', url);
      link.setAttribute('download', `${base}_variables.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Show login screen if not authenticated
  if (checkingAuth || (!isAuthorized && slug)) {
    return (
      <PagePasswordLogin
        pageId={slug}
        pageType="event-report"
        onSuccess={handleLoginSuccess}
        title={project ? `${project.eventName} - Statistics Access` : 'Statistics Access Required'}
        description={project ? 
          `Enter the password to view statistics for "${project.eventName}"` : 
          'This statistics page is password protected. Enter the admin password or page-specific password to continue.'
        }
      />
    );
  }

  // Searching state while resolving project by slug
  if (resolving || (!project && !error)) {
    return (
      <div className={`admin-container ${styles.searchContainer}`}>
        <StandardState
          variant="loading"
          title="📊 Searching the Project page"
          message={"We are preparing the statistics page you're looking for."}
        />
      </div>
    );
  }

  /* What: Error state with flat TailAdmin V2 design
     Why: Modern card styling without glass-morphism effects */
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h1 className={styles.errorHeading}>❌ Error</h1>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  /* What: Main stats page container with flat TailAdmin V2 design
     Why: Modern, clean layout with proper spacing and typography
     
     Features:
     - Flat white background with subtle gray page background
     - Proper spacing using design system tokens
     - Optional custom page style gradients
     - Responsive padding for different screen sizes */
  // WHAT: Validate pageStyle values before using in inline styles
  // WHY: React calls .trim() on style values, will crash if undefined/null
  // HOW: Triple-check each value independently with safe fallbacks
  const safePageStyle = pageStyle ? {
    background: generateGradientCSS(pageStyle.pageBackground),
    color: (typeof pageStyle.typography?.primaryTextColor === 'string' && pageStyle.typography.primaryTextColor.trim()) 
      ? pageStyle.typography.primaryTextColor.trim() 
      : undefined,
    fontFamily: (typeof pageStyle.typography?.fontFamily === 'string' && pageStyle.typography.fontFamily.trim()) 
      ? pageStyle.typography.fontFamily.trim() 
      : undefined
  } : undefined;
  
  return (
    <div 
      className={styles.pageContainer}
      style={safePageStyle}
    >

      {/* What: Main content container wrapper for PDF export
          Why: Contains hero and content sections separately for smart pagination */}
      <div className={styles.contentWrapper}>
        {/* WHAT: Hero section with unique ID for PDF export
            WHY: Will be captured separately and repeated on every PDF page */}
        <div id="stats-hero-section">
          {/* Unified Hero Section with CSV and PDF export */}
          <UnifiedStatsHero
          title={project.eventName}
          hashtags={project.hashtags || []}
          categorizedHashtags={project.categorizedHashtags || {}}
          partner1={project.partner1 || null}
          partner2={project.partner2 || null}
          createdDate={project.createdAt}
          lastUpdatedDate={project.updatedAt}
          pageStyle={pageStyle || undefined}
          onExportCSV={exportCSV}
          onExportPDF={handleExportPDF}
          hidePartnerEmoji={true}
          />
        </div>

        {/* WHAT: Data Quality Insights Section
            WHY: Show KYC-based insights for data completeness, consistency, and enrichment opportunities
            HOW: Use pre-computed insights from top-level useMemo hook */}
        {dataQualityInsights && showInsights && (
          <div className={styles.insightsSection}>
            <div className={styles.insightsSectionHeader}>
              <h2 className={styles.insightsSectionTitle}>📊 Data Quality Insights</h2>
              <button 
                className={styles.toggleInsightsButton}
                onClick={() => setShowInsights(false)}
                aria-label="Hide insights"
              >
                Hide Insights
              </button>
            </div>
            <DataQualityInsights insights={dataQualityInsights} variant="stats" />
          </div>
        )}
        
        {/* WHAT: Show insights button when hidden
            WHY: Allow users to toggle insights visibility */}
        {!showInsights && (
          <div className={styles.showInsightsContainer}>
            <button
              className={styles.showInsightsButton}
              onClick={() => setShowInsights(true)}
              style={(() => {
                // WHAT: Validate each style property independently
                // WHY: Prevent undefined from being passed to React style prop
                const bgColor = (typeof pageStyle?.contentBoxBackground?.solidColor === 'string' && pageStyle.contentBoxBackground.solidColor.trim()) 
                  ? pageStyle.contentBoxBackground.solidColor.trim() 
                  : undefined;
                const textColor = (typeof pageStyle?.typography?.primaryTextColor === 'string' && pageStyle.typography.primaryTextColor.trim()) 
                  ? pageStyle.typography.primaryTextColor.trim() 
                  : undefined;
                return (bgColor || textColor) ? { backgroundColor: bgColor, color: textColor } : undefined;
              })()}
            >
              📊 Show Data Quality Insights
            </button>
          </div>
        )}

        {/* WHAT: Content section with unique ID for PDF export
            WHY: Contains all charts/blocks that will be paginated intelligently */}
        <div id="stats-content-section" className={styles.dataVisualization}>
          <UnifiedDataVisualization
            blocks={dataBlocks}
            chartResults={chartResults}
            loading={false}
            gridUnits={gridUnits}
            useChartContainer={false}
            pageStyle={pageStyle || undefined}
          />
        </div>
      </div>
    </div>
  );
}
