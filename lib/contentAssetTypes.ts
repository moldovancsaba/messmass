// lib/contentAssetTypes.ts
// WHAT: TypeScript type definitions for Content Management System
// WHY: Centralized type system for media assets (images, text) with rich metadata
// HOW: Replaces hardcoded reportText1-10 and reportImage1-10 with flexible slug-based references

import { ObjectId } from 'mongodb';

/**
 * WHAT: Content asset type definitions
 * WHY: Support both image URLs (from ImgBB) and multi-line text content
 */
export type ContentAssetType = 'image' | 'text';

/**
 * WHAT: Aspect ratio for image assets
 * WHY: Determines grid width in visualization layouts (Portrait=1, Square=2, Landscape=3)
 */
export type ImageAspectRatio = '16:9' | '9:16' | '1:1';

/**
 * WHAT: Content payload for different asset types
 * WHY: Images store URL + dimensions, text stores multi-line content
 */
export interface ContentAssetContent {
  // Image-specific fields
  url?: string;              // ImgBB CDN URL for images
  width?: number;            // Original image width in pixels
  height?: number;           // Original image height in pixels
  aspectRatio?: ImageAspectRatio; // Aspect ratio for layout calculation
  fileSize?: number;         // File size in bytes

  // Text-specific fields
  text?: string;             // Multi-line text content (markdown supported)
}

/**
 * WHAT: Complete content asset document structure for MongoDB
 * WHY: Centralized storage for reusable media assets across charts and reports
 * HOW: Referenced via [MEDIA:slug] or [TEXT:slug] tokens in chart formulas
 * 
 * EXAMPLE:
 * {
 *   slug: "partner-logo-2024",
 *   title: "Partner ABC Logo",
 *   type: "image",
 *   content: { url: "https://i.ibb.co/abc123", width: 1200, height: 800 },
 *   category: "Partners",
 *   tags: ["partner", "logo", "2024"],
 *   usageCount: 3
 * }
 */
export interface ContentAsset {
  _id?: ObjectId | string;   // MongoDB ObjectId (optional for new documents)
  
  // Identity
  slug: string;              // Unique identifier: "logo-partner-abc", "exec-summary"
  title: string;             // Display name: "Partner ABC Logo", "Executive Summary"
  description?: string;      // Optional description for searchability
  
  // Type & Content
  type: ContentAssetType;    // 'image' or 'text'
  content: ContentAssetContent; // Type-specific content payload
  
  // Organization
  category: string;          // "Partner Report", "Sponsors", "Event Assets", etc.
  tags: string[];            // ["partner", "logo", "2024", "Q4"]
  
  // Workflow Mode
  isVariable?: boolean;      // true = Variable Definition (event-specific), false = Global Asset (reusable)
  
  // Metadata
  uploadedBy?: string;       // Admin user ID who created this asset
  usageCount: number;        // Number of charts referencing this asset (auto-calculated)
  
  // Timestamps (ISO 8601 with milliseconds - MANDATORY per project standards)
  createdAt: string;         // "2025-11-03T09:39:31.123Z"
  updatedAt: string;         // "2025-11-03T09:39:31.123Z"
}

/**
 * WHAT: Reference to chart using a content asset
 * WHY: Usage tracking to prevent accidental deletion of referenced assets
 */
export interface ChartReference {
  chartId: string;           // Chart configuration ID
  title: string;             // Chart display title
  type: string;              // Chart type (pie, bar, kpi, text, image)
  elementIndex?: number;     // Optional: which element uses this asset
}

/**
 * WHAT: Query parameters for filtering content assets
 * WHY: Support search, filter, and sort operations in admin UI
 */
export interface ContentAssetQuery {
  type?: ContentAssetType;   // Filter by asset type
  category?: string;         // Filter by category
  tags?: string[];           // Filter by tags (OR operation)
  search?: string;           // Full-text search (title, description, tags)
  sortBy?: 'title' | 'createdAt' | 'usageCount'; // Sort field
  sortOrder?: 'asc' | 'desc'; // Sort direction
}

/**
 * WHAT: Form data for creating/updating content assets
 * WHY: Type-safe data transfer between UI and API
 */
export interface ContentAssetFormData {
  _id?: string;              // Present when updating existing asset
  slug: string;              // Must be unique and URL-safe
  title: string;             // Required display name
  description?: string;      // Optional searchable description
  type: ContentAssetType;    // 'image' or 'text'
  content: ContentAssetContent; // Type-specific content
  category: string;          // Organizational category
  tags: string[];            // Array of tag strings
  isVariable?: boolean;      // true = Variable Definition (event-specific), false = Global Asset (reusable)
}

