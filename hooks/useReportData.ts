// WHAT: useReportData Hook - Fetch Report Data (v12.0.0)
// WHY: Centralize data fetching logic for report pages
// HOW: Custom React hook with loading, error, and caching states

import { useState, useEffect, useCallback } from 'react';
import type { Report } from '@/lib/report-resolver';
import type { Chart } from '@/lib/report-calculator';

/**
 * WHAT: Project data with stats
 * WHY: Type-safe project interface
 */
export interface ProjectData {
  _id: string;
  eventName: string;
  eventDate: string;
  stats: Record<string, number | string | undefined>;
  hashtags?: string[];
  categorizedHashtags?: Record<string, string[]>;
  partner1?: {
    _id: string;
    name: string;
    emoji: string;
    logoUrl?: string;
  } | null;
  partner2?: {
    _id: string;
    name: string;
    emoji: string;
    logoUrl?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * WHAT: Report data bundle
 * WHY: Group all data needed for report rendering
 */
export interface ReportData {
  project: ProjectData;
  report: Report;
  charts: Chart[];
  resolvedFrom: 'project' | 'partner' | 'default';
  source: string;
}

/**
 * WHAT: Hook return type
 * WHY: Type-safe return value
 */
export interface UseReportDataResult {
  data: ReportData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * WHAT: Fetch report data for project slug
 * WHY: Clean separation - data fetching in hook, rendering in component
 * HOW: Fetch project, resolve report, load charts
 * 
 * @param slug - Project view slug or ID
 * @returns Report data with loading/error states
 * 
 * @example
 * ```typescript
 * const { data, loading, error, refresh } = useReportData('my-event');
 * 
 * if (loading) return <Loading />;
 * if (error) return <Error message={error} />;
 * if (!data) return null;
 * 
 * return <Report data={data} />;
 * ```
 */
export function useReportData(slug: string | null): UseReportDataResult {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * WHAT: Fetch all report data
   * WHY: Load project, report config, and charts in parallel
   * HOW: Three API calls with error handling
   */
  const fetchData = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useReportData] Fetching report data for:', slug);

      // Step 1: Fetch project data
      const projectRes = await fetch(`/api/projects/stats/${slug}`, {
        cache: 'no-store'
      });
      const projectData = await projectRes.json();

      if (!projectData.success) {
        throw new Error(projectData.error || 'Failed to load project');
      }

      const project: ProjectData = projectData.project;

      // Step 2: Resolve report configuration
      const reportRes = await fetch(`/api/reports/resolve?projectId=${project._id}`, {
        cache: 'no-store'
      });
      const reportData = await reportRes.json();

      if (!reportData.success) {
        throw new Error(reportData.error || 'Failed to load report configuration');
      }

      // Step 3: Load all charts
      const chartsRes = await fetch('/api/charts', {
        cache: 'no-store'
      });
      const chartsData = await chartsRes.json();

      if (!chartsData.success) {
        throw new Error(chartsData.error || 'Failed to load charts');
      }

      // Bundle all data together
      setData({
        project,
        report: reportData.report,
        charts: chartsData.charts,
        resolvedFrom: reportData.resolvedFrom,
        source: reportData.source
      });

      console.log('[useReportData] Data loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report data';
      console.error('[useReportData] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Fetch data on mount and when slug changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

/**
 * WHAT: Partner report data structure
 * WHY: Type-safe interface for partner report hook
 */
export interface PartnerReportData {
  partner: {
    _id: string;
    name: string;
    emoji?: string;
    showEventsList?: boolean; // WHAT: Controls visibility of events list on partner report page
    showEventsListTitle?: boolean; // WHAT: Controls visibility of events list title on partner report page
    showEventsListDetails?: boolean; // WHAT: Controls whether event cards show detailed info or just titles
    stats?: Record<string, number | string>;
  };
  events: Array<{
    _id: string;
    eventName: string;
    eventDate: string;
    viewSlug?: string;
    hashtags?: string[];
    categorizedHashtags?: Record<string, string[]>;
    stats?: Record<string, number | string>;
    createdAt: string;
    updatedAt: string;
  }>;
  // WHAT: Pre-aggregated stats computed on server (Phase 2 - v12.4.0)
  // WHY: Eliminates client-side aggregation for better performance
  aggregatedStats: Record<string, number | string>;
  report: Report;
  charts: Chart[];
  resolvedFrom: string;
  source: string;
}

/**
 * WHAT: Fetch report data for partner slug
 * WHY: Partner reports need aggregated data across events
 * HOW: Fetch partner, events, resolve report, load charts
 * 
 * @param slug - Partner view slug or ID
 * @returns Partner report data with loading/error states
 */
export function usePartnerReportData(slug: string | null) {
  const [data, setData] = useState<PartnerReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[usePartnerReportData] Fetching partner report data for:', slug);

      // Step 1: Fetch partner and events
      const partnerRes = await fetch(`/api/partners/report/${slug}`, {
        cache: 'no-store'
      });
      const partnerData = await partnerRes.json();

      if (!partnerData.success) {
        throw new Error(partnerData.error || 'Failed to load partner');
      }

      // Step 2: Resolve report configuration for partner
      const reportRes = await fetch(`/api/reports/resolve?partnerId=${partnerData.partner._id}`, {
        cache: 'no-store'
      });
      const reportData = await reportRes.json();

      if (!reportData.success) {
        throw new Error(reportData.error || 'Failed to load report configuration');
      }

      // Step 3: Load all charts from chart_configurations collection
      const chartsRes = await fetch('/api/chart-config/public', {
        cache: 'no-store'
      });
      const chartsData = await chartsRes.json();

      if (!chartsData.success) {
        throw new Error(chartsData.error || 'Failed to load charts');
      }

      // Bundle data (Phase 2 - v12.4.0)
      // WHAT: Extract pre-aggregated stats from API response
      // WHY: Server now computes aggregation, eliminating client-side work
      setData({
        partner: partnerData.partner,
        events: partnerData.events || [],
        aggregatedStats: partnerData.aggregatedStats || {},
        report: reportData.report,
        charts: chartsData.configurations || chartsData.charts || [], // WHAT: chart-config/public returns 'configurations', fallback to 'charts' for backward compatibility
        resolvedFrom: reportData.resolvedFrom,
        source: reportData.source
      });

      console.log('[usePartnerReportData] Data loaded successfully');
      console.log('[usePartnerReportData] Aggregated stats keys:', Object.keys(partnerData.aggregatedStats || {}));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load partner report data';
      console.error('[usePartnerReportData] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}
