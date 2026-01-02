/**
 * Editor Validation API
 * 
 * Provides editor-facing API for block validation and height resolution.
 * This API is deterministic and testable (no DOM access).
 * 
 * @module editorValidationAPI
 */

import { resolveBlockHeightWithDetails } from './blockHeightCalculator';
import type { BlockHeightResolution, HeightResolutionInput, CellConfiguration } from './layoutGrammar';
import { validateElementFit } from './elementFitValidator';
import type { ElementFitValidation } from './layoutGrammar';
import type { AspectRatio, CellWidth } from './chartConfigTypes';
import type { ChartBodyType } from './blockLayoutTypes';
import { isValidAspectRatio } from './aspectRatioUtils';

// Re-export types from layout grammar for editor use
export type HeightResolutionResult = BlockHeightResolution;
export type { ElementFitValidation } from './layoutGrammar';

export interface BlockValidationResult {
  blockId: string;
  heightResolution: HeightResolutionResult;
  elementValidations: ElementFitValidation[];
  publishBlocked: boolean;
  publishBlockReason?: string;
  requiredActions: Array<'reflow' | 'aggregate' | 'increaseHeight' | 'splitBlock'>;
}

export interface EditorBlockInput {
  blockId: string;
  cells: Array<{
    chartId: string;
    elementType: ChartBodyType; // Canonical type from blockLayoutTypes
    width?: number;
    contentMetadata?: Record<string, unknown>;
    imageMode?: 'cover' | 'setIntrinsic';
  }>;
  blockAspectRatio?: {
    ratio: AspectRatio; // e.g., "16:9"
    isSoftConstraint: boolean;
  };
  maxAllowedHeight?: number;
}

/**
 * Validates a single block for editor use
 * 
 * @param block - Block configuration from editor
 * @param blockWidth - Width of the block in pixels
 * @returns Validation result with height resolution and element fit checks
 */
/**
 * Normalizes editor-facing number to Layout Grammar CellWidth (1 | 2)
 * Clamps to valid range and defaults to 1
 */
function normalizeCellWidth(width: number | undefined): CellWidth {
  if (typeof width === 'number' && Number.isFinite(width)) {
    const rounded = Math.round(width);
    // Clamp to valid CellWidth range (1 or 2)
    const clamped = Math.min(2, Math.max(1, rounded));
    return clamped as CellWidth;
  }
  return 1; // Default to 1-unit cell
}

/**
 * Normalizes editor-facing elementType to canonical ChartBodyType
 * Validates against canonical union and defaults to 'kpi' for invalid values
 */
function normalizeChartBodyType(elementType: unknown): ChartBodyType {
  const validTypes: ChartBodyType[] = ['pie', 'bar', 'kpi', 'text', 'image', 'table'];
  if (typeof elementType === 'string' && validTypes.includes(elementType as ChartBodyType)) {
    return elementType as ChartBodyType;
  }
  // Default to 'kpi' for invalid/missing types
  return 'kpi';
}

export function validateBlockForEditor(
  block: EditorBlockInput,
  blockWidth: number
): BlockValidationResult {
  // Convert editor block input to HeightResolutionInput format
  // Ensure aspectRatio is valid AspectRatio type
  const defaultAspectRatio: AspectRatio = '16:9';
  const blockAspectRatioValue = block.blockAspectRatio?.ratio;
  const validAspectRatio: AspectRatio = blockAspectRatioValue && isValidAspectRatio(blockAspectRatioValue)
    ? blockAspectRatioValue
    : defaultAspectRatio;

  const cells: CellConfiguration[] = block.cells.map(cell => {
    const normalizedBodyType = normalizeChartBodyType(cell.elementType);
    return {
      chartId: cell.chartId,
      bodyType: normalizedBodyType,
      cellWidth: normalizeCellWidth(cell.width),
      aspectRatio: normalizedBodyType === 'image' ? validAspectRatio : undefined,
      imageMode: cell.imageMode,
      contentMetadata: cell.contentMetadata
    };
  });

  const heightResolutionInput: HeightResolutionInput = {
    blockId: block.blockId,
    blockWidth,
    cells,
    blockAspectRatio: block.blockAspectRatio ? {
      ratio: validAspectRatio,
      isSoftConstraint: block.blockAspectRatio.isSoftConstraint
    } : undefined,
    maxAllowedHeight: block.maxAllowedHeight,
    contentMetadata: block.cells.reduce((acc, cell, idx) => {
      if (cell.contentMetadata) {
        acc[idx] = cell.contentMetadata;
      }
      return acc;
    }, {} as Record<number, Record<string, unknown>>)
  };

  // Call actual height resolution engine
  const heightResolution = resolveBlockHeightWithDetails(heightResolutionInput);

  // Validate element fit for each cell
  const elementValidations: ElementFitValidation[] = block.cells.map((cell, index) => {
    const normalizedBodyType = normalizeChartBodyType(cell.elementType);
    const cellConfig: CellConfiguration = {
      chartId: cell.chartId,
      bodyType: normalizedBodyType,
      cellWidth: normalizeCellWidth(cell.width),
      aspectRatio: normalizedBodyType === 'image' ? validAspectRatio : undefined,
      imageMode: cell.imageMode,
      contentMetadata: cell.contentMetadata
    };

    return validateElementFit(cellConfig, heightResolution.heightPx, blockWidth);
  });

  // Determine required actions and publish blocking
  const requiredActions: Array<'reflow' | 'aggregate' | 'increaseHeight' | 'splitBlock'> = [];
  let publishBlocked = false;
  let publishBlockReason: string | undefined;

  // Check if any element doesn't fit
  for (const validation of elementValidations) {
    requiredActions.push(...validation.requiredActions);
    
    // If structural failure (Priority 4) or invalid aggregation, block publish
    if (heightResolution.priority === 4) {
      publishBlocked = true;
      publishBlockReason = heightResolution.reason || 'Structural failure';
    } else if (validation.requiredActions.includes('splitBlock')) {
      publishBlocked = true;
      publishBlockReason = 'Element requires block split';
    }
  }

  // Remove duplicates from requiredActions
  const uniqueActions = Array.from(new Set(requiredActions));

  return {
    blockId: block.blockId,
    heightResolution,
    elementValidations,
    publishBlocked,
    publishBlockReason,
    requiredActions: uniqueActions
  };
}

/**
 * Validates multiple blocks for editor use
 * 
 * @param blocks - Array of block configurations from editor
 * @param blockWidth - Width of blocks in pixels
 * @returns Array of validation results
 */
export function validateBlocksForEditor(
  blocks: EditorBlockInput[],
  blockWidth: number
): BlockValidationResult[] {
  return blocks.map(block => validateBlockForEditor(block, blockWidth));
}

/**
 * Checks if blocks can be published (no structural failures)
 * 
 * @param validationResults - Results from validateBlocksForEditor
 * @returns Object indicating publish validity and any blocking reasons
 */
export function checkPublishValidity(
  validationResults: BlockValidationResult[]
): {
  canPublish: boolean;
  blockedBlocks: Array<{
    blockId: string;
    reason: string;
  }>;
} {
  const blockedBlocks = validationResults
    .filter(result => result.publishBlocked)
    .map(result => ({
      blockId: result.blockId,
      reason: result.publishBlockReason || 'Structural failure'
    }));
  
  return {
    canPublish: blockedBlocks.length === 0,
    blockedBlocks
  };
}

