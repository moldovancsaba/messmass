'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import UnifiedStatsHero from '@/components/UnifiedStatsHero';
import UnifiedDataVisualization from '@/components/UnifiedDataVisualization';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import { PageStyle, DataVisualizationBlock } from '@/lib/pageStyleTypes';

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
  const [pageStyle, setPageStyle] = useState<PageStyle | null>(null);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [gridUnits, setGridUnits] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 4, tablet: 2, mobile: 1 });

  // Function to force refresh data
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    await fetchHashtagStatsData();
  };

  // Function to fetch hashtag stats data
  const fetchHashtagStatsData = async () => {
    try {
      console.log('🔍 Fetching hashtag stats for:', hashtagParam);
      // Add cache-busting parameter to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/hashtags/${encodeURIComponent(hashtagParam)}?refresh=${timestamp}`);
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
  };

  useEffect(() => {
    if (hashtagParam) {
      fetchHashtagStatsData();
    }
  }, [hashtagParam]);

  // Fetch page configuration (style + data blocks) for this hashtag (uses hashtag -> style mapping or global)
  useEffect(() => {
    const resolveConfig = async (tag: string) => {
      try {
        const clean = tag.replace(/^#/, '').trim();
        if (!clean) return;
        const res = await fetch(`/api/page-config?hashtags=${encodeURIComponent(clean)}`);
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
        const response = await fetch('/api/chart-config/public');
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
      <div className="admin-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>❌ Error</h1>
          <p style={{ color: '#6b7280' }}>{error}</p>
          <p style={{ color: '#6b7280' }}>The hashtag you&apos;re looking for might not exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="admin-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}>📊 Hashtag Not Found</h1>
          <p style={{ color: '#6b7280' }}>No projects found with this hashtag.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Inject resolved page style so hashtag page uses the same gradients as configured */}
      {pageStyle && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .admin-container { background: linear-gradient(${pageStyle.backgroundGradient}); }
              .admin-header { background: linear-gradient(${pageStyle.headerBackgroundGradient}); }
            `
          }}
        />
      )}

      {/* Unified Hero — EXACT same component used by /stats and /filter */}
      <UnifiedStatsHero
        title={`Aggregated Statistics — ${actualHashtag ? `#${actualHashtag}` : `#${String(hashtagParam)}`}`}
        hashtags={[actualHashtag || String(hashtagParam)]}
        createdDate={project.createdAt}
        lastUpdatedDate={project.updatedAt}
        pageStyle={pageStyle || undefined}
        onExportCSV={refreshData}
      />

      {/* Unified Data Visualization — driven entirely by admin visualization blocks */}
      <div style={{ width: '100%', padding: 0 }}>
        <UnifiedDataVisualization
          blocks={dataBlocks}
          chartResults={chartResults}
          loading={chartsLoading}
          gridUnits={gridUnits}
        />
      </div>

      {projects.length > 0 && (
        <div id="projects-list" className="glass-card" style={{ marginTop: '2rem', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1f2937' }}>
            Projects with {actualHashtag ? `#${actualHashtag}` : `#${String(hashtagParam)}`} ({projects.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {projects.map((projectItem) => (
              <div key={projectItem._id} style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}>
                <h3 style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#1f2937'
                }}>
                  {projectItem.viewSlug ? (
                    <a 
                      href={`/stats/${projectItem.viewSlug}`}
                      style={{
                        color: '#6366f1',
                        textDecoration: 'none',
                        borderBottom: '1px solid transparent',
                        transition: 'border-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderBottomColor = '#6366f1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderBottomColor = 'transparent';
                      }}
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <span>📅 {new Date(projectItem.eventDate).toLocaleDateString()}</span>
                  {projectItem.viewSlug && (
                    <span style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      📊 View Stats
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', color: '#4b5563' }}>
        <p style={{ margin: 0 }}>Generated on {new Date().toLocaleDateString()} • MessMass Hashtag Statistics</p>
      </div>
    </div>
  );
}
