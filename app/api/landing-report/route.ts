/**
 * GET /api/landing-report
 *
 * WHAT: Return report data for the landing event (messmass.com) so the main page
 *       can render content from the report system (event stats + style + chart results).
 * WHY: Single source of truth — edit event stats in admin and landing reflects it.
 */

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { calculateChartSafe } from '@/lib/chartCalculator';
import { ensureDerivedMetrics } from '@/lib/dataValidator';
import type { ChartConfiguration } from '@/lib/chartConfigTypes';

const LANDING_EVENT_NAME = 'messmass.com';

export async function GET() {
  try {
    const db = await getDb();
    const projects = db.collection('projects');
    const templates = db.collection('report_templates');
    const dataBlocks = db.collection('data_blocks');
    const chartConfigs = db.collection('chart_configurations');
    const reportStyles = db.collection('report_styles');

    const project = await projects.findOne({ eventName: LANDING_EVENT_NAME });
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Landing event not found. Run scripts/seed-messmass-landing.ts first.' },
        { status: 404 }
      );
    }

    const templateId = project.reportTemplateId
      ? typeof project.reportTemplateId === 'string' && ObjectId.isValid(project.reportTemplateId)
        ? new ObjectId(project.reportTemplateId)
        : project.reportTemplateId
      : null;
    let template = templateId ? await templates.findOne({ _id: templateId }) : null;
    if (!template && project.partner1Id) {
      const partner = await db.collection('partners').findOne({ _id: project.partner1Id });
      const partnerTemplateId = partner?.reportTemplateId;
      if (partnerTemplateId) {
        const tid = typeof partnerTemplateId === 'string' ? new ObjectId(partnerTemplateId) : partnerTemplateId;
        template = await templates.findOne({ _id: tid });
      }
    }
    if (!template?.dataBlocks?.length) {
      return NextResponse.json({
        success: true,
        project: serializeProject(project),
        template: null,
        style: null,
        chartResults: [],
      });
    }

    const blockIds = template.dataBlocks.map((ref: { blockId: unknown }) =>
      typeof ref.blockId === 'string' && ObjectId.isValid(ref.blockId) ? new ObjectId(ref.blockId) : ref.blockId
    );
    const blocks = await dataBlocks.find({ _id: { $in: blockIds } }).toArray();
    const blockMap = new Map(blocks.map((b: any) => [b._id.toString(), b]));
    const chartIds = template.dataBlocks.flatMap((ref: any) => {
      const block = blockMap.get(ref.blockId?.toString?.() ?? ref.blockId);
      return (block?.charts || []).map((c: any) => c.chartId);
    });

    const configs = await chartConfigs.find({ chartId: { $in: chartIds } }).toArray();
    const configById = new Map((configs as any[]).map((c) => [c.chartId, c]));
    const orderedConfigs = chartIds.map((id) => configById.get(id)).filter(Boolean) as ChartConfiguration[];

    const stats = ensureDerivedMetrics(project.stats || {}) as Record<string, number | string | undefined>;
    const chartResults = orderedConfigs.map((config) => {
      const result = calculateChartSafe(config, stats);
      return {
        chartId: result.chartId,
        type: result.type,
        title: result.title,
        icon: result.icon,
        iconVariant: result.iconVariant,
        kpiValue: result.kpiValue,
        elements: result.elements,
        showTitle: result.showTitle,
      };
    });

    const styleId = project.styleIdEnhanced || template.styleId;
    let style = null;
    if (styleId) {
      const sid = typeof styleId === 'string' && ObjectId.isValid(styleId) ? new ObjectId(styleId) : styleId;
      style = await reportStyles.findOne({ _id: sid });
    }

    return NextResponse.json({
      success: true,
      project: serializeProject(project),
      template: {
        name: template.name,
        dataBlocks: template.dataBlocks.map((ref: any) => {
          const block = blockMap.get(ref.blockId?.toString?.() ?? ref.blockId);
          return {
            _id: block?._id?.toString(),
            name: block?.name,
            order: ref.order,
            charts: (block?.charts || []).map((c: any) => ({ chartId: c.chartId, width: c.width ?? 1, order: c.order ?? 0 })),
          };
        }),
        gridSettings: template.gridSettings,
      },
      style: style ? { _id: (style as any)._id?.toString(), name: (style as any).name } : null,
      chartResults,
    });
  } catch (err) {
    console.error('[landing-report]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to load landing report' },
      { status: 500 }
    );
  }
}

function serializeProject(project: any) {
  return {
    _id: project._id?.toString(),
    eventName: project.eventName,
    eventDate: project.eventDate,
    viewSlug: project.viewSlug,
    stats: project.stats,
    partner1Id: project.partner1Id?.toString(),
  };
}
