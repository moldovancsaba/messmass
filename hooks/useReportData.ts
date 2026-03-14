// WHAT: useReportData Hook - Fetch Report Data (v12.0.0)
// WHY: Centralize data fetching logic for report pages
// HOW: Custom React hook with loading, error, and caching states

import { useState, useEffect, useCallback } from 'react';
import type { Report } from '@/lib/report-resolver';
import type { Chart } from '@/lib/report-calculator';
import { mapActivityToV2Project, mapEntityToV2Partner } from '@/lib/v3/compatAdapter';

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

      // Step 1: Fetch project data
      const projectRes = await fetch(`/api/projects/stats/${slug}`, {
        cache: 'no-store'
      });
      const projectData = await projectRes.json();

      if (!projectData.success) {
        // WHAT: Fallback to V3 Activity if V2 Project not found
        // WHY: Support V3-native activities on the same report page
        const activityRes = await fetch(`/api/v3/activities/${slug}`, { cache: 'no-store' });
        const activityData = await activityRes.json();

        if (activityData._id) {
          // Fetch parent entity for branding
          const entityRes = await fetch(`/api/v3/entities/${activityData.ownerEntityId}`, { cache: 'no-store' });
          const entityData = await entityRes.json();
          
          const project = mapActivityToV2Project(activityData, entityData);
          if (!project) throw new Error('Failed to map V3 activity to report');

          // Resolve V3 Report
          const reportRes = await fetch(`/api/v3/reports/resolve?activityId=${activityData._id}`, { cache: 'no-store' });
          const reportData = await reportRes.json();

          if (!reportData.success) throw new Error('Failed to resolve V3 report');

          const chartsRes = await fetch('/api/chart-config/public', { cache: 'no-store' });
          const chartsData = await chartsRes.json();

          setData({
            project: project as any,
            report: reportData.report,
            charts: chartsData.configurations || [],
            resolvedFrom: reportData.resolvedFrom,
            source: reportData.source
          });
          return;
        }

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
      const chartsRes = await fetch('/api/chart-config/public', {
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
        charts: chartsData.configurations || chartsData.charts || [],
        resolvedFrom: reportData.resolvedFrom,
        source: reportData.source
      });

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
    showEmoji?: boolean;
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
      // Step 1: Fetch partner and events
      const partnerRes = await fetch(`/api/partners/report/${slug}`, {
        cache: 'no-store'
      });

      const partnerData = await partnerRes.json();

      if (!partnerData.success) {
        // WHAT: Fallback to V3 Entity if V2 Partner not found
        // WHY: Support V3-native entities on the partner report page
        const v3EntityRes = await fetch(`/api/v3/entities/${slug}`, { cache: 'no-store' });
        const v3EntityData = await v3EntityRes.json();

        if (v3EntityData._id) {
          const partner = mapEntityToV2Partner(v3EntityData);
          if (!partner) throw new Error('Failed to map V3 entity to partner');

          // Resolve V3 Report for Entity
          const reportRes = await fetch(`/api/v3/reports/resolve?entityId=${v3EntityData._id}`, { cache: 'no-store' });
          const reportData = await reportRes.json();

          if (!reportData.success) throw new Error('Failed to resolve V3 report');

          const chartsRes = await fetch('/api/chart-config/public', { cache: 'no-store' });
          const chartsData = await chartsRes.json();

          setData({
            partner: partner as any,
            events: [], // New V3 entities might not have V2 events
            aggregatedStats: partner.stats || {},
            report: reportData.report,
            charts: chartsData.configurations || [],
            resolvedFrom: reportData.resolvedFrom,
            source: reportData.source
          });
          return;
        }

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

/**
 * WHAT: Fetch report data for V3 organization
 * WHY: High-level reports aggregating data across all organization entities
 * HOW: Fetch from /api/v3/organizations/report/[id]
 */
export function useOrganizationReportData(id: string | null) {
  const [data, setData] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [reportRes, activitiesRes] = await Promise.all([
        fetch(`/api/v3/organizations/report/${id}`, { cache: 'no-store' }),
        fetch(`/api/v3/organizations/report/${id}/activities`, { cache: 'no-store' })
      ]);

      const [reportResult, activitiesResult] = await Promise.all([
        reportRes.json(),
        activitiesRes.json()
      ]);

      if (!reportResult.success) {
        throw new Error(reportResult.error || 'Failed to load organization report');
      }

      setData(reportResult);
      if (activitiesResult.success) {
        setActivities(activitiesResult.activities);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organization report data';
      console.error('[useOrganizationReportData] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activities,
    data,
    loading,
    error,
    refresh: fetchData
  };
}
