'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import UnifiedStatsHero from '@/components/UnifiedStatsHero';
import UnifiedDataVisualization from '@/components/UnifiedDataVisualization';
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
  hashtags?: string[]; // Array of hashtag strings
  stats: ProjectStats;
  createdAt: string;
  updatedAt: string;
}

export default function StatsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [chartConfigurations, setChartConfigurations] = useState<ChartConfiguration[]>([]);
  const [chartResults, setChartResults] = useState<ChartCalculationResult[]>([]);
  const [pageStyle, setPageStyle] = useState<PageStyle | null>(null);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to force refresh data
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    await fetchProjectData();
  };

  // Function to fetch project data
  const fetchProjectData = useCallback(async () => {
    try {
      console.log('🔍 Fetching project stats for slug:', slug);
      // Add cache-busting parameter to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/projects/stats/${slug}?refresh=${timestamp}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
      } else {
        setError(data.error || 'Failed to load project');
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [slug]);

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

  useEffect(() => {
    if (slug) {
      fetchProjectData();
      fetchPageConfig();
    }
  }, [slug, fetchProjectData, fetchPageConfig]);

  // Fetch chart configurations
  const fetchChartConfigurations = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchChartConfigurations();
  }, [fetchChartConfigurations]);

  // Calculate chart results when project and configurations are loaded
  useEffect(() => {
    if (project && chartConfigurations.length > 0) {
      setChartsLoading(true);
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

  // CSV export function
  const exportCSV = () => {
    if (!project) return;

    const stats = project.stats;
    const csvData = [
      ['MessMass Event Statistics Export'],
      ['Event Name', project.eventName],
      ['Event Date', new Date(project.eventDate).toLocaleDateString()],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images', 'Remote Images', stats.remoteImages],
      ['Images', 'Hostess Images', stats.hostessImages],
      ['Images', 'Selfies', stats.selfies],
      ['Images', 'Approved Images', stats.approvedImages || 0],
      ['Images', 'Rejected Images', stats.rejectedImages || 0],
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
      link.setAttribute('download', `${project.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_stats_export.csv`);
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
          <p style={{ color: '#6b7280', margin: 0 }}>Loading event statistics...</p>
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
            {error ? '❌ Error' : '📊 Project Not Found'}
          </h1>
          <p style={{ color: '#6b7280' }}>
            {error || "The statistics page you're looking for doesn't exist."}
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
        title={project.eventName}
        hashtags={project.hashtags || []}
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

    </div>
  );
}
