/**
 * Editor Block Validator
 * 
 * Utility functions to validate blocks in the editor context by converting
 * editor data structures to the validation API format.
 * 
 * @module editorBlockValidator
 */

import { validateBlocksForEditor, checkPublishValidity, type EditorBlockInput, type BlockValidationResult } from './editorValidationAPI';

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
      contentMetadata: {}, // TODO: Build from actual chart data
      imageMode: blockConfig?.imageModes?.[chartRef.chartId]
    };
  });

  return {
    blockId: block._id,
    cells,
    blockAspectRatio: blockConfig?.aspectRatio,
    maxAllowedHeight: blockConfig?.maxAllowedHeight
  };
}

/**
 * Builds content metadata for validation from chart data
 */
export function buildContentMetadata(
  chart: EditorChart,
  chartData?: unknown
): Record<string, unknown> {
  // TODO: Extract actual content metadata based on chart type
  // For text: character count, line count
  // For table: row count, column count
  // For pie: slice count, label lengths
  // For bar: bar count, label lengths
  // For image: dimensions, aspect ratio
  
  return {
    type: chart.type
    // Additional metadata will be populated based on chart type
  };
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

