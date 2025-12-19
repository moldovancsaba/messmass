// lib/fontSyncCalculator.ts
// WHAT: Block-level font synchronization per spec v2.0
// WHY: Titles, subtitles, and KPI values must share sizes within a block

import type { CellConfiguration, SyncedFontSizes } from './blockLayoutTypes';

export interface FontSyncOptions {
  maxTitleLines: 1 | 2;
  maxSubtitleLines: 1 | 2;
  enableKPISync?: boolean;
}

// Heuristic text metrics: average chars per line at fontSize px within container width
function estimateFits(text: string, fontPx: number, containerWidthPx: number, maxLines: number): boolean {
  // Very rough heuristic: ~0.55em per char, assume 1em ≈ fontPx
  const charsPerLine = Math.max(1, Math.floor((containerWidthPx / (fontPx * 0.55))));
  const neededLines = Math.ceil((text || '').length / charsPerLine);
  return neededLines <= maxLines;
}

function binarySearchFont(textSamples: string[], containerWidthPx: number, maxLines: number, hi = 28, lo = 10): number {
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ok = textSamples.every(t => estimateFits(t, mid, containerWidthPx, maxLines));
    if (ok) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

export function calculateSyncedFontSizes(
  cells: CellConfiguration[],
  blockWidthPx: number,
  options: FontSyncOptions
): SyncedFontSizes {
  const titleSamples = cells.map(c => c.title || '').filter(Boolean);
  const subtitleSamples = cells.map(c => c.subtitle || '').filter(Boolean);

  const titlePx = titleSamples.length
    ? binarySearchFont(titleSamples, Math.max(280, blockWidthPx / 2), options.maxTitleLines)
    : 18;
  const subtitlePx = subtitleSamples.length
    ? binarySearchFont(subtitleSamples, Math.max(280, blockWidthPx / 2), options.maxSubtitleLines, 22, 10)
    : 14;

  const kpiPx = options.enableKPISync ? Math.max(20, Math.min(64, Math.floor(blockWidthPx / 15))) : undefined;

  return { titlePx, subtitlePx, kpiPx };
}
