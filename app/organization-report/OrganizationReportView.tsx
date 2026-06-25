'use client';

/**
 * Organization Report View
 * WHAT: Aggregated report for organizations
 * WHY: High-level stakeholders need to see metrics across all their sub-entities
 */
import React, { useMemo } from 'react';
import ReportHero from '@/app/report/[slug]/ReportHero';
import ReportContent from '@/app/report/[slug]/ReportContent';
import OrganizationEntityList from './OrganizationEntityList';
import OrganizationActivitiesList from './OrganizationActivitiesList';
import { useOrganizationReportData } from '@/hooks/useReportData';
import { useReportStyle } from '@/hooks/useReportStyle';
import { useReportExport } from '@/hooks/useReportExport';
import { ReportCalculator } from '@/lib/report-calculator';
import { PublicReportShell, PublicReportState } from '@/components/reports/PublicReportShell';

export default function OrganizationReportView({ id, variant }: { id: string; variant?: string | null }) {
  const { data: orgData, activities, loading: dataLoading, error: dataError } = useOrganizationReportData(id, variant);
  
  const organization = orgData?.organization;
  const entities = orgData?.entities || [];
  const stats = orgData?.aggregatedStats || null;
  const charts = useMemo(() => orgData?.charts || [], [orgData?.charts]);
  const reportConfig = orgData?.report;
  const reportVariant = orgData?.reportVariant;

  // WHAT: Resolve layout from API-provided config
  // WHY: Unified reporting uses DB-driven templates
  const { report, blocks, gridSettings } = useMemo(() => {
    if (reportConfig) {
      return {
        report: reportConfig,
        blocks: (reportConfig.layout?.blocks || []).sort((a: any, b: any) => a.order - b.order),
        gridSettings: {
          desktop: reportConfig.layout?.gridColumns?.desktop || 3,
          tablet: reportConfig.layout?.gridColumns?.tablet || 2,
          mobile: reportConfig.layout?.gridColumns?.mobile || 1,
        }
      };
    }
    return { report: null, blocks: [], gridSettings: { desktop: 3, tablet: 2, mobile: 1 } };
  }, [reportConfig]);

  const { loading: styleLoading } = useReportStyle({
    styleId: report?.styleId ? String(report.styleId) : null,
    enabled: !!report,
  });

  // WHAT: Calculate chart results base on aggregated stats
  // WHY: The organization hierarchy uses the same aggregation logic as partner reports, but at org-level
  const chartResults = useMemo(() => {
    const chartsArray = charts;
    if (!stats || chartsArray.length === 0) return new Map();
    const calculator = new ReportCalculator(chartsArray, stats);
    const results = new Map();
    for (const chart of chartsArray) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) results.set(chart.chartId, result);
    }
    return results;
  }, [charts, stats]);

  const { handleCSVExport, handlePDFExport } = useReportExport({
    entity: organization ? { 
      _id: organization._id,
      name: organization.name,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    } : null,
    stats: stats || null,
    chartResults,
    charts: charts.map((chart: any) => ({ chartId: chart.chartId, order: chart.order })),
    filenamePrefix: `org_${organization?.slug || 'report'}${reportVariant?.slug && reportVariant.slug !== 'default' ? `_${reportVariant.slug}` : ''}`,
    reportType: 'Organization Report',
  });

  const loading = dataLoading || styleLoading;
  const error = dataError;

  if (loading) {
    return (
      <PublicReportState title="Loading organization report..." kind="loading" />
    );
  }

  if (error || !organization || !report) {
    return (
      <PublicReportState
        title="Report Error"
        message={error || 'Organization or report layout not found'}
        kind="error"
      />
    );
  }

  const organizationAsProject = {
    eventName: organization.name,
    eventDate: new Date().toISOString(),
    _id: organization._id,
  };

  return (
    <PublicReportShell>
        <div id="report-hero">
          <ReportHero
            project={organizationAsProject}
            emoji={report?.heroSettings?.showEmoji !== false && organization.metadata?.showEmoji !== false ? organization.metadata?.emoji : undefined}
            partnerLogo={organization.metadata?.logoUrl}
            showDate={false}
            customSubtitle={reportVariant ? `${reportVariant.name} · ${reportVariant.period?.label || 'All Time'}` : undefined}
            showExport={report?.heroSettings?.showExportOptions ?? true}
            onExportCSV={handleCSVExport}
            onExportPDF={handlePDFExport}
          />
        </div>
        
        <div id="report-content">
          <ReportContent blocks={blocks} chartResults={chartResults} gridSettings={gridSettings} />
        </div>
        
        {organization.metadata?.showMembersList !== false && entities.length > 0 && (
          <OrganizationEntityList
            entities={entities}
            organizationName={organization.name}
          />
        )}

        {organization.metadata?.showEventsList !== false && activities.length > 0 && (
          <OrganizationActivitiesList 
            activities={activities} 
            organizationName={organization.name} 
          />
        )}
    </PublicReportShell>
  );
}
