'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import UnifiedStatsHero from '@/components/UnifiedStatsHero';
import UnifiedDataVisualization from '@/components/UnifiedDataVisualization';
import UnifiedProjectsSection from '@/components/UnifiedProjectsSection';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import { PageStyle, DataVisualizationBlock } from '@/lib/pageStyleTypes';

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
  const [pageStyle, setPageStyle] = useState<PageStyle | null>(null);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualHashtag, setActualHashtag] = useState<string>('');

  // Function to fetch hashtag stats data
  const fetchHashtagStatsData = useCallback(async () => {
    try {
      console.log('🔍 Fetching hashtag stats for:', hashtagParam);
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/hashtags/${encodeURIComponent(hashtagParam)}?refresh=${timestamp}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
        setProjects(data.projects || []);
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

  // Function to fetch page configuration
  const fetchPageConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/page-config');
      const data = await response.json();

      if (data.success) {
        setPageStyle(data.config.pageStyle);
        setDataBlocks(data.config.dataBlocks);
      }
    } catch (err) {
      console.error('Failed to fetch page config:', err);
    }
  }, []);

  // Fetch chart configurations
  const fetchChartConfigurations = useCallback(async () => {
    try {
      console.log('📊 Fetching chart configurations...');
      const response = await fetch('/api/chart-config/public');
      const data = await response.json();

      if (data.success) {
        setChartConfigurations(data.configurations);
      }
    } catch (err) {
      console.error('Failed to fetch chart configurations:', err);
    }
  }, []);

  useEffect(() => {
    if (hashtagParam) {
      fetchHashtagStatsData();
      fetchPageConfig();
    }
  }, [hashtagParam, fetchHashtagStatsData, fetchPageConfig]);

  useEffect(() => {
    fetchChartConfigurations();
  }, [fetchChartConfigurations]);

  // Calculate chart results when project and configurations are loaded
  useEffect(() => {
    if (project && chartConfigurations.length > 0) {
      setChartsLoading(true);
      try {
        const results = calculateActiveCharts(chartConfigurations, project.stats);
        setChartResults(results);
      } catch (err) {
        console.error('❌ Failed to calculate chart results:', err);
        setChartResults([]);
      } finally {
        setChartsLoading(false);
      }
    }
  }, [project, chartConfigurations]);

  // CSV export function
  const exportCSV = () => {
    if (!project) return;

    const stats = project.stats;
    const csvData = [
      ['MessMass Hashtag Statistics Export'],
      ['Hashtag', `#${actualHashtag || hashtagParam}`],
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
      link.setAttribute('download', `hashtag_${(actualHashtag || hashtagParam).replace('#', '')}_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: pageStyle ? `linear-gradient(${pageStyle.backgroundGradient})` : '#f8fafc',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(99, 102, 241, 0.3)',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Loading hashtag statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{
        minHeight: '100vh',
        background: pageStyle ? `linear-gradient(${pageStyle.backgroundGradient})` : '#f8fafc',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>
            {error ? '❌ Error' : '📊 Hashtag Not Found'}
          </h1>
          <p style={{ color: '#6b7280' }}>
            {error || "No projects found with this hashtag."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: pageStyle ? `linear-gradient(${pageStyle.backgroundGradient})` : '#f8fafc'
    }}>
      {/* Unified Hero Section */}
      <UnifiedStatsHero
        title={`Aggregated Statistics - ${project.dateRange.formatted}`}
        hashtags={[actualHashtag || hashtagParam]}
        createdDate={project.createdAt}
        lastUpdatedDate={project.updatedAt}
        pageStyle={pageStyle || undefined}
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
        <div style={{ width: '100%', padding: '0 1rem' }}>
          <UnifiedProjectsSection
            projects={projects.map(p => ({ ...p, hashtags: [actualHashtag || hashtagParam] }))}
            title={`Projects with #${actualHashtag || hashtagParam} (${projects.length})`}
          />
        </div>
      )}
    </div>
  );
}