/**
 * WHAT: API response structure for content asset operations
 * WHY: Consistent response format across all endpoints
 */
export interface ContentAssetResponse {
  success: boolean;
  asset?: ContentAsset;      // Single asset (POST, PUT)
  assets?: ContentAsset[];   // Multiple assets (GET)
  error?: string;            // Error message if success=false
  message?: string;          // Success message
}

/**
 * WHAT: Usage tracking response
 * WHY: Show which charts reference an asset before deletion
 */
export interface AssetUsageResponse {
  success: boolean;
  slug: string;              // Asset slug
  usageCount: number;        // Total references
  charts: ChartReference[];  // List of charts using this asset
  error?: string;
}

/**
 * WHAT: Slug validation result
 * WHY: Ensure slugs are unique and URL-safe before saving
 */
export interface SlugValidationResult {
  isValid: boolean;          // true if slug is available and valid
  error?: string;            // Error message if invalid
  suggestion?: string;       // Alternative slug if taken
}

/**
 * TOKEN FORMAT SPECIFICATION
 * 
 * WHAT: Standard token syntax for referencing content assets in formulas
 * WHY: Consistent with existing [PARAM:*] and [MANUAL:*] token patterns
 * 
 * FORMAT:
 * - Images: [MEDIA:slug]     e.g., [MEDIA:logo-partner-abc]
 * - Text:   [TEXT:slug]      e.g., [TEXT:executive-summary]
 * 
 * RULES:
 * - Slug must be lowercase, alphanumeric with hyphens only
 * - Slug must be unique across all assets
 * - Slug cannot be changed after creation (breaks references)
 * 
 * BACKWARD COMPATIBILITY:
 * - Legacy [stats.reportImage1-10] and [stats.reportText1-10] continue to work
 * - Migration script converts legacy references to new token format
 */

/**
 * WHAT: Helper function to generate slug from title
 * WHY: Auto-generate URL-safe slugs for better UX
 * HOW: Lowercase, replace spaces with hyphens, remove special chars
 * 
 * @param title - Display title to convert
 * @returns URL-safe slug
 * 
 * @example
 * generateSlug("Partner ABC Logo") // returns "partner-abc-logo"
 * generateSlug("Q4 2024 Summary!") // returns "q4-2024-summary"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

/**
 * WHAT: Validate slug format
 * WHY: Ensure slugs are URL-safe before database insertion
 * HOW: Check against allowed pattern (lowercase, alphanumeric, hyphens)
 * 
 * @param slug - Slug to validate
 * @returns true if valid format
 */
export function isValidSlug(slug: string): boolean {
  // WHAT: Allow stats.camelCase format for database field names (NO MAPPING)
  // WHY: Content Library defines exact database variable names
  // FORMAT: stats.variableName (e.g., stats.fanSelfiePortrait1)
  const statsRegex = /^stats\.[a-zA-Z][a-zA-Z0-9]*$/;
  
  // WHAT: Legacy kebab-case format still supported for backward compatibility
  const kebabRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  
  return statsRegex.test(slug) || kebabRegex.test(slug);
}

/**
 * WHAT: Extract content asset tokens from formula string
 * WHY: Identify which assets are referenced for usage tracking
 * HOW: Match [MEDIA:slug] and [TEXT:slug] patterns
 * 
 * @param formula - Chart formula string
 * @returns Array of asset slugs found in formula
 * 
 * @example
 * extractAssetTokens("[MEDIA:logo-abc] + [TEXT:summary]")
 * // returns ["logo-abc", "summary"]
 */
export function extractAssetTokens(formula: string): string[] {
  // WHAT: Match [MEDIA:slug] or [TEXT:slug] patterns
  // WHY: Usage tracking needs to find all asset references
  const tokenRegex = /\[(MEDIA|TEXT):([a-z0-9-]+)\]/g;
  const tokens: string[] = [];
  let match;
  
  while ((match = tokenRegex.exec(formula)) !== null) {
    const slug = match[2];
    if (!tokens.includes(slug)) {
      tokens.push(slug);
    }
  }
  
  return tokens;
}

/**
 * WHAT: Format asset reference token for display
 * WHY: Consistent token formatting in UI (copy-to-clipboard)
 * 
 * @param type - Asset type ('image' or 'text')
 * @param slug - Asset slug
 * @returns Formatted token string
 * 
 * @example
 * formatAssetToken('image', 'logo-abc') // returns "[MEDIA:logo-abc]"
 * formatAssetToken('text', 'summary')   // returns "[TEXT:summary]"
 */
export function formatAssetToken(type: ContentAssetType, slug: string): string {
  const prefix = type === 'image' ? 'MEDIA' : 'TEXT';
  return `[${prefix}:${slug}]`;
}
