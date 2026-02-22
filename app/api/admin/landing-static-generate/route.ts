/**
 * POST /api/admin/landing-static-generate
 * WHAT: Generate static snapshot from current landing report and save to settings
 * WHY: messmass.com can serve static content without hitting DB on each visit
 */

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { hasMinimumRole } from '@/lib/permissions';
import { getDb } from '@/lib/db';
import { getLandingSettings, setLandingStaticSnapshot } from '@/lib/landingSettings';
import { findProjectByViewSlug } from '@/lib/slugUtils';
import { ensureDerivedMetrics } from '@/lib/dataValidator';
import { ReportCalculator } from '@/lib/report-calculator';
import type { Chart } from '@/lib/report-calculator';
import type { StaticLandingSnapshot } from '@/lib/landingSettings';
import type { ChartResult } from '@/lib/report-calculator';

/** Serialize ChartResult to a plain object that survives JSON/MongoDB round-trip */
function serializeChartResult(r: ChartResult | null): Record<string, unknown> {
  if (!r) return {};
  const out: Record<string, unknown> = {
    chartId: r.chartId,
    type: r.type,
    title: r.title,
    kpiValue: r.kpiValue,
  };
  if (r.icon !== undefined) out.icon = r.icon;
  if (r.iconVariant !== undefined) out.iconVariant = r.iconVariant;
  if (r.elements !== undefined) out.elements = JSON.parse(JSON.stringify(r.elements));
  if (r.formatting !== undefined) out.formatting = r.formatting;
  if (r.aspectRatio !== undefined) out.aspectRatio = r.aspectRatio;
  if (r.showTitle !== undefined) out.showTitle = r.showTitle;
  if (r.showPercentages !== undefined) out.showPercentages = r.showPercentages;
  if (r.error !== undefined) out.error = r.error;
  if (r.chartError !== undefined) out.chartError = r.chartError;
  return out;
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3001';
}

export async function POST() {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    if (!hasMinimumRole(user.role, 'admin')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const settings = await getLandingSettings();
    const slug = settings?.landingReportSlug ?? (await import('@/lib/landingSettings')).DEFAULT_LANDING_SLUG;

    const project = await findProjectByViewSlug(slug);
    if (!project) {
      return NextResponse.json(
        { success: false, error: `Project not found for viewSlug: ${slug}` },
        { status: 404 }
      );
    }

    // Use the same report-config API as the report page so template + blocks match exactly
    const baseUrl = getBaseUrl();
    const configRes = await fetch(
      `${baseUrl}/api/report-config/${encodeURIComponent(slug)}?type=project`,
      { cache: 'no-store' }
    );
    const configData = await configRes.json();
    if (!configData.success || !configData.template?.dataBlocks?.length) {
      return NextResponse.json(
        {
          success: false,
          error: configData.error || 'No report template or blocks found. Resolve report first at /report/' + slug,
        },
        { status: 400 }
      );
    }
    const template = configData.template as any;
    const populatedDataBlocks = template.dataBlocks;

    const db = await getDb();
    const chartConfigsCol = db.collection('chart_configurations');
    const allChartIds = populatedDataBlocks.flatMap((b: any) => (b.charts || []).map((c: any) => c.chartId));
    const configs = await chartConfigsCol.find({ chartId: { $in: allChartIds } }).toArray();
    const chartsForCalc: Chart[] = (configs as any[]).map((c) => ({
      chartId: c.chartId,
      title: c.title ?? '',
      type: c.type ?? 'kpi',
      formula: c.elements?.[0]?.formula ?? c.formula ?? '',
      icon: c.icon,
      iconVariant: c.iconVariant,
      isActive: c.isActive !== false,
      order: c.order ?? 0,
      elements: c.elements,
      formatting: c.formatting,
      aspectRatio: c.aspectRatio,
      showTitle: c.showTitle,
      showPercentages: c.showPercentages,
    }));

    const stats = ensureDerivedMetrics(project.stats || {}) as Record<string, number | string | undefined>;
    const calculator = new ReportCalculator(chartsForCalc, stats);
    const chartResultsMap = new Map<string, any>();
    for (const chart of chartsForCalc) {
      const result = calculator.calculateChart(chart.chartId);
      if (result) chartResultsMap.set(chart.chartId, result);
    }

    const blocksForSnapshot: StaticLandingSnapshot['blocks'] = populatedDataBlocks.map((b: any) => ({
      id: b._id,
      title: b.name ?? 'Untitled Block',
      showTitle: b.showTitle !== false,
      order: Number(b.order ?? 0),
      charts: (b.charts || []).map((c: any) => ({
        chartId: c.chartId,
        width: Number(c.width ?? 1),
        order: Number(c.order ?? 0),
      })),
      blockAspectRatio: b.blockAspectRatio,
      tableHeightMultiplier: b.tableHeightMultiplier,
    }));

    // Serialize chart results to plain JSON-safe objects so they survive MongoDB + API round-trip
    const chartResultsArray = Array.from(chartResultsMap.entries()).map(([chartId, result]) => ({
      chartId,
      result: serializeChartResult(result),
    }));

    const gridSettings = {
      desktop: template.gridSettings?.desktopUnits ?? 3,
      tablet: template.gridSettings?.tabletUnits ?? 2,
      mobile: template.gridSettings?.mobileUnits ?? 1,
    };

    await setLandingStaticSnapshot({
      blocks: blocksForSnapshot,
      chartResults: chartResultsArray,
      gridSettings,
      projectStats: project.stats as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      blocksCount: blocksForSnapshot.length,
    });
  } catch (err) {
    console.error('[landing-static-generate]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to generate static content' },
      { status: 500 }
    );
  }
}
