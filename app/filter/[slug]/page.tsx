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
  const [hashtags, setHashtags] = useState<string[]>([]);

  // Function to fetch filter data
  const fetchFilterData = useCallback(async () => {
    try {
      console.log('🔍 Fetching filter data for slug:', filterSlug);
      const response = await fetch(`/api/hashtags/filter-by-slug/${filterSlug}`);
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
  }, [filterSlug]);

  // Function to fetch page configuration
  const fetchPageConfig = useCallback(async (opts?: { styleId?: string | null; hashtags?: string[] }) => {
    try {
      let qs = '';
      if (opts?.styleId) {
        qs = `?styleId=${encodeURIComponent(opts.styleId)}`;
      } else if (opts?.hashtags && opts.hashtags.length > 0) {
        qs = `?hashtags=${encodeURIComponent(opts.hashtags.join(','))}`;
      }
      const response = await fetch(`/api/page-config${qs}`);
      const data = await response.json();

      if (data.success) {
        setPageStyle(data.config.pageStyle);
        setDataBlocks(data.config.dataBlocks);
      }
    } catch (err) {
      console.error('Failed to fetch page config:', err);
    }
  }, []);

  // Load chart configurations
  const loadChartConfigurations = useCallback(async () => {
    try {
      const response = await fetch('/api/chart-config/public');
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

  // Export filtered results as CSV
  const exportFilteredCSV = () => {
    if (!project) return;

    const stats = project.stats;
    const csvData = [
      ['MessMass Multi-Hashtag Filter Export'],
      ['Filter Tags', hashtags.map(tag => `#${tag}`).join(' AND ')],
      ['Projects Matched', project.projectCount.toString()],
      ['Date Range', project.dateRange.formatted],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images', 'Remote Images', stats.remoteImages],
      ['Images', 'Hostess Images', stats.hostessImages],
      ['Images', 'Selfies', stats.selfies],
      ['Fans', 'Indoor', stats.indoor],
      ['Fans', 'Outdoor', stats.outdoor],
      ['Fans', 'Stadium', stats.stadium],
      ['Gender', 'Female', stats.female],
      ['Gender', 'Male', stats.male],
      ['Age', 'Gen Alpha', stats.genAlpha],
      ['Age', 'Gen Y+Z', stats.genYZ],
      ['Age', 'Gen X', stats.genX],
      ['Age', 'Boomer', stats.boomer],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf', stats.scarf],
      ['Merchandise', 'Flags', stats.flags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap],
      ['Merchandise', 'Other', stats.other],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `messmass_filter_${hashtags.join('_')}_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Show checking authentication screen
  if (checkingAuth) {
    return (
      <div className="loading-centered-container">
        <div className="loading-card">
          <div className="curve-spinner"></div>
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

  if (loading) {
    return (
      <div className="loading-centered-container">
        <div className="loading-card">
          <div className="curve-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
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
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>
            {error ? '❌ Error' : '📊 Filter Not Found'}
          </h1>
          <p style={{ color: '#6b7280' }}>
            {error || "The filter you're looking for might not exist or may have been removed."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Unified Hero Section */}
      <UnifiedStatsHero
        title={`Aggregated Statistics - ${project.dateRange.formatted}`}
        hashtags={hashtags}
        createdDate={project.createdAt}
        lastUpdatedDate={project.updatedAt}
        pageStyle={pageStyle || undefined}
        onExportCSV={exportFilteredCSV}
      />

      {/* Unified Data Visualization */}
      <div style={{ width: '100%', padding: '0' }}>
        <UnifiedDataVisualization
          blocks={dataBlocks}
          chartResults={chartResults}
          loading={chartsLoading}
        />
      </div>

      {/* Unified Projects Section */}
      {projects.length > 0 && (
        <UnifiedProjectsSection
          projects={projects}
          title={`Projects with ${hashtags.map(h => `#${h}`).join(' + ')} (${projects.length})`}
        />
      )}
    </div>
  );
}
