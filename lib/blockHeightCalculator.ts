// lib/blockHeightCalculator.ts
// WHAT: Deterministic block height solver per spec v2.0
// WHY: All cells in a block share the same height H while respecting image aspect ratios

import type { BlockLayoutInput, BlockLayoutResult, CellConfiguration as BaseCellConfiguration } from './blockLayoutTypes';
import { getAspectRatioValue } from './aspectRatioResolver';
import type { HeightResolutionInput, BlockHeightResolution, CellConfiguration } from './layoutGrammar';
import { HeightResolutionPriority } from './layoutGrammar';

/**
 * WHAT: Solve block height (H) using deterministic formula from spec
 * WHY: All cells in block must share same height while respecting image aspect ratios
 * HOW: H = (blockWidth - sum(non_image_widths)) / sum(image_aspect_ratios)
 * 
 * Formula derivation:
 * blockWidth = sum(all cell widths)
 * blockWidth = sum(image widths) + sum(non-image widths)
 * blockWidth = sum(aspectRatio_i × H) + sum(cellWidth_i × widthPerUnit)
 * blockWidth = H × sum(aspectRatios) + sum(non-image widths)
 * H = (blockWidth - sum(non-image widths)) / sum(aspectRatios)
 * 
 * @param cells - Array of cell configurations with width units and types
 * @param blockWidthPx - Total block width (e.g., 1200px)
 * @returns Calculated block height in pixels
 */
export function solveBlockHeightWithImages(cells: BaseCellConfiguration[], blockWidthPx: number): number {
  if (cells.length === 0) {
    console.warn('[BlockHeightCalculator] No cells in block');
    return 360;
  }
  
  // WHAT: Calculate total "effective units" for proportional distribution
  // WHY: All cells participate in width distribution, but with different weights
  // HOW: 
  //   - Non-IMAGE cells: contribute their cellWidth (1 or 2 units)
  //   - IMAGE cells: contribute their aspectRatio as "effective units"
  //
  // This is because:
  //   - Non-IMAGE width = cellWidth × H
  //   - IMAGE width = aspectRatio × H
  //
  // So IMAGE cells with aspectRatio act like "aspectRatio units" in the distribution
  
  let totalEffectiveUnits = 0;
  const cellDetails: Array<{ chartId: string; type: string; effectiveUnits: number }> = [];
  
  // WHAT: Check if this row should use aspect ratio (1-2 charts)
  // WHY: Small rows need reasonable aspect ratio, large rows share height naturally
  const useAspectRatio = cells.length <= 2;
  
  // WHAT: Calculate aspect ratio multiplier based on cell count
  // WHY: We want the TOTAL row to be 3:1, not each cell individually
  // HOW: 1 chart → 3x, 2 charts → 1.5x each (total still 3x)
  const aspectMultiplier = useAspectRatio ? (3 / cells.length) : 1;
  
  for (const c of cells) {
    if (c.bodyType === 'image') {
      // IMAGE cell: effective units = aspect ratio
      const aspectRatio = getAspectRatioValue(c.aspectRatio || '16:9');
      totalEffectiveUnits += aspectRatio;
      cellDetails.push({ chartId: c.chartId, type: 'image', effectiveUnits: aspectRatio });
    } else if (useAspectRatio && (c.bodyType === 'bar' || c.bodyType === 'pie' || c.bodyType === 'kpi')) {
      // WHAT: Rows with 1-2 charts get 3:1 aspect ratio for the WHOLE row
      // WHY: Prevent extreme heights when few charts in row
      // HOW: Split the 3x multiplier across all cells
      const implicitAspectRatio = aspectMultiplier * c.cellWidth;
      totalEffectiveUnits += implicitAspectRatio;
      cellDetails.push({ chartId: c.chartId, type: `${c.bodyType}(≤2)`, effectiveUnits: implicitAspectRatio });
    } else {
      // 3+ chart row OR text: effective units = cellWidth
      totalEffectiveUnits += c.cellWidth;
      cellDetails.push({ chartId: c.chartId, type: c.bodyType, effectiveUnits: c.cellWidth });
    }
  }
  
  if (totalEffectiveUnits <= 0) {
    console.warn('[BlockHeightCalculator] Total effective units is 0');
    return 360;
  }
  
  // WHAT: Calculate block height using proportional distribution
  // WHY: All cells share height H, and together they must fill blockWidth
  // HOW: H = blockWidth / totalEffectiveUnits
  //
  // Proof:
  //   blockWidth = sum(all cell widths)
  //   blockWidth = sum(cellWidth_i × H) + sum(aspectRatio_i × H)  
  //   blockWidth = H × (sum(cellWidths) + sum(aspectRatios))
  //   blockWidth = H × totalEffectiveUnits
  //   Therefore: H = blockWidth / totalEffectiveUnits
  const H = blockWidthPx / totalEffectiveUnits;
  
  // WHAT: Apply reasonable bounds
  // WHY: Prevent extreme values from edge cases
  const minHeight = 150;
  const maxHeight = 800;
  const clampedHeight = Math.max(minHeight, Math.min(maxHeight, H));
  
  console.log('[BlockHeightCalculator] Calculated height:', {
    blockWidthPx,
    totalEffectiveUnits: totalEffectiveUnits.toFixed(4),
    cellBreakdown: cellDetails,
    rawH: H.toFixed(2),
    clampedH: clampedHeight.toFixed(2),
    wasClamp: H !== clampedHeight
  });
  
  return Math.round(clampedHeight);
}

