// lib/blockLayoutTypes.ts
// WHAT: Types for deterministic report layout engine (Spec v2.0)
// WHY: Enforce 3-zone cell structure and block-level synchronized sizing

import type { AspectRatio, CellWidth } from './chartConfigTypes';

export type ChartBodyType = 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'table';

export interface CellZones {
  // Title zone: shared font size per block, up to 2 lines
  titleZone: { heightPx: number; };
  // Subtitle zone: shared font size per block, up to 2 lines
  subtitleZone: { heightPx: number; };
  // Body zone: chart/content area that scales to fill remaining height
  bodyZone: { minHeightPx?: number };
}

export interface CellConfiguration {
  chartId: string;
  cellWidth: CellWidth; // 1 or 2 units
  bodyType: ChartBodyType; // For sizing logic
  aspectRatio?: AspectRatio; // IMAGE requires; TEXT optional
  title?: string;
  subtitle?: string;
}

export interface BlockLayoutInput {
  blockId: string;
  blockWidthPx: number; // e.g., 1200
  cells: CellConfiguration[];
}

export interface SyncedFontSizes {
  titlePx: number;
  subtitlePx: number;
  kpiPx?: number; // for KPI values (max 8 chars)
}

export interface BlockLayoutResult {
  blockId: string;
  blockHeightPx: number; // Solved shared height H
  syncedFonts: SyncedFontSizes;
  cells: Array<{
    chartId: string;
    widthPx: number;
    heightPx: number; // equals blockHeightPx
  }>;
}
