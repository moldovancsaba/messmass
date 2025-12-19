'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import UnifiedStatsHero from '@/components/UnifiedStatsHero';
import UnifiedDataVisualization from '@/components/UnifiedDataVisualization';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import { DataVisualizationBlock } from '@/lib/pageStyleTypes';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';

// WHAT: Removed legacy CSS imports (stats.module.css, charts.css)
// WHY: They imposed hard-coded grid and min-width constraints (e.g., 450px min track, 500px max chart width)
// that conflict with the admin visualization layout. Using UnifiedStatsHero + UnifiedDataVisualization
// ensures the stats page renders exactly as configured in admin visualization blocks without baked-in layout.

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
  createdAt: string;
  updatedAt: string;
}

export default function HashtagStatsPage() {
  const params = useParams();
  const hashtagParam = params?.hashtag as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [chartConfigurations, setChartConfigurations] = useState<ChartConfiguration[]>([]);
  const [chartResults, setChartResults] = useState<ChartCalculationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualHashtag, setActualHashtag] = useState<string>('');
  const [pageStyle, setPageStyle] = useState<PageStyleEnhanced | null>(null);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [gridUnits, setGridUnits] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });
  const [includeDerived, setIncludeDerived] = useState(false);

  // Function to force refresh data
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    await fetchHashtagStatsData();
  };

  // Function to fetch hashtag stats data
  const fetchHashtagStatsData = useCallback(async () => {
    try {
      console.log('🔍 Fetching hashtag stats for:', hashtagParam);
      // Add cache-busting parameter to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/hashtags/${encodeURIComponent(hashtagParam)}?refresh=${timestamp}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
        setProjects(data.projects || []);
        // Extract the actual hashtag name from the project data
        if (data.project.hashtags && data.project.hashtags.length > 0) {
          setActualHashtag(data.project.hashtags[0]);
        }
      } else {
        setError(data.error || 'Failed to load hashtag statistics');
      }
    } catch (err) {
      console.error('Failed to fetch hashtag stats:', err);
      setError('Failed to load hashtag statistics');
    } finally {
      setLoading(false);
    }
  }, [hashtagParam]);

  useEffect(() => {
    if (hashtagParam) {
      fetchHashtagStatsData();
    }
  }, [hashtagParam, fetchHashtagStatsData]);

  // Fetch page configuration (style + data blocks) for this hashtag (uses hashtag -> style mapping or global)
  useEffect(() => {
    const resolveConfig = async (tag: string) => {
      try {
        const clean = tag.replace(/^#/, '').trim();
        if (!clean) return;
        const res = await fetch(`/api/page-config?hashtags=${encodeURIComponent(clean)}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setPageStyle(data.config.pageStyle);
          setDataBlocks(data.config.dataBlocks || []);
          if (data.config.gridSettings) {
            const gs = data.config.gridSettings;
            setGridUnits({ desktop: gs.desktopUnits, tablet: gs.tabletUnits, mobile: gs.mobileUnits });
          }
        }
      } catch (e) {
        console.error('Failed to fetch page config for hashtag', tag, e);
      }
    };

    if (actualHashtag) {
      resolveConfig(actualHashtag);
    } else if (hashtagParam) {
      resolveConfig(String(hashtagParam));
    }
  }, [actualHashtag, hashtagParam]);

  // Fetch chart configurations
  useEffect(() => {
    const fetchChartConfigurations = async () => {
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
    };

    fetchChartConfigurations();
  }, []);

  // Calculate chart results when project and configurations are loaded
  useEffect(() => {
    if (project && chartConfigurations.length > 0) {
      setChartsLoading(true);
      try {
        console.log('🧮 Calculating chart results with hashtag aggregated stats...');
        console.log('Project stats:', project.stats);
        console.log('Chart configurations:', chartConfigurations);
        
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
        setChartResults([]);
      } finally {
        setChartsLoading(false);
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

  if (loading) {
    return (
      <div className="loading-centered-container">
        <div className="loading-card">
          <div className="curve-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h1 className="text-error mb-md">❌ Error</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-gray-600">The hashtag you&apos;re looking for might not exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="error-container">
        <div className="card text-center">
          <div className="card-body">
            <h1 className="text-gray-900 mb-md">📊 Hashtag Not Found</h1>
            <p className="text-gray-600">No projects found with this hashtag.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="admin-container"
      style={(() => {
        if (!pageStyle) return undefined;
        const safeColor = (typeof pageStyle.typography?.primaryTextColor === 'string' && pageStyle.typography.primaryTextColor.trim()) ? pageStyle.typography.primaryTextColor.trim() : undefined;
        const safeFont = (typeof pageStyle.typography?.fontFamily === 'string' && pageStyle.typography.fontFamily.trim()) ? pageStyle.typography.fontFamily.trim() : undefined;
        return {
          background: generateGradientCSS(pageStyle.pageBackground),
          color: safeColor,
          fontFamily: safeFont
        };
      })()}
    >

      {/* Unified Hero — EXACT same component used by /stats and /filter */}
      <UnifiedStatsHero
        title={`Aggregated Statistics — ${actualHashtag ? `#${actualHashtag}` : `#${String(hashtagParam)}`}`}
        hashtags={[actualHashtag || String(hashtagParam)]}
        createdDate={project.createdAt}
        lastUpdatedDate={project.updatedAt}
        pageStyle={pageStyle || undefined}
        onExportCSV={() => {
          // CSV export for hashtag aggregated stats (2-column table: Variable, Value)
          const esc = (v: any) => {
            const s = String(v ?? '');
            return '"' + s.replace(/"/g, '""') + '"';
          };
          const rows: Array<[string, string | number]> = [];
          const tag = actualHashtag || String(hashtagParam);
          rows.push(['Hashtag', `#${tag}`]);
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
          Object.entries(project.stats).forEach(([key, value]) => {
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
            link.setAttribute('download', `hashtag_${tag.replace(/[^a-zA-Z0-9]/g, '_')}_variables.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }}
        extraContent={(
          <label className="flex items-center gap-sm" style={{cursor: 'pointer'}}>
            <input
              type="checkbox"
              checked={includeDerived}
              onChange={(e) => setIncludeDerived(e.target.checked)}
            />
            <span>Include derived metrics</span>
          </label>
        )}
      />

      {/* Unified Data Visualization — driven entirely by admin visualization blocks */}
      <div className="w-full" style={{padding: 0}}>
        <UnifiedDataVisualization
          blocks={dataBlocks}
          chartResults={chartResults}
          loading={chartsLoading}
          gridUnits={gridUnits}
        />
      </div>

      {/* WHAT: Project list with utility classes */}
      {projects.length > 0 && (
        <div id="projects-list" className="card mt-lg">
          <div className="card-header">
            <h2 className="text-2xl font-bold m-0 text-gray-900">
              Projects with {actualHashtag ? `#${actualHashtag}` : `#${String(hashtagParam)}`} ({projects.length})
            </h2>
          </div>
          <div className="card-body">
            <div className="projects-list-grid">
              {projects.map((projectItem) => (
                <div key={projectItem._id} className="project-list-item">
                  <h3 className="project-item-title">
                    {projectItem.viewSlug ? (
                      <a 
              href={`/report/${projectItem.viewSlug}`}
                        className="project-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`View statistics for ${projectItem.eventName}`}
                      >
                        {projectItem.eventName}
                      </a>
                    ) : (
                      <span>{projectItem.eventName}</span>
                    )}
                  </h3>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>📅 {new Date(projectItem.eventDate).toLocaleDateString()}</span>
                    {projectItem.viewSlug && (
                      <span className="view-stats-badge">
                        📊 View Stats
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-lg p-md text-gray-500">
        <p className="m-0">Generated on {new Date().toLocaleDateString()} • MessMass Hashtag Statistics</p>
      </div>
    </div>
  );
}
