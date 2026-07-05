/**
 * Editor Block Validator
 * 
 * Utility functions to validate blocks in the editor context by converting
 * editor data structures to the validation API format.
 * 
 * @module editorBlockValidator
 */

import { validateBlocksForEditor, checkPublishValidity, type EditorBlockInput, type BlockValidationResult } from './editorValidationAPI';
import type { AspectRatio, ChartCalculationResult } from './chartConfigTypes';
import { isValidAspectRatio } from './aspectRatioUtils';

// Types for editor data structures (these should match actual editor types)
export interface EditorBlock {
  _id: string;
  charts: Array<{
    chartId: string;
    width?: number;
    order: number;
  }>;
  title?: string;
  showTitle?: boolean;
  order?: number;
}

export interface EditorChart {
  _id: string;
  chartId: string;
  type: 'text' | 'table' | 'pie' | 'bar' | 'kpi' | 'image';
  // Additional chart properties as needed
}

export interface BlockConfiguration {
  blockId: string;
  aspectRatio?: {
    ratio: string;
    isSoftConstraint: boolean;
  };
  maxAllowedHeight?: number;
  imageModes?: Record<string, 'cover' | 'setIntrinsic'>; // chartId -> imageMode
}

/**
 * Converts editor block data to validation API format
 * 
 * Normalizes editor-facing types (string) to Layout Grammar types (AspectRatio)
 * at the adapter boundary.
 */
function convertBlockToCellConfiguration(
  block: EditorBlock,
  charts: Map<string, EditorChart>,
  blockConfig?: BlockConfiguration
): EditorBlockInput {
  const cells = block.charts.map(chartRef => {
    const chart = charts.get(chartRef.chartId);
    return {
      chartId: chartRef.chartId,
      elementType: (chart?.type || 'kpi') as 'text' | 'table' | 'pie' | 'bar' | 'kpi' | 'image',
      width: chartRef.width,
      // WHAT: Size-driving metadata (barCount/rowCount/legendItemCount/labels) comes from
      //       buildContentMetadata(chart, chartData). chartData (ChartCalculationResult) is not
      //       threaded into this adapter yet; wiring it changes publish-gating behavior and needs
      //       runtime verification against the editor. Tracked in #284; empty until then (safe:
      //       the fit validators treat missing counts as zero, i.e. current behavior).
      contentMetadata: chart ? buildContentMetadata(chart) : {},
      imageMode: blockConfig?.imageModes?.[chartRef.chartId]
    };
  });

  // Normalize aspectRatio from editor-facing string to Layout Grammar AspectRatio
  const defaultAspectRatio: AspectRatio = '16:9';
  const editorAspectRatio = blockConfig?.aspectRatio?.ratio;
  const normalizedAspectRatio: AspectRatio = editorAspectRatio && isValidAspectRatio(editorAspectRatio)
    ? editorAspectRatio
    : defaultAspectRatio;

  return {
    blockId: block._id,
    cells,
    blockAspectRatio: blockConfig?.aspectRatio ? {
      ratio: normalizedAspectRatio,
      isSoftConstraint: blockConfig.aspectRatio.isSoftConstraint
    } : undefined,
    maxAllowedHeight: blockConfig?.maxAllowedHeight
  };
}

/**
 * Builds content metadata consumed by the Layout Grammar fit validators
 * (`elementFitValidator` / `blockHeightCalculator`). Those readers key off:
 *   bar   -> barCount, labels
 *   pie   -> legendItemCount, legendLabels
 *   table -> rowCount, labels
 *   text  -> characterCount, lineCount
 *   image -> aspectRatio
 * Extraction is deterministic from the chart's calculation result; when no
 * chartData is available only the chart type is returned.
 */
export function buildContentMetadata(
  chart: EditorChart,
  chartData?: Pick<ChartCalculationResult, 'elements' | 'kpiValue' | 'aspectRatio'>
): Record<string, unknown> {
  const metadata: Record<string, unknown> = { type: chart.type };

  if (!chartData) {
    return metadata;
  }

  const elements = Array.isArray(chartData.elements) ? chartData.elements : [];
  const labels = elements.map(el => String(el.label ?? ''));

  switch (chart.type) {
    case 'bar':
      metadata.barCount = elements.length;
      metadata.labels = labels;
      break;
    case 'pie':
      metadata.legendItemCount = elements.length;
      metadata.legendLabels = labels;
      break;
    case 'table':
      metadata.rowCount = elements.length;
      metadata.labels = labels;
      break;
    case 'text': {
      const text = typeof chartData.kpiValue === 'string'
        ? chartData.kpiValue
        : elements.map(el => (typeof el.value === 'string' ? el.value : '')).join('\n');
      metadata.characterCount = text.length;
      metadata.lineCount = text.length === 0 ? 0 : text.split('\n').length;
      break;
    }
    case 'image':
      if (chartData.aspectRatio) {
        metadata.aspectRatio = chartData.aspectRatio;
      }
      break;
    // 'kpi' (and any other type): type only — no size-driving content metadata
  }

  return metadata;
}

/**
 * Validates editor blocks using the validation API
 * 
 * @param blocks - Array of editor blocks
 * @param charts - Map of chartId -> chart data
 * @param blockWidth - Width of blocks in pixels
 * @param blockConfigurations - Optional block-level configurations
 * @returns Validation results for all blocks
 */
export function validateEditorBlocks(
  blocks: EditorBlock[],
  charts: Map<string, EditorChart>,
  blockWidth: number,
  blockConfigurations?: BlockConfiguration[]
): BlockValidationResult[] {
  const configMap = new Map<string, BlockConfiguration>();
  if (blockConfigurations) {
    blockConfigurations.forEach(config => {
      configMap.set(config.blockId, config);
    });
  }

  const editorBlocks: EditorBlockInput[] = blocks.map(block => {
    const config = configMap.get(block._id);
    return convertBlockToCellConfiguration(block, charts, config);
  });

  return validateBlocksForEditor(editorBlocks, blockWidth);
}

/**
 * Checks if editor blocks can be published
 * 
 * @param validationResults - Results from validateEditorBlocks
 * @returns Publish validity check result
 */
export function checkEditorPublishValidity(
  validationResults: BlockValidationResult[]
): {
  canPublish: boolean;
  publishBlocked: boolean;
  blockedBlocks: Array<{
    blockId: string;
    reason: string;
  }>;
} {
  const publishCheck = checkPublishValidity(validationResults);
  
  return {
    canPublish: publishCheck.canPublish,
    publishBlocked: !publishCheck.canPublish,
    blockedBlocks: publishCheck.blockedBlocks
  };
}

