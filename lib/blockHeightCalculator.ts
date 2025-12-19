// lib/blockHeightCalculator.ts
// WHAT: Deterministic block height solver per spec v2.0
// WHY: All cells in a block share the same height H while respecting image aspect ratios

import type { BlockLayoutInput, BlockLayoutResult, CellConfiguration } from './blockLayoutTypes';
import { getAspectRatioValue } from './aspectRatioResolver';

/**
 * Solve block height (H) so that sum(width_i) == blockWidthPx while preserving image aspect ratios.
 * - IMAGE: width_i = a_i * H (a_i = aspect ratio)
 * - TEXT: width_i = explicit fixed width (caller decides) or proportional units (handled upstream)
 * - KPI/PIE/BAR: width_i provided by upstream grid (1 or 2 units) → handled via CSS fr; here we only solve H when images present
 *
 * For practical purposes, we solve H only when at least one IMAGE cell is present.
 */
export function solveBlockHeightWithImages(cells: CellConfiguration[], blockWidthPx: number, textFixedWidthPx = 300): number {
  // Sum of image width contributions is (sum a_i) * H
  let sumAspect = 0;
  let fixedWidth = 0;

  for (const c of cells) {
    if (c.bodyType === 'image') {
      const a = getAspectRatioValue(c.aspectRatio || '16:9');
      sumAspect += a;
    } else if (c.bodyType === 'text') {
      fixedWidth += textFixedWidthPx; // spec: TEXT width allocated explicitly
    } else {
      // Non-image/text cells treated as proportional via grid; they do not affect H directly here
    }
  }

  if (sumAspect <= 0) {
    // No images → fallback: use a default H based on block width (e.g., 1:1 tile height for 1-unit)
    // Caller may override. Use conservative 360px.
    return 360;
  }

  const H = (blockWidthPx - fixedWidth) / sumAspect;
  return Math.max(120, Math.floor(H)); // guardrail: min height 120px
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
