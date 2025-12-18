// WHAT: React Hook for Report Layout Resolution (v12.0.0)
// WHY: Components need to fetch and work with report layouts and grid settings
// HOW: Fetch from /api/reports/resolve and provide layout utilities

import { useState, useEffect, useMemo } from 'react';
import type { Report } from '@/lib/report-resolver';

/**
 * Block with computed chart references
 * WHAT: Single section of a report containing multiple charts
 * WHY: Reports are divided into logical blocks (Hero, Stats, etc.)
 */
export interface ReportBlock {
  id: string;
  title: string;
  showTitle: boolean;
  order: number;
  charts: Array<{
    chartId: string;
    width: number;
    order: number;
  }>;
}

/**
 * Grid settings for responsive layouts
 * WHAT: Column configuration for different screen sizes
 * WHY: Reports must be responsive across desktop, tablet, mobile
 */
export interface GridSettings {
  desktop: number;
  tablet: number;
  mobile: number;
}

/**
 * Resolution metadata
 * WHAT: Information about where the report configuration came from
 * WHY: Useful for debugging and admin UI display
 */
export interface LayoutResolution {
  resolvedFrom: 'project' | 'partner' | 'default';
  source: string;
}

/**
 * useReportLayout() return value
 */
export interface UseReportLayoutReturn {
  // Data
  report: Report | null;
  blocks: ReportBlock[];
  gridSettings: GridSettings;
  resolution: LayoutResolution | null;
  
  // UI States
  loading: boolean;
  error: string | null;
  
  // Utility Methods
  getBlock: (blockId: string) => ReportBlock | undefined;
  getChartIds: () => string[];
  getTotalCharts: () => number;
}

/**
 * Hook options
 */
interface UseReportLayoutOptions {
  projectId?: string;
  partnerId?: string;
  autoFetch?: boolean; // Default: true
}

/**
 * useReportLayout()
 * 
 * WHAT: Fetch and manage report layout configuration
 * WHY: Components need structured access to report blocks, grids, and resolution
 * 
 * @param options - Configuration options
 * @returns Layout data, loading state, error state, and utility methods
 * 
 * @example
 * const { report, blocks, gridSettings, loading } = useReportLayout({ projectId: '123' });
 */
export function useReportLayout(options: UseReportLayoutOptions): UseReportLayoutReturn {
  const { projectId, partnerId, autoFetch = true } = options;

  const [report, setReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState<LayoutResolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if autoFetch disabled or no entity ID provided
    if (!autoFetch || (!projectId && !partnerId)) {
      return;
    }

    // Skip if both IDs provided (invalid state)
    if (projectId && partnerId) {
      setError('Provide either projectId or partnerId, not both');
      return;
    }

    async function fetchLayout() {
      setLoading(true);
      setError(null);

      try {
        // Build query params
        const params = new URLSearchParams();
        if (projectId) params.set('projectId', projectId);
        if (partnerId) params.set('partnerId', partnerId);

        // Fetch resolved report
        const response = await fetch(`/api/reports/resolve?${params.toString()}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch report layout');
        }

        setReport(data.report);
        setResolution({
          resolvedFrom: data.resolvedFrom,
          source: data.source
        });

      } catch (err) {
        console.error('❌ [useReportLayout] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load layout');
      } finally {
        setLoading(false);
      }
    }

    fetchLayout();
  }, [projectId, partnerId, autoFetch]);

  // Extract blocks from report layout (sorted by order)
  // IMPORTANT: Memoize to prevent infinite loops in components that depend on blocks
  const blocks: ReportBlock[] = useMemo(() => {
    if (!report?.layout.blocks) return [];
    return report.layout.blocks
      .slice()
      .sort((a, b) => a.order - b.order);
  }, [report]);

  // Extract grid settings with fallback defaults
  // IMPORTANT: Memoize to prevent unnecessary re-renders
  const gridSettings: GridSettings = useMemo(() => ({
    desktop: report?.layout.gridColumns.desktop || 3,
    tablet: report?.layout.gridColumns.tablet || 2,
    mobile: report?.layout.gridColumns.mobile || 1
  }), [report]);

  // Utility: Get specific block by ID
  const getBlock = (blockId: string): ReportBlock | undefined => {
    return blocks.find(block => block.id === blockId);
  };

  // Utility: Get all chart IDs in the report (flattened from all blocks)
  const getChartIds = (): string[] => {
    return blocks.flatMap(block => 
      block.charts
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(chart => chart.chartId)
    );
  };

  // Utility: Get total number of charts across all blocks
  const getTotalCharts = (): number => {
    return blocks.reduce((total, block) => total + block.charts.length, 0);
  };

  return {
    // Data
    report,
    blocks,
    gridSettings,
    resolution,
    
    // States
    loading,
    error,
    
    // Utilities
    getBlock,
    getChartIds,
    getTotalCharts
  };
}

/**
 * useReportLayoutForProject()
 * 
 * WHAT: Convenience wrapper for project-specific layout fetching
 * WHY: Cleaner API when you know you're working with a project
 * 
 * @param projectId - Project ID or slug (null = skip fetch)
 * @returns Layout data and states
 */
export function useReportLayoutForProject(projectId: string | null): UseReportLayoutReturn {
  return useReportLayout({ projectId: projectId || undefined });
}

/**
 * useReportLayoutForPartner()
 * 
 * WHAT: Convenience wrapper for partner-specific layout fetching
 * WHY: Cleaner API when you know you're working with a partner
 * 
 * @param partnerId - Partner ID or slug (null = skip fetch)
 * @returns Layout data and states
 */
export function useReportLayoutForPartner(partnerId: string | null): UseReportLayoutReturn {
  return useReportLayout({ partnerId: partnerId || undefined });
}