export function calculateBlockLayout(input: BlockLayoutInput): BlockLayoutResult {
  const { blockId, blockWidthPx, cells } = input;
  const H = solveBlockHeightWithImages(cells, blockWidthPx);

  const cellSizes = cells.map((c) => {
    let widthPx = 0;
    if (c.bodyType === 'image') {
      widthPx = getAspectRatioValue(c.aspectRatio || '16:9') * H;
    } else if (c.bodyType === 'text') {
      widthPx = 300; // default TEXT allocation per spec; upstream may override
    } else {
      // Non-image types: width is driven by grid (1/2 units). We leave px width to CSS grid.
      // Here we set 0 to indicate CSS-driven; consumers should use grid column spans.
      widthPx = 0;
    }
    return { chartId: c.chartId, widthPx, heightPx: H };
  });

  return {
    blockId,
    blockHeightPx: H,
    syncedFonts: { titlePx: 18, subtitlePx: 14 }, // actual sync computed elsewhere
    cells: cellSizes,
  };
}

/**
 * WHAT: Resolve block height with detailed resolution information
 * WHY: Editor validation API needs priority, reason, and constraints
 * HOW: Thin wrapper over solveBlockHeightWithImages that returns BlockHeightResolution
 * 
 * @param input - Height resolution input with cells, constraints, and metadata
 * @returns Block height resolution with priority, reason, and height
 */
export function resolveBlockHeightWithDetails(input: HeightResolutionInput): BlockHeightResolution {
  const { cells, blockWidth, blockAspectRatio, maxAllowedHeight } = input;
  
  // Convert extended CellConfiguration to base CellConfiguration for solver
  const baseCells: BaseCellConfiguration[] = cells.map(cell => ({
    chartId: cell.chartId,
    cellWidth: cell.cellWidth,
    bodyType: cell.bodyType,
    aspectRatio: cell.aspectRatio,
    title: cell.title,
    subtitle: cell.subtitle
  }));
  
  // Calculate base height using existing solver
  let heightPx = solveBlockHeightWithImages(baseCells, blockWidth);
  
  // Check for intrinsic media (Priority 1)
  const hasIntrinsicMedia = cells.some(cell => 
    cell.bodyType === 'image' && cell.imageMode === 'setIntrinsic'
  );
  
  if (hasIntrinsicMedia) {
    // Calculate height from intrinsic aspect ratio
    const intrinsicImages = cells.filter(cell => 
      cell.bodyType === 'image' && cell.imageMode === 'setIntrinsic'
    );
    
    // Use the largest required height from intrinsic images
    let maxIntrinsicHeight = 0;
    for (const img of intrinsicImages) {
      const aspectRatio = getAspectRatioValue(img.aspectRatio || '16:9');
      const intrinsicHeight = blockWidth / aspectRatio;
      maxIntrinsicHeight = Math.max(maxIntrinsicHeight, intrinsicHeight);
    }
    
    if (maxIntrinsicHeight > 0) {
      heightPx = Math.round(maxIntrinsicHeight);
    }
    
    // Apply maxAllowedHeight constraint if provided
    if (maxAllowedHeight !== undefined && heightPx > maxAllowedHeight) {
      heightPx = maxAllowedHeight;
      return {
        heightPx,
        priority: HeightResolutionPriority.READABILITY_ENFORCEMENT,
        reason: 'Intrinsic media height clamped by maxAllowedHeight constraint',
        canIncrease: false,
        requiresSplit: true
      };
    }
    
    return {
      heightPx,
      priority: HeightResolutionPriority.INTRINSIC_MEDIA,
      reason: 'Height driven by intrinsic image aspect ratio',
      canIncrease: maxAllowedHeight === undefined || heightPx < maxAllowedHeight,
      requiresSplit: false
    };
  }
  
  // Check for block aspect ratio (Priority 2)
  if (blockAspectRatio && !blockAspectRatio.isSoftConstraint) {
    const aspectRatio = getAspectRatioValue(blockAspectRatio.ratio);
    const aspectHeight = blockWidth / aspectRatio;
    heightPx = Math.round(aspectHeight);
    
    // Apply maxAllowedHeight constraint if provided
    if (maxAllowedHeight !== undefined && heightPx > maxAllowedHeight) {
      heightPx = maxAllowedHeight;
      return {
        heightPx,
        priority: HeightResolutionPriority.READABILITY_ENFORCEMENT,
        reason: 'Block aspect ratio height clamped by maxAllowedHeight constraint',
        canIncrease: false,
        requiresSplit: true
      };
    }
    
    return {
      heightPx,
      priority: HeightResolutionPriority.BLOCK_ASPECT_RATIO,
      reason: `Height driven by block aspect ratio ${blockAspectRatio.ratio}`,
      canIncrease: maxAllowedHeight === undefined || heightPx < maxAllowedHeight,
      requiresSplit: false
    };
  }
  
  // Default: Readability enforcement (Priority 3)
  // Apply maxAllowedHeight constraint if provided
  if (maxAllowedHeight !== undefined && heightPx > maxAllowedHeight) {
    heightPx = maxAllowedHeight;
    return {
      heightPx,
      priority: HeightResolutionPriority.READABILITY_ENFORCEMENT,
      reason: 'Calculated height clamped by maxAllowedHeight constraint',
      canIncrease: false,
      requiresSplit: true
    };
  }
  
  return {
    heightPx,
    priority: HeightResolutionPriority.READABILITY_ENFORCEMENT,
    reason: 'Height calculated from cell distribution',
    canIncrease: maxAllowedHeight === undefined || heightPx < maxAllowedHeight,
    requiresSplit: false
  };
}
