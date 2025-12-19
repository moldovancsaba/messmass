// lib/aspectRatioResolver.ts
// WHAT: Utilities for aspect ratio → numeric conversion and unit width mapping
// WHY: Deterministic layout needs numeric ratios to solve block height

import type { AspectRatio, CellWidth } from './chartConfigTypes';

export function getAspectRatioValue(ratio: AspectRatio): number {
  switch (ratio) {
    case '16:9':
      return 16 / 9;
    case '9:16':
      return 9 / 16;
    case '1:1':
    default:
      return 1;
  }
}

export function getUnitFraction(cellWidth: CellWidth): number {
  // 1-unit = 1fr, 2-unit = 2fr
  return cellWidth === 2 ? 2 : 1;
}
