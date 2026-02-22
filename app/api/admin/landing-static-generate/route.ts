/**
 * POST /api/admin/landing-static-generate
 * WHAT: Generate static snapshot from current landing report and save to settings
 * WHY: messmass.com can serve static content without hitting DB on each visit
 */

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
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

    // Prefer report-config API so template + blocks match the report page; fallback to inline resolution if fetch returns HTML or fails
    let template: any = null;
    let populatedDataBlocks: any[] = [];
    const baseUrl = getBaseUrl();
    try {
      const configRes = await fetch(
        `${baseUrl}/api/report-config/${encodeURIComponent(slug)}?type=project`,
        { cache: 'no-store' }
      );
      const contentType = configRes.headers.get('content-type') || '';
      if (configRes.ok && contentType.includes('application/json')) {
        const configData = await configRes.json();
        if (configData.success && configData.template?.dataBlocks?.length) {
          template = configData.template;
          populatedDataBlocks = template.dataBlocks;
        }
      } else {
        const text = await configRes.text();
        if (text.trimStart().startsWith('<')) {
          console.warn('[landing-static-generate] report-config returned HTML (wrong URL or error page), using inline resolution');
        }
      }
    } catch (e) {
      console.warn('[landing-static-generate] report-config fetch failed, using inline resolution:', e);
    }

    if (!template?.dataBlocks?.length) {
      // Inline resolution when report-config fetch returned HTML or failed
      const db = await getDb();
      const templatesCol = db.collection('report_templates');
      const dataBlocksCol = db.collection('data_blocks');
      const projectDoc = project as any;
      if (projectDoc.reportTemplateId) {
        const tid = ObjectId.isValid(projectDoc.reportTemplateId)
          ? new ObjectId(projectDoc.reportTemplateId)
          : projectDoc.reportTemplateId;
        template = await templatesCol.findOne({ _id: tid });
      }
      if (!template?.dataBlocks?.length && projectDoc.partner1?._id) {
        const partnerId = typeof projectDoc.partner1._id === 'string' ? new ObjectId(projectDoc.partner1._id) : projectDoc.partner1._id;
        const partner = await db.collection('partners').findOne({ _id: partnerId });
        if (partner?.reportTemplateId) {
          const tid = ObjectId.isValid(partner.reportTemplateId) ? new ObjectId(partner.reportTemplateId) : partner.reportTemplateId;
          template = await templatesCol.findOne({ _id: tid });
        }
      }
      if (!template?.dataBlocks?.length) {
        return NextResponse.json(
          { success: false, error: 'No report template or blocks found for this project' },
          { status: 400 }
        );
      }
      const blockIds = template.dataBlocks.map((ref: any) =>
        typeof ref.blockId === 'string' && ObjectId.isValid(ref.blockId) ? new ObjectId(ref.blockId) : ref.blockId
      );
      const blocks = await dataBlocksCol.find({ _id: { $in: blockIds } }).toArray();
      const blockMap = new Map(blocks.map((b: any) => [b._id.toString(), b]));
      populatedDataBlocks = template.dataBlocks
        .map((ref: any) => {
          const blockId = typeof ref.blockId?.toString === 'function' ? ref.blockId.toString() : String(ref.blockId ?? '');
          const block = blockMap.get(blockId);
          if (!block) return null;
          return {
            _id: block._id.toString(),
            name: block.name,
            showTitle: block.showTitle ?? true,
            order: ref.order ?? 0,
            charts: block.charts || [],
            blockAspectRatio: block.blockAspectRatio ?? ref.overrides?.blockAspectRatio,
            tableHeightMultiplier: block.tableHeightMultiplier ?? ref.overrides?.tableHeightMultiplier,
          };
        })
        .filter(Boolean);
    } else {
      populatedDataBlocks = template.dataBlocks;
    }

    if (!populatedDataBlocks.length) {
      return NextResponse.json(
        { success: false, error: 'No report template or blocks found for this project' },
        { status: 400 }
      );
    }

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

    // Read-back: verify snapshot was persisted (same DB/env)
    const readBack = await getLandingSettings();
    const snap = readBack?.staticSnapshot;
    const readBackBlocks = snap?.blocks?.length ?? 0;
    const verified = readBackBlocks === blocksForSnapshot.length && Array.isArray(snap?.chartResults);

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      blocksCount: blocksForSnapshot.length,
      verified,
      readBackBlocks,
    });
  } catch (err) {
    console.error('[landing-static-generate]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to generate static content' },
      { status: 500 }
    );
  }
}
