// lib/elementFitValidator.ts
// WHAT: Element fit validation for Layout Grammar system
// WHY: Determines if element content fits in allocated space and returns required actions
// HOW: Validates each element type (text, table, pie, bar, kpi, image) against container dimensions

import type { CellConfiguration, ElementFitValidation } from './layoutGrammar';

/**
 * Validates if an element fits in the allocated space
 * 
 * @param cellConfig - Cell configuration with element type and metadata
 * @param containerHeight - Available height in pixels
 * @param containerWidth - Available width in pixels
 * @returns Element fit validation result with required actions
 */
export function validateElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const { bodyType } = cellConfig;

  switch (bodyType) {
    case 'text':
      return validateTextElementFit(cellConfig, containerHeight, containerWidth);
    case 'table':
      return validateTableElementFit(cellConfig, containerHeight, containerWidth);
    case 'pie':
      return validatePieElementFit(cellConfig, containerHeight, containerWidth);
    case 'bar':
      return validateBarElementFit(cellConfig, containerHeight, containerWidth);
    case 'kpi':
      return validateKPIElementFit(cellConfig, containerHeight, containerWidth);
    case 'image':
      return validateImageElementFit(cellConfig, containerHeight, containerWidth);
    default:
      // Unknown element type - assume it fits but log warning
      return {
        fits: true,
        violations: [`Unknown element type: ${bodyType}`],
        requiredActions: []
      };
  }
}

/**
 * Validates text element fit
 */
function validateTextElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const contentMetadata = cellConfig.contentMetadata || {};
  // Text elements always fit (they scale to available space)
  // Content metadata may contain character/line counts for future enhancements
  return {
    fits: true,
    violations: [],
    requiredActions: []
  };
}

/**
 * Validates table element fit (max 17 visible rows)
 */
function validateTableElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const contentMetadata = cellConfig.contentMetadata || {};
  const rowCount = (contentMetadata.rowCount as number) || 0;
  const maxVisibleRows = 17;
  
  if (rowCount <= maxVisibleRows) {
    return {
      fits: true,
      violations: [],
      requiredActions: []
    };
  }

  // Table exceeds max visible rows - requires aggregation
  return {
    fits: false,
    violations: [`Table has ${rowCount} rows, exceeds maximum of ${maxVisibleRows} visible rows`],
    requiredActions: ['aggregate']
  };
}

/**
 * Validates pie element fit (legend must fit)
 */
function validatePieElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const contentMetadata = cellConfig.contentMetadata || {};
  const legendItemCount = (contentMetadata.legendItemCount as number) || 0;
  const minPieRadius = 50; // Minimum readable pie radius
  
  // Check if pie itself fits
  const minRequiredHeight = minPieRadius * 2;
  if (containerHeight < minRequiredHeight) {
    return {
      fits: false,
      requiredHeight: minRequiredHeight,
      violations: [`Pie chart requires minimum height of ${minRequiredHeight}px`],
      requiredActions: ['increaseHeight']
    };
  }

  // Legend fit is handled by reflow/aggregation in rendering
  // For validation, assume legend can be reflowed if needed
  return {
    fits: true,
    violations: [],
    requiredActions: []
  };
}

/**
 * Validates bar element fit
 */
function validateBarElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  const contentMetadata = cellConfig.contentMetadata || {};
  const barCount = (contentMetadata.barCount as number) || 0;
  const minBarHeight = 20; // Minimum height per bar
  
  // Estimate required height based on bar count
  const estimatedRequiredHeight = barCount * minBarHeight + 100; // 100px for labels/spacing
  
  if (containerHeight >= estimatedRequiredHeight) {
    return {
      fits: true,
      violations: [],
      requiredActions: []
    };
  }

  // Bars don't fit - requires reflow or density reduction
  return {
    fits: false,
    requiredHeight: estimatedRequiredHeight,
    violations: [`Bar chart requires minimum height of ${estimatedRequiredHeight}px for ${barCount} bars`],
    requiredActions: ['reflow', 'increaseHeight']
  };
}

/**
 * Validates KPI element fit
 */
function validateKPIElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  // KPI elements are compact and always fit
  return {
    fits: true,
    violations: [],
    requiredActions: []
  };
}

/**
 * Validates image element fit
 */
function validateImageElementFit(
  cellConfig: CellConfiguration,
  containerHeight: number,
  containerWidth: number
): ElementFitValidation {
  // Image fit is handled by aspect ratio in height resolution
  // If imageMode is 'setIntrinsic', height is driven by aspect ratio (Priority 1)
  // If imageMode is 'cover', image scales to fill container
  return {
    fits: true,
    violations: [],
    requiredActions: []
  };
}

