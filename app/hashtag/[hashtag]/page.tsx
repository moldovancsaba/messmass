'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../stats/[slug]/stats.module.css';
import '../../charts.css';
import { DynamicChart, ChartContainer } from '@/components/DynamicChart';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';

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
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading hashtag statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>❌ Error</h1>
          <p>{error}</p>
          <p>The hashtag you're looking for might not exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>📊 Hashtag Not Found</h1>
          <p>No projects found with this hashtag.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header with hashtag styling */}
      <div className="glass-card admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.5rem' }}>
              <ColoredHashtagBubble 
                hashtag={actualHashtag || hashtagParam}
                customStyle={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  padding: '1rem 2rem'
                }}
              />
            </div>
            <p className="admin-subtitle">Aggregated Statistics - {project.dateRange.formatted}</p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              <a 
                href="#projects-list"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('projects-list')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ 
                  cursor: 'pointer', 
                  color: '#6366f1',
                  textDecoration: 'none',
                  borderBottom: '1px dashed #6366f1'
                }}
                title="Click to view projects"
              >
                📊 {project.projectCount} project{project.projectCount !== 1 ? 's' : ''} with this hashtag
              </a>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button 
                onClick={refreshData}
                disabled={loading}
                style={{
                  background: loading ? '#6b7280' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                title="Refresh data to see latest updates"
              >
                {loading ? '⏳ Refreshing...' : '🔄 Refresh Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid Section */}
      <div className="glass-card charts-section">
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 1.5rem 0',
          lineHeight: '1.25'
        }}>📊 Data Visualization</h2>
        
        {chartsLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading charts...</p>
          </div>
        ) : (
          <div>
            {chartResults.length > 0 ? (
              <div className="dynamic-charts-grid">
                {chartResults.map((result, index) => {
                  console.log(`Chart ${result.chartId}:`, result);
                  
                  // Check if chart has any valid data (not all NA and not all zero)
                  const validElements = result.elements.filter(element => 
                    typeof element.value === 'number'
                  );
                  const totalValue = validElements.reduce((sum, element) => sum + (element.value as number), 0);
                  
                  console.log(`Chart ${result.chartId} - validElements: ${validElements.length}, totalValue: ${totalValue}`);
                  
                  // Only hide charts if ALL elements are NA or if it's a pie chart with zero total
                  const shouldShow = validElements.length > 0 && (
                    result.type === 'bar' || totalValue > 0
                  );
                  
                  if (!shouldShow) {
                    console.log(`Hiding chart ${result.chartId} - no valid data`);
                    return null;
                  }
                  
                  return (
                    <ChartContainer 
                      key={result.chartId}
                      title={result.title}
                      subtitle={result.subtitle}
                      emoji={result.emoji}
                      className="chart-item"
                    >
                      <DynamicChart result={result} />
                    </ChartContainer>
                  );
                }).filter(Boolean)}
              </div>
            ) : (
              <div className={styles.error}>
                <p>No chart configurations available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Stats Layout */}
      <div className="stats-layout-container">
        {/* Row 1: Images, Fans, Gender */}
        <div className="stats-row-3">
          <div className="stats-section-new">
            <h2 className="stats-section-title">📸 Images ({totalImages})</h2>
            <div className="stats-cards-row">
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Remote Images</div>
                <div className={styles.statValue}>{project.stats.remoteImages}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Hostess Images</div>
                <div className={styles.statValue}>{project.stats.hostessImages}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Selfies</div>
                <div className={styles.statValue}>{project.stats.selfies}</div>
              </div>
            </div>
          </div>

          <div className="stats-section-new">
            <h2 className="stats-section-title">👥 Fans ({totalFans})</h2>
            <div className="stats-cards-row">
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Indoor</div>
                <div className={styles.statValue}>{project.stats.indoor}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Outdoor</div>
                <div className={styles.statValue}>{project.stats.outdoor}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Stadium</div>
                <div className={styles.statValue}>{project.stats.stadium}</div>
              </div>
            </div>
          </div>

          <div className="stats-section-new">
            <h2 className="stats-section-title">⚧️ Gender ({totalGender})</h2>
            <div className="stats-cards-row">
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Female</div>
                <div className={styles.statValue}>{project.stats.female}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Male</div>
                <div className={styles.statValue}>{project.stats.male}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Age Groups (2/3) and Fans with Merchandise (1/3) */}
        <div className="stats-row-2-3-1">
          <div className="stats-section-new">
            <h2 className="stats-section-title">🎂 Age Groups ({totalAge})</h2>
            <div className="stats-cards-row-age">
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Gen Alpha</div>
                <div className={styles.statValue}>{project.stats.genAlpha}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Gen Y+Z</div>
                <div className={styles.statValue}>{project.stats.genYZ}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Under 40</div>
                <div className={styles.statValue}>{totalUnder40}</div>
              </div>
            </div>
            <div className="stats-cards-row-age">
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Gen X</div>
                <div className={styles.statValue}>{project.stats.genX}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Boomer</div>
                <div className={styles.statValue}>{project.stats.boomer}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Over 40</div>
                <div className={styles.statValue}>{totalOver40}</div>
              </div>
            </div>
          </div>

          <div className="stats-section-new">
            <h2 className="stats-section-title">🛑️ Fans with Merchandise</h2>
            <div className="stats-cards-row">
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Merched Fans</div>
                <div className={styles.statValue}>{project.stats.merched}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Merchandise Types (Full Width) */}
        <div className="stats-row-full">
          <div className="stats-section-new">
            <h2 className="stats-section-title">👕 Merchandise Types ({totalMerch})</h2>
            <div className="merch-cards-grid">
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Jersey</div>
                <div className={styles.statValue}>{project.stats.jersey}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Scarf</div>
                <div className={styles.statValue}>{project.stats.scarf}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Flags</div>
                <div className={styles.statValue}>{project.stats.flags}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Baseball Cap</div>
                <div className={styles.statValue}>{project.stats.baseballCap}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Other</div>
                <div className={styles.statValue}>{project.stats.other}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Manager Section - if data exists */}
        {(project.stats.approvedImages || project.stats.eventAttendees || project.stats.visitWeb) && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📈 Performance Metrics</h2>
            <div className={styles.statsRow}>
              {project.stats.approvedImages !== undefined && (
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Approved Images</div>
                  <div className={styles.statValue}>{project.stats.approvedImages}</div>
                </div>
              )}
              {project.stats.eventAttendees !== undefined && (
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Event Attendees</div>
                  <div className={styles.statValue}>{project.stats.eventAttendees}</div>
                </div>
              )}
              {project.stats.visitWeb !== undefined && (
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Web Visits</div>
                  <div className={styles.statValue}>{project.stats.visitWeb}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Projects List Section */}
      {projects.length > 0 && (
        <div id="projects-list" className="glass-card" style={{ marginTop: '3rem' }}>
          <h2 style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#1f2937 !important',
            fontWeight: '600',
            fontSize: '1.875rem',
            marginBottom: '1.5rem'
          }}>
            <span style={{ color: '#1f2937' }}>📊 Projects with </span>
            <ColoredHashtagBubble 
              hashtag={actualHashtag || hashtagParam}
              customStyle={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: 'white'
              }}
            />
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
                  fontWeight: '600',
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
                      fontWeight: '500'
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
      <div className={styles.footer}>
        <p>Generated on {new Date().toLocaleDateString()} • MessMass Hashtag Statistics</p>
      </div>
    </div>
  );
}
