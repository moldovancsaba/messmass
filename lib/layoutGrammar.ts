// lib/layoutGrammar.ts
// WHAT: Core types and interfaces for Layout Grammar system
// WHY: Centralized type definitions for height resolution and element validation

import type { CellConfiguration as BaseCellConfiguration } from './blockLayoutTypes';
import type { AspectRatio } from './chartConfigTypes';

/**
 * Height resolution priority levels
 * Priority 1 (Intrinsic Media) takes precedence over all others
 */
export enum HeightResolutionPriority {
  INTRINSIC_MEDIA = 1,
  BLOCK_ASPECT_RATIO = 2,
  READABILITY_ENFORCEMENT = 3,
  STRUCTURAL_FAILURE = 4
}

/**
 * Extended CellConfiguration with optional imageMode and contentMetadata
 */
export interface CellConfiguration extends BaseCellConfiguration {
  imageMode?: 'cover' | 'setIntrinsic';
  contentMetadata?: Record<string, unknown>;
}

/**
 * Input for height resolution
 */
export interface HeightResolutionInput {
  blockId: string;
  blockWidth: number;
  cells: CellConfiguration[];
  blockAspectRatio?: {
    ratio: AspectRatio; // e.g., "16:9"
    isSoftConstraint: boolean;
  };
  maxAllowedHeight?: number;
  contentMetadata?: Record<number, Record<string, unknown>>;
}

/**
 * Result of block height resolution
 */
export interface BlockHeightResolution {
  heightPx: number;
  priority: HeightResolutionPriority;
  reason: string;
  canIncrease: boolean;
  requiresSplit: boolean;
}

/**
 * Element fit validation result
 */
export interface ElementFitValidation {
  fits: boolean;
  requiredHeight?: number;
  minFontSize?: number;
  currentFontSize?: number;
  violations: string[];
  requiredActions: Array<'reflow' | 'aggregate' | 'increaseHeight' | 'splitBlock'>;
}

