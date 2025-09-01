/**
 * hashtagCategoryTypes.ts
 * 
 * TypeScript interfaces and types for hashtag categories system.
 * This file defines the data structures used across the application
 * for managing hashtag categories and their relationships.
 * 
 * Strategic Design Decisions:
 * - Maintains backward compatibility with existing hashtag system
 * - Supports both categorized and uncategorized hashtags
 * - Enables efficient category-to-hashtag mapping storage
 * - Follows existing project naming conventions and patterns
 */

/**
 * Core hashtag category interface for MongoDB document structure
 * Represents a single category that can group multiple hashtags
 */
export interface HashtagCategory {
  _id?: string;                    // MongoDB ObjectId as string
  name: string;                    // Category name (e.g., "city", "vetting", "success", "year")
  color: string;                   // Hex color code for category styling (e.g., "#667eea")
  order: number;                   // Display order in interface (0-based, lower = earlier)
  createdAt: string;              // ISO 8601 timestamp with milliseconds
  updatedAt: string;              // ISO 8601 timestamp with milliseconds
}

/**
 * Input data structure for creating or updating a category
 * Used in API endpoints and form submissions
 */
export interface HashtagCategoryInput {
  name: string;                    // Category name (required, validated for uniqueness)
  color: string;                   // Hex color code (required, validated format)
  order?: number;                  // Optional order (auto-assigned if not provided)
}

/**
 * Extended project interface that includes categorized hashtags
 * Extends the existing project structure while maintaining backward compatibility
 */
export interface ProjectWithCategories {
  _id: string;                     // MongoDB ObjectId as string
  eventName: string;               // Event name
  eventDate: string;               // ISO date string
  hashtags?: string[];             // Original hashtags field (maintained for compatibility)
  categorizedHashtags?: CategorizedHashtagMap; // New field for category-hashtag mapping
  stats: {                         // Existing stats structure (unchanged)
    // All existing stat fields remain the same
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    indoor: number;
    outdoor: number;
    stadium: number;
    female: number;
    male: number;
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
    merched: number;
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
    approvedImages?: number;
    rejectedImages?: number;
    visitQrCode?: number;
    visitShortUrl?: number;
    visitWeb?: number;
    visitFacebook?: number;
    visitInstagram?: number;
    visitYoutube?: number;
    visitTiktok?: number;
    visitX?: number;
    visitTrustpilot?: number;
    eventAttendees?: number;
    eventTicketPurchases?: number;
    eventResultHome?: number;
    eventResultVisitor?: number;
    eventValuePropositionVisited?: number;
    eventValuePropositionPurchases?: number;
  };
  viewSlug?: string;               // UUID for read-only access
  editSlug?: string;               // UUID for editing access
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
}

/**
 * Mapping of category names to arrays of hashtag strings
 * Efficient storage structure for category-hashtag relationships
 * 
 * Example:
 * {
 *   "city": ["budapest", "vienna", "prague"],
 *   "vetting": ["approved", "pending"],
 *   "success": ["high", "medium", "low"],
 *   "year": ["2024", "2025"]
 * }
 */
export interface CategorizedHashtagMap {
  [categoryName: string]: string[]; // Category name -> array of hashtag strings
}

/**
 * Combined hashtag information with category context
 * Used for display and color inheritance logic
 */
export interface HashtagWithCategory {
  hashtag: string;                 // The hashtag string
  category?: string;               // Category name if assigned to a category
  categoryColor?: string;          // Category color if applicable
  individualColor?: string;        // Individual hashtag color (may be overridden)
  effectiveColor: string;          // Final computed color for display
  isUncategorized: boolean;        // True if not assigned to any category
}

/**
 * Category with its associated hashtags and metadata
 * Used in admin interface for category management
 */
export interface CategoryWithHashtags {
  category: HashtagCategory;       // Category information
  hashtags: string[];              // Hashtags assigned to this category
  hashtagCount: number;            // Number of hashtags in category
  projectCount: number;            // Number of projects using hashtags from this category
}

/**
 * API response structure for category operations
 * Consistent with existing API patterns in the project
 */
export interface HashtagCategoryApiResponse {
  success: boolean;                // Operation success status
  categories?: HashtagCategory[];  // Array of categories (for GET requests)
  category?: HashtagCategory;      // Single category (for POST/PUT requests)
  error?: string;                  // Error message if success is false
  debug?: any;                     // Debug information for development
}

/**
 * Input structure for updating project hashtags with categories
 * Used when updating projects through API endpoints
 */
export interface ProjectHashtagUpdate {
  projectId: string;               // Project ID to update
  hashtags?: string[];             // Traditional hashtags (for backward compatibility)
  categorizedHashtags?: CategorizedHashtagMap; // Category-hashtag mapping
}

/**
 * Validation result for hashtag category operations
 * Used to ensure data integrity and prevent conflicts
 */
export interface CategoryValidationResult {
  isValid: boolean;                // Overall validation status
  errors: string[];                // Array of validation error messages
  warnings: string[];              // Array of non-blocking warnings
}

/**
 * Default category colors palette
 * Provides consistent color options for new categories
 */
export const DEFAULT_CATEGORY_COLORS: string[] = [
  '#667eea',  // Default purple
  '#764ba2',  // Deep purple
  '#f093fb',  // Light pink
  '#f5576c',  // Red-pink
  '#4facfe',  // Light blue
  '#00f2fe',  // Cyan
  '#43e97b',  // Green
  '#38f9d7',  // Mint
  '#ffecd2',  // Light orange
  '#fcb69f',  // Peach
  '#a8edea',  // Light mint
  '#fed6e3',  // Light pink
  '#d299c2',  // Soft purple
  '#fef9d7',  // Light yellow
  '#ebc0fd',  // Lavender
  '#d9a7c7',  // Dusty rose
  '#96c93d',  // Lime green
  '#00b4db'   // Ocean blue
];

/**
 * Category name validation rules
 * Ensures consistent and valid category names
 */
export const CATEGORY_NAME_VALIDATION = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50,
  PATTERN: /^[a-z0-9_-]+$/,        // Only lowercase letters, numbers, underscore, hyphen
  RESERVED_NAMES: ['default', 'all', 'none', 'undefined', 'null'] // Names that cannot be used
};

/**
 * Helper function type for color inheritance logic
 * Determines the effective color for a hashtag based on category and individual colors
 */
export type ColorResolver = (
  hashtag: string,
  categoryColor?: string,
  individualColor?: string
) => string;

/**
 * Migration status for backward compatibility tracking
 * Used during transition from old to new hashtag system
 */
export interface HashtagMigrationStatus {
  totalProjects: number;           // Total number of projects in database
  migratedProjects: number;        // Projects with categorized hashtags
  pendingProjects: number;         // Projects still using old format
  migrationProgress: number;       // Percentage complete (0-100)
  lastMigrationRun?: string;       // Timestamp of last migration execution
}

