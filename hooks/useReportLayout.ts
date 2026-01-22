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
  blockAspectRatio?: string; // R-LAYOUT-02.1: Optional block aspect ratio override (e.g., "4:6")
  tableHeightMultiplier?: number; // Table height control: height = blockWidth × multiplier (0.1 to 5.0)
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
        // Prefer new template-based API that reflects Visualization blocks exactly
        if (projectId) {
          const resp = await fetch(`/api/report-config/${encodeURIComponent(projectId)}?type=project`);
          const data = await resp.json();

          if (!resp.ok || !data.success || !data.template) {
            throw new Error(data.error || 'Failed to fetch report template');
          }

          const template = data.template as any;
          // Normalize template into Report shape expected by consumers
          const normalizedReport: Report = {
            _id: template._id,
            name: template.name,
            description: template.description,
            type: template.type === 'partner' ? 'partner' : 'event',
            isDefault: !!template.isDefault,
            styleId: template.styleId,
            layout: {
              gridColumns: {
                desktop: template.gridSettings?.desktopUnits ?? 3,
                tablet: template.gridSettings?.tabletUnits ?? 2,
                mobile: template.gridSettings?.mobileUnits ?? 1,
              },
              blocks: (template.dataBlocks || []).map((b: any) => ({
                id: b._id || b.blockId || String(b.order),
                title: b.overrides?.customTitle ?? b.name ?? 'Untitled Block',
                showTitle: b.overrides?.showTitle ?? (b.showTitle ?? true),
                order: Number(b.order ?? 0),
                charts: (b.charts || []).map((c: any) => ({
                  chartId: c.chartId,
                  width: Number(c.width ?? 1),
                  order: Number(c.order ?? 0),
                })),
                blockAspectRatio: b.blockAspectRatio || b.overrides?.blockAspectRatio, // R-LAYOUT-02.1: Optional aspect ratio override
                tableHeightMultiplier: b.tableHeightMultiplier || b.overrides?.tableHeightMultiplier, // Table height control
              })),
            },
            heroSettings: template.heroSettings ?? { showEmoji: true, showDateInfo: true, showExportOptions: true },
            alignmentSettings: template.alignmentSettings ?? { alignTitles: true, alignDescriptions: true, alignCharts: true, minElementHeight: undefined },
            createdBy: template.createdBy || 'system',
            createdAt: template.createdAt || new Date().toISOString(),
            updatedAt: template.updatedAt || new Date().toISOString(),
          } as Report;

          setReport(normalizedReport);
          setResolution({ resolvedFrom: data.resolvedFrom || 'project', source: data.source || template.name });
          return;
        }

        // Partner layout via template-based resolver (same as project)
        if (partnerId) {
          const resp = await fetch(`/api/report-config/${encodeURIComponent(partnerId)}?type=partner`);
          const data = await resp.json();
          if (!resp.ok || !data.success || !data.template) {
            throw new Error(data.error || 'Failed to fetch partner report template');
          }

          const template = data.template as any;
          const normalizedReport: Report = {
            _id: template._id,
            name: template.name,
            description: template.description,
            type: template.type === 'event' ? 'event' : 'partner',
            isDefault: !!template.isDefault,
            styleId: template.styleId,
            layout: {
              gridColumns: {
                desktop: template.gridSettings?.desktopUnits ?? 3,
                tablet: template.gridSettings?.tabletUnits ?? 2,
                mobile: template.gridSettings?.mobileUnits ?? 1,
              },
              blocks: (template.dataBlocks || []).map((b: any) => ({
                id: b._id || b.blockId || String(b.order),
                title: b.overrides?.customTitle ?? b.name ?? 'Untitled Block',
                showTitle: b.overrides?.showTitle ?? (b.showTitle ?? true),
                order: Number(b.order ?? 0),
                charts: (b.charts || []).map((c: any) => ({
                  chartId: c.chartId,
                  width: Number(c.width ?? 1),
                  order: Number(c.order ?? 0),
                })),
                blockAspectRatio: b.blockAspectRatio || b.overrides?.blockAspectRatio, // R-LAYOUT-02.1: Optional aspect ratio override
                tableHeightMultiplier: b.tableHeightMultiplier || b.overrides?.tableHeightMultiplier, // Table height control
              })),
            },
            heroSettings: template.heroSettings ?? { showEmoji: true, showDateInfo: true, showExportOptions: true },
            alignmentSettings: template.alignmentSettings ?? { alignTitles: true, alignDescriptions: true, alignCharts: true, minElementHeight: undefined },
            createdBy: template.createdBy || 'system',
            createdAt: template.createdAt || new Date().toISOString(),
            updatedAt: template.updatedAt || new Date().toISOString(),
          } as Report;

          setReport(normalizedReport);
          setResolution({ resolvedFrom: data.resolvedFrom || 'partner', source: data.source || template.name });
        }

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
  desktop: report?.layout?.gridColumns?.desktop || 3,
  tablet: report?.layout?.gridColumns?.tablet || 2,
  mobile: report?.layout?.gridColumns?.mobile || 1
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
