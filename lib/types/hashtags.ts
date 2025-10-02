/**
 * Hashtag System Type Definitions
 * 
 * Centralized type definitions for the unified hashtag system including
 * colors, suggestions, and API responses.
 * 
 * WHAT: Comprehensive type safety for hashtag-related operations
 * WHY: Eliminate `any` types, improve IDE support, prevent runtime errors
 * 
 * NOTE: HashtagCategory is imported from hashtagCategoryTypes.ts to maintain consistency
 */

import type { HashtagCategory, CategorizedHashtagMap } from '../hashtagCategoryTypes';

// Re-export for convenience
export type { HashtagCategory, CategorizedHashtagMap };

/**
 * Hashtag color configuration from the database
 * Matches the structure returned by /api/hashtag-colors
 */
export interface HashtagColor {
  _id: string;
  uuid: string;
  name: string;  // The hashtag name
  color: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hashtag suggestion with existence indicator
 * Used in autocomplete and search interfaces
 */
export interface HashtagSuggestion {
  hashtag: string;
  isExisting: boolean;
  count?: number;
}

/**
 * API response from hashtag search/list endpoints
 */
export interface HashtagWithCount {
  hashtag: string;
  count: number;
}


/**
 * Hashtag validation result
 */
export interface HashtagValidationResult {
  success: boolean;
  hashtag?: string;
  error?: string;
}

/**
 * Type guard to check if an object is a valid HashtagColor
 */
export function isHashtagColor(obj: unknown): obj is HashtagColor {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_id' in obj &&
    'name' in obj &&
    'color' in obj &&
    typeof (obj as HashtagColor)._id === 'string' &&
    typeof (obj as HashtagColor).name === 'string' &&
    typeof (obj as HashtagColor).color === 'string'
  );
}

/**
 * Type guard to check if an object is a valid HashtagCategory
 */
export function isHashtagCategory(obj: unknown): obj is HashtagCategory {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_id' in obj &&
    'name' in obj &&
    'color' in obj &&
    'order' in obj &&
    typeof (obj as HashtagCategory)._id === 'string' &&
    typeof (obj as HashtagCategory).name === 'string' &&
    typeof (obj as HashtagCategory).color === 'string' &&
    typeof (obj as HashtagCategory).order === 'number'
  );
}

/**
 * Type guard to check if an object is a valid HashtagSuggestion
 */
export function isHashtagSuggestion(obj: unknown): obj is HashtagSuggestion {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'hashtag' in obj &&
    'isExisting' in obj &&
    typeof (obj as HashtagSuggestion).hashtag === 'string' &&
    typeof (obj as HashtagSuggestion).isExisting === 'boolean'
  );
}

/**
 * Safely parse an unknown object as a HashtagColor array
 * Returns empty array if parsing fails
 */
export function parseHashtagColors(data: unknown): HashtagColor[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isHashtagColor);
}

/**
 * Safely parse an unknown object as a HashtagCategory array
 * Returns empty array if parsing fails
 */
export function parseHashtagCategories(data: unknown): HashtagCategory[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isHashtagCategory);
}

/**
 * Normalize hashtag API response (handles both string and object formats)
 * Some APIs return ["tag1", "tag2"], others return [{hashtag: "tag1", count: 5}, ...]
 */
export function normalizeHashtagResponse(response: unknown): string[] {
  if (!Array.isArray(response)) return [];
  
  return response
    .map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null && 'hashtag' in item) {
        return String(item.hashtag);
      }
      return null;
    })
    .filter((tag): tag is string => tag !== null && tag.length > 0);
}
