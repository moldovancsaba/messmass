import { ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import type { Report } from '@/lib/report-resolver';

type DataBlockReference = {
  blockId: ObjectId | string;
  order: number;
};

type ReportTemplateRecord = {
  _id: ObjectId;
  name: string;
  description?: string;
  type: 'event' | 'partner' | 'global';
  isDefault: boolean;
  styleId?: ObjectId | string;
  dataBlocks?: DataBlockReference[];
  gridSettings?: {
    desktopUnits?: number;
    tabletUnits?: number;
    mobileUnits?: number;
  };
  heroSettings?: Record<string, unknown>;
  alignmentSettings?: Record<string, unknown>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

type DataBlockRecord = {
  _id: ObjectId;
  name: string;
  showTitle?: boolean;
  charts?: Array<{
    chartId: string;
    width?: number;
    order?: number;
  }>;
};

export interface RuntimeReportResolution {
  report: Report | null;
  resolvedFrom: 'variant' | 'template' | 'legacy-report' | 'default';
  source: string;
}

function normalizeObjectId(value: ObjectId | string | undefined | null): ObjectId | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

async function convertTemplateToRuntimeReport(db: Db, template: ReportTemplateRecord): Promise<Report> {
  const dataBlocksCollection = db.collection<DataBlockRecord>('data_blocks');
  const dataBlockIds = (template.dataBlocks || [])
    .map((reference) => normalizeObjectId(reference.blockId))
    .filter((value): value is ObjectId => Boolean(value));

  const blocks = dataBlockIds.length > 0
    ? await dataBlocksCollection.find({ _id: { $in: dataBlockIds } }).toArray()
    : [];

  const runtimeBlocks = (template.dataBlocks || [])
    .map((reference) => {
      const blockId = normalizeObjectId(reference.blockId);
      const block = blockId
        ? blocks.find((candidate) => candidate._id.toString() === blockId.toString())
        : null;

      if (!block) return null;

      return {
        id: block._id.toString(),
        title: block.name,
        showTitle: block.showTitle !== false,
        order: reference.order,
        charts: (block.charts || []).map((chart, chartIndex) => ({
          chartId: chart.chartId,
          width: typeof chart.width === 'number' ? chart.width : 1,
          order: typeof chart.order === 'number' ? chart.order : chartIndex,
        })),
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
    .sort((a, b) => a.order - b.order);

  return {
    _id: template._id.toString(),
    name: template.name,
    description: template.description,
    type: template.type === 'event' ? 'event' : 'partner',
    isDefault: Boolean(template.isDefault),
    styleId: template.styleId ? String(template.styleId) : undefined,
    layout: {
      gridColumns: {
        desktop: template.gridSettings?.desktopUnits || 3,
        tablet: template.gridSettings?.tabletUnits || 2,
        mobile: template.gridSettings?.mobileUnits || 1,
      },
      blocks: runtimeBlocks,
    },
    heroSettings: {
      showEmoji: template.heroSettings?.showEmoji !== false,
      showDateInfo: template.heroSettings?.showDateInfo !== false,
      showExportOptions: template.heroSettings?.showExportOptions !== false,
    },
    alignmentSettings: {
      alignTitles: template.alignmentSettings?.alignTitles !== false,
      alignDescriptions: template.alignmentSettings?.alignDescriptions !== false,
      alignCharts: template.alignmentSettings?.alignCharts !== false,
      minElementHeight:
        typeof template.alignmentSettings?.minElementHeight === 'number'
          ? template.alignmentSettings.minElementHeight
          : undefined,
    },
    createdBy: template.createdBy || 'system',
    createdAt: template.createdAt || new Date().toISOString(),
    updatedAt: template.updatedAt || new Date().toISOString(),
  };
}

export async function resolveRuntimeReportById(
  db: Db,
  id: string | undefined | null,
  defaultType: 'event' | 'partner' = 'partner'
): Promise<RuntimeReportResolution> {
  const reportsCollection = db.collection('reports');
  const templatesCollection = db.collection<ReportTemplateRecord>('report_templates');
  const normalizedId = normalizeObjectId(id);

  if (normalizedId) {
    const legacyReport = await reportsCollection.findOne({ _id: normalizedId });
    if (legacyReport) {
      return {
        report: {
          ...legacyReport,
          _id: legacyReport._id.toString(),
          styleId: legacyReport.styleId ? String(legacyReport.styleId) : undefined,
        } as Report,
        resolvedFrom: 'legacy-report',
        source: legacyReport.name || legacyReport._id.toString(),
      };
    }

    const template = await templatesCollection.findOne({ _id: normalizedId });
    if (template) {
      return {
        report: await convertTemplateToRuntimeReport(db, template),
        resolvedFrom: 'template',
        source: template.name,
      };
    }
  }

  const defaultLegacyReport = await reportsCollection.findOne({ type: defaultType, isDefault: true });
  if (defaultLegacyReport) {
    return {
      report: {
        ...defaultLegacyReport,
        _id: defaultLegacyReport._id.toString(),
        styleId: defaultLegacyReport.styleId ? String(defaultLegacyReport.styleId) : undefined,
      } as Report,
      resolvedFrom: 'default',
      source: defaultLegacyReport.name || 'system-default',
    };
  }

  const defaultTemplate = await templatesCollection.findOne({ isDefault: true });
  if (defaultTemplate) {
    return {
      report: await convertTemplateToRuntimeReport(db, defaultTemplate),
      resolvedFrom: 'default',
      source: defaultTemplate.name,
    };
  }

  return {
    report: null,
    resolvedFrom: 'default',
    source: 'missing-default',
  };
}
