'use client';

/**
 * Shared partner report view — used by /partner-report/[slug] and /dashboard/partner/[partnerId] (#47).
 * WHAT: Renders partner aggregated report given a slug or partner id.
 */
import React, { useMemo } from 'react';
import ReportHero from '@/app/report/[slug]/ReportHero';
import ReportContent from '@/app/report/[slug]/ReportContent';
import PartnerEventsList from '@/app/partner-report/[slug]/PartnerEventsList';
import { usePartnerReportData } from '@/hooks/useReportData';
import { useReportStyle } from '@/hooks/useReportStyle';
import { useReportExport } from '@/hooks/useReportExport';
import { ReportCalculator } from '@/lib/report-calculator';
import { PublicReportShell, PublicReportState } from '@/components/reports/PublicReportShell';

export interface PartnerReportViewProps {
  slug: string;
  variant?: string | null;
}

export function PartnerReportView({ slug, variant }: PartnerReportViewProps) {
  console.log('🏗️ [PartnerReportView] Multi-tenant view mounting with slug:', slug);
  const { data: partnerData, loading: dataLoading, error: dataError } = usePartnerReportData(slug, variant);
  
  console.log('📦 [PartnerReportView] Hook dataLoading:', dataLoading);
  console.log('📦 [PartnerReportView] Hook partnerData stats:', partnerData?.aggregatedStats ? 'Yes' : 'No');
  
  const partner = partnerData?.partner;
  const events = partnerData?.events || [];
  const charts = partnerData?.charts || [];
  const stats = partnerData?.aggregatedStats || null;
  const report = partnerData?.report || null;
  const reportVariant = (partnerData as any)?.reportVariant;
  const blocks = useMemo(() => (report?.layout?.blocks || []).sort((a, b) => a.order - b.order), [report]);
  const gridSettings = useMemo(() => ({
    desktop: report?.layout?.gridColumns?.desktop || 3,
    tablet: report?.layout?.gridColumns?.tablet || 2,
    mobile: report?.layout?.gridColumns?.mobile || 1,
  }), [report]);

  const { loading: styleLoading } = useReportStyle({
    styleId: report?.styleId ? String(report.styleId) : null,
    enabled: !!report,
  });

  console.log('📦 [PartnerReportView] styleLoading:', styleLoading);


  const chartResults = useMemo(() => {
    const chartsArray = partnerData?.charts || [];
    if (!stats || !chartsArray || chartsArray.length === 0) return new Map();
    const calculator = new ReportCalculator(chartsArray, stats);
    const results = new Map();
    for (const chart of chartsArray) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) results.set(chart.chartId, result);
    }
    return results;
  }, [stats, partnerData?.charts]);

  const { handleCSVExport, handlePDFExport } = useReportExport({
    entity: partner ? { ...partner, createdAt: (partner as any).createdAt, updatedAt: (partner as any).updatedAt } : null,
    stats: stats || null,
    chartResults,
    charts: partnerData?.charts?.map((chart) => ({ chartId: chart.chartId, order: chart.order })),
    filenamePrefix: reportVariant?.slug && reportVariant.slug !== 'default'
      ? `partner_report_${reportVariant.slug}`
      : 'partner_report',
    reportType: 'Partner Report',
  });

  const loading = dataLoading || styleLoading;
  const error = dataError;

  if (loading) {
    return (
      <PublicReportState title="Loading partner report..." kind="loading" />
    );
  }
  if (error) {
    return (
      <PublicReportState
        title="Failed to Load Partner Report"
        message={error}
        meta={`Partner: ${slug}`}
        kind="error"
      />
    );
  }
  if (!partner || !stats || !report) {
    return (
      <PublicReportState
        title="Partner Report Not Found"
        message="The requested partner report could not be found."
      />
    );
  }

  const { heroSettings } = report;
  const partnerAsProject = {
    eventName: partner.name,
    eventDate: new Date().toISOString(),
    _id: partner._id,
  };
  return (
    <PublicReportShell>
        <div id="report-hero">
          <ReportHero
            project={partnerAsProject}
            emoji={heroSettings?.showEmoji !== false && partner.showEmoji !== false ? partner.emoji : undefined}
            partnerLogo={(partner as any).logoUrl}
            showDate={false}
            customSubtitle={reportVariant ? `${reportVariant.name} · ${reportVariant.period?.label || 'All Time'}` : undefined}
            showExport={heroSettings?.showExportOptions ?? true}
            onExportCSV={handleCSVExport}
            onExportPDF={handlePDFExport}
          />
        </div>
        <div id="report-content">
          <ReportContent blocks={blocks} chartResults={chartResults} gridSettings={gridSettings} />
        </div>
        {events.length > 0 && (
          <PartnerEventsList
            events={events}
            partnerName={partner.name}
            showEventsList={partner.showEventsList}
            showEventsListTitle={partner.showEventsListTitle}
            showEventsListDetails={partner.showEventsListDetails}
          />
        )}
    </PublicReportShell>
  );
}
