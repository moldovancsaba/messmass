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
import styles from '@/app/styles/report-page.module.css';

export default function OrganizationReportView({ id }: { id: string }) {
  const { data: orgData, activities, loading: dataLoading, error: dataError } = useOrganizationReportData(id);
  
  const organization = orgData?.organization;
  const entities = orgData?.entities || [];
  const stats = orgData?.aggregatedStats || null;
  const reportConfig = orgData?.report;

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
    const chartsArray: any[] = []; 
    if (!stats || chartsArray.length === 0) return new Map();
    const calculator = new ReportCalculator(chartsArray, stats);
    const results = new Map();
    for (const chart of chartsArray) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) results.set(chart.chartId, result);
    }
    return results;
  }, [stats]);

  const { handleCSVExport, handlePDFExport } = useReportExport({
    entity: organization ? { 
      _id: organization._id,
      name: organization.name,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    } : null,
    stats: stats || null,
    chartResults,
    charts: [], 
    filenamePrefix: `org_${organization?.slug || 'report'}`,
    reportType: 'Organization Report',
  });

  const loading = dataLoading || styleLoading;
  const error = dataError;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading organization report...</p>
        </div>
      </div>
    );
  }

  if (error || !organization || !report) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <h2 className={styles.errorTitle}>Report Error</h2>
          <p className={styles.errorText}>{error || 'Organization or report layout not found'}</p>
        </div>
      </div>
    );
  }

  const organizationAsProject = {
    eventName: organization.name,
    eventDate: new Date().toISOString(),
    _id: organization._id,
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div id="report-hero">
          <ReportHero
            project={organizationAsProject}
            emoji={organization.metadata?.emoji}
            partnerLogo={organization.metadata?.logoUrl}
            showDate={false}
            showExport={true}
            onExportCSV={handleCSVExport}
            onExportPDF={handlePDFExport}
          />
        </div>
        
        <div id="report-content">
          <ReportContent blocks={blocks} chartResults={chartResults} gridSettings={gridSettings} />
        </div>
        
        {entities.length > 0 && (
          <OrganizationEntityList
            entities={entities}
            organizationName={organization.name}
          />
        )}

        {activities.length > 0 && (
          <OrganizationActivitiesList 
            activities={activities} 
            organizationName={organization.name} 
          />
        )}
      </div>
    </div>
  );
}
