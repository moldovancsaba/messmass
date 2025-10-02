/**
 * hashtagCategoryUtils.ts
 * 
 * Utility functions for hashtag categories system.
 * Provides helper functions for category management, color inheritance,
 * validation, and data transformation operations.
 * 
 * Strategic Purpose:
 * - Centralizes business logic for hashtag categories
 * - Implements color inheritance priority system
 * - Provides validation and data transformation utilities
 * - Maintains consistency across the application
 */

import {
  HashtagCategory,
  HashtagCategoryInput,
  CategorizedHashtagMap,
  HashtagWithCategory,
  CategoryValidationResult,
  ColorResolver,
  DEFAULT_CATEGORY_COLORS,
  CATEGORY_NAME_VALIDATION
} from './hashtagCategoryTypes';

/**
 * Color inheritance resolver function
 * Implements the priority system: Category Color > Individual Color > Default Color
 * 
 * Priority Order (High to Low):
 * 1. Category Color (if hashtag assigned to category) - HIGHEST PRIORITY
 * 2. Individual Hashtag Color (from hashtag-colors collection)
 * 3. Default Color (#667eea) - FALLBACK
 */
export const resolveHashtagColor: ColorResolver = (
  hashtag: string,
  categoryColor?: string,
  individualColor?: string
): string => {
  // Priority 1: Category color overrides everything
  if (categoryColor && isValidHexColor(categoryColor)) {
    return categoryColor;
  }
  
  // Priority 2: Individual hashtag color
  if (individualColor && isValidHexColor(individualColor)) {
    return individualColor;
  }
  
  // Priority 3: Default fallback color
  return '#667eea';
};

/**
 * Validates a hex color code format
 * Ensures color values are properly formatted
 */
export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexColorRegex.test(color);
}

/**
 * Validates category name according to project rules
 * Ensures category names are consistent and safe for database operations
 */
export function validateCategoryName(name: string): CategoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check minimum length
  if (!name || name.length < CATEGORY_NAME_VALIDATION.MIN_LENGTH) {
    errors.push('Category name must be at least 1 character long');
  }
  
  // Check maximum length
  if (name.length > CATEGORY_NAME_VALIDATION.MAX_LENGTH) {
    errors.push(`Category name must be no more than ${CATEGORY_NAME_VALIDATION.MAX_LENGTH} characters long`);
  }
  
  // Check pattern (lowercase, numbers, underscore, hyphen only)
  if (!CATEGORY_NAME_VALIDATION.PATTERN.test(name)) {
    errors.push('Category name can only contain lowercase letters, numbers, underscores, and hyphens');
  }
  
  // Check reserved names
  if (CATEGORY_NAME_VALIDATION.RESERVED_NAMES.includes(name.toLowerCase())) {
    errors.push(`"${name}" is a reserved name and cannot be used as a category name`);
  }
  
  // Warning for single character names
  if (name.length === 1) {
    warnings.push('Single character category names may be harder to understand');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates complete category input data
 * Comprehensive validation for category creation/update operations
 */
export function validateCategoryInput(input: HashtagCategoryInput): CategoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate name
  const nameValidation = validateCategoryName(input.name);
  errors.push(...nameValidation.errors);
  warnings.push(...nameValidation.warnings);
  
  // Validate color
  if (!input.color) {
    errors.push('Category color is required');
  } else if (!isValidHexColor(input.color)) {
    errors.push('Category color must be a valid hex color code (e.g., #667eea)');
  }
  
  // Validate order (if provided)
  if (input.order !== undefined) {
    if (!Number.isInteger(input.order) || input.order < 0) {
      errors.push('Category order must be a non-negative integer');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generates a random category color from the default palette
 * Provides consistent color selection for new categories
 */
export function getRandomCategoryColor(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_CATEGORY_COLORS.length);
  return DEFAULT_CATEGORY_COLORS[randomIndex];
}

/**
 * Creates hashtag information with category context
 * Transforms hashtag strings into enriched objects with color and category info
 */
export function createHashtagWithCategory(
  hashtag: string,
  categories: HashtagCategory[],
  categorizedHashtags: CategorizedHashtagMap,
  individualColors?: { [hashtag: string]: string }
): HashtagWithCategory {
  // Find which category (if any) contains this hashtag
  let assignedCategory: HashtagCategory | undefined;
  let categoryName: string | undefined;
  
  for (const category of categories) {
    const categoryHashtags = categorizedHashtags[category.name] || [];
    if (categoryHashtags.includes(hashtag)) {
      assignedCategory = category;
      categoryName = category.name;
      break; // First match wins (hashtags should not be in multiple categories)
    }
  }
  
  const categoryColor = assignedCategory?.color;
  const individualColor = individualColors?.[hashtag];
  const effectiveColor = resolveHashtagColor(hashtag, categoryColor, individualColor);
  
  return {
    hashtag,
    category: categoryName,
    categoryColor,
    individualColor,
    effectiveColor,
    isUncategorized: !categoryName
  };
}

/**
 * Merges traditional hashtags with categorized hashtags
 * Ensures backward compatibility by combining both hashtag systems
 */
export function mergeHashtagSystems(
  traditionalHashtags: string[] = [],
  categorizedHashtags: CategorizedHashtagMap = {}
): string[] {
  const allHashtags = new Set<string>();
  
  // Add traditional hashtags (for backward compatibility)
  traditionalHashtags.forEach(hashtag => allHashtags.add(hashtag));
  
  // Add categorized hashtags
  Object.values(categorizedHashtags).forEach(hashtagArray => {
    hashtagArray.forEach(hashtag => allHashtags.add(hashtag));
  });
  
  return Array.from(allHashtags).sort();
}

/**
 * Extracts all hashtags from categorized structure
 * Returns a flat array of all hashtags across all categories
 */
export function extractAllCategorizedHashtags(categorizedHashtags: CategorizedHashtagMap): string[] {
  const allHashtags = new Set<string>();
  
  Object.values(categorizedHashtags).forEach(hashtagArray => {
    hashtagArray.forEach(hashtag => allHashtags.add(hashtag));
  });
  
  return Array.from(allHashtags).sort();
}

/**
 * Finds which category a hashtag belongs to (first match only)
 * Returns undefined if hashtag is not in any category
 * @deprecated Use findHashtagCategories for multi-category support
 */
export function findHashtagCategory(
  hashtag: string,
  categorizedHashtags: CategorizedHashtagMap
): string | undefined {
  for (const [categoryName, hashtags] of Object.entries(categorizedHashtags)) {
    if (hashtags.includes(hashtag)) {
      return categoryName;
    }
  }
  return undefined;
}

/**
 * Finds all categories a hashtag belongs to
 * Returns array of category names (supports multi-category hashtags)
 */
export function findHashtagCategories(
  hashtag: string,
  categorizedHashtags: CategorizedHashtagMap
): string[] {
  const categories: string[] = [];
  
  for (const [categoryName, hashtags] of Object.entries(categorizedHashtags)) {
    if (hashtags.includes(hashtag)) {
      categories.push(categoryName);
    }
  }
  
  return categories;
}

/**
 * Adds a hashtag to a specific category
 * Returns updated categorized hashtags map
 */
export function addHashtagToCategory(
  hashtag: string,
  categoryName: string,
  categorizedHashtags: CategorizedHashtagMap
): CategorizedHashtagMap {
  const updated = { ...categorizedHashtags };
  
  // Initialize category array if it doesn't exist
  if (!updated[categoryName]) {
    updated[categoryName] = [];
  }
  
  // Add hashtag if not already present
  if (!updated[categoryName].includes(hashtag)) {
    updated[categoryName] = [...updated[categoryName], hashtag].sort();
  }
  
  return updated;
}

/**
 * Removes a hashtag from a specific category
 * Returns updated categorized hashtags map
 */
export function removeHashtagFromCategory(
  hashtag: string,
  categoryName: string,
  categorizedHashtags: CategorizedHashtagMap
): CategorizedHashtagMap {
  const updated = { ...categorizedHashtags };
  
  if (updated[categoryName]) {
    updated[categoryName] = updated[categoryName].filter(h => h !== hashtag);
    
    // Remove empty category arrays
    if (updated[categoryName].length === 0) {
      delete updated[categoryName];
    }
  }
  
  return updated;
}

/**
 * Moves a hashtag from one category to another
 * Returns updated categorized hashtags map
 */
export function moveHashtagBetweenCategories(
  hashtag: string,
  fromCategory: string,
  toCategory: string,
  categorizedHashtags: CategorizedHashtagMap
): CategorizedHashtagMap {
  let updated = removeHashtagFromCategory(hashtag, fromCategory, categorizedHashtags);
  updated = addHashtagToCategory(hashtag, toCategory, updated);
  return updated;
}

/**
 * Validates categorized hashtags structure (allows hashtags in multiple categories)
 * Now only validates for structural issues, not for multi-category presence
 */
export function validateCategorizedHashtags(
  categorizedHashtags: CategorizedHashtagMap
): CategoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Only validate structural issues, not multi-category presence
  for (const [categoryName, hashtags] of Object.entries(categorizedHashtags)) {
    if (!Array.isArray(hashtags)) {
      errors.push(`Category "${categoryName}" must have an array of hashtags`);
      continue;
    }
    
    // Check for duplicate hashtags within the same category
    const uniqueHashtags = new Set(hashtags);
    if (uniqueHashtags.size !== hashtags.length) {
      errors.push(`Category "${categoryName}" contains duplicate hashtags`);
    }
    
    // Validate hashtag format within category
    for (const hashtag of hashtags) {
      if (typeof hashtag !== 'string' || hashtag.trim() === '') {
        errors.push(`Invalid hashtag in category "${categoryName}": hashtags must be non-empty strings`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generates next order value for a new category
 * Returns the next available order number
 */
export function getNextCategoryOrder(categories: HashtagCategory[]): number {
  if (categories.length === 0) {
    return 0;
  }
  
  const maxOrder = Math.max(...categories.map(cat => cat.order));
  return maxOrder + 1;
}

/**
 * Sorts categories by their order property
 * Returns sorted array for consistent display ordering
 */
export function sortCategoriesByOrder(categories: HashtagCategory[]): HashtagCategory[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

/**
 * Creates a safe category name from user input
 * Normalizes input to valid category name format
 */
export function normalizeCategoryName(input: string): string {
  return input
    .toLowerCase()                    // Convert to lowercase
    .trim()                          // Remove leading/trailing whitespace
    .replace(/[^a-z0-9_-]/g, '-')    // Replace invalid characters with hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing hyphens
}

/**
 * Checks if categories have been modified and need saving
 * Compares current state with saved state for change detection
 */
export function hasUnsavedCategoryChanges(
  currentCategories: HashtagCategory[],
  savedCategories: HashtagCategory[]
): boolean {
  if (currentCategories.length !== savedCategories.length) {
    return true;
  }
  
  const currentMap = new Map(currentCategories.map(cat => [cat._id, cat]));
  const savedMap = new Map(savedCategories.map(cat => [cat._id, cat]));
  
  for (const [id, currentCat] of currentMap) {
    const savedCat = savedMap.get(id);
    if (!savedCat) {
      return true; // New category
    }
    
    if (
      currentCat.name !== savedCat.name ||
      currentCat.color !== savedCat.color ||
      currentCat.order !== savedCat.order
    ) {
      return true; // Modified category
    }
  }
  
  return false;
}

/**
 * Expands categorized hashtags into category-prefixed format
 * Converts {"country": ["hungary", "austria"], "period": ["summer"]} 
 * to ["country:hungary", "country:austria", "period:summer"]
 */
export function expandHashtagsWithCategories(
  categorizedHashtags: CategorizedHashtagMap
): string[] {
  const expandedHashtags: string[] = [];
  
  for (const [categoryName, hashtags] of Object.entries(categorizedHashtags)) {
    hashtags.forEach(hashtag => {
      expandedHashtags.push(`${categoryName}:${hashtag}`);
    });
  }
  
  return expandedHashtags.sort();
}

/**
 * Parses a hashtag query into category and hashtag components
 * Returns { category: string | null, hashtag: string }
 * 
 * Examples:
 * - "summer" -> { category: null, hashtag: "summer" }
 * - "period:summer" -> { category: "period", hashtag: "summer" }
 * - "country:hungary" -> { category: "country", hashtag: "hungary" }
 */
export function parseHashtagQuery(query: string): { category: string | null; hashtag: string } {
  const trimmedQuery = query.trim();
  
  // Check if query contains category prefix
  const colonIndex = trimmedQuery.indexOf(':');
  if (colonIndex > 0 && colonIndex < trimmedQuery.length - 1) {
    const category = trimmedQuery.substring(0, colonIndex).toLowerCase();
    const hashtag = trimmedQuery.substring(colonIndex + 1).toLowerCase();
    
    // Validate category name format (same as category validation)
    if (CATEGORY_NAME_VALIDATION.PATTERN.test(category)) {
      return { category, hashtag };
    }
  }
  
  // Default to plain hashtag
  return { category: null, hashtag: trimmedQuery.toLowerCase() };
}

/**
 * Checks if a hashtag query matches a project's hashtags
 * Supports both traditional hashtags and categorized hashtags with prefixes
 * 
 * @param query - Hashtag query (e.g., "summer" or "period:summer")
 * @param project - Project with traditional and categorized hashtags
 * @returns boolean indicating if the hashtag matches
 */
export function matchHashtagInProject(
  query: string,
  project: {
    hashtags?: string[];
    categorizedHashtags?: CategorizedHashtagMap;
  }
): boolean {
  const { category, hashtag } = parseHashtagQuery(query);
  
  if (category === null) {
    // Plain hashtag - search in traditional hashtags and all categories
    
    // Check traditional hashtags
    if (project.hashtags?.some(h => h.toLowerCase() === hashtag)) {
      return true;
    }
    
    // Check all categorized hashtags
    if (project.categorizedHashtags) {
      for (const categoryHashtags of Object.values(project.categorizedHashtags)) {
        if (categoryHashtags.some(h => h.toLowerCase() === hashtag)) {
          return true;
        }
      }
    }
    
    return false;
  } else {
    // Category-prefixed hashtag - search only in specified category
    const categoryHashtags = project.categorizedHashtags?.[category] || [];
    return categoryHashtags.some(h => h.toLowerCase() === hashtag);
  }
}

/**
 * Generates all possible hashtag representations for a project
 * Returns traditional hashtags and category-prefixed hashtags
 * 
 * WHAT: Display-oriented hashtag list generator
 * WHY: Shows categorized hashtags with their category prefix to avoid duplication
 * 
 * Used for display purposes (not search indexing)
 */
export function getAllHashtagRepresentations(
  project: {
    hashtags?: string[];
    categorizedHashtags?: CategorizedHashtagMap;
  }
): string[] {
  const allRepresentations = new Set<string>();
  
  // Add traditional hashtags (general/uncategorized only)
  if (project.hashtags) {
    project.hashtags.forEach(hashtag => {
      allRepresentations.add(hashtag.toLowerCase());
    });
  }
  
  // Add categorized hashtags (ONLY with category prefix, no plain duplicates)
  // WHAT: Only add the prefixed version to prevent duplication
  // WHY: If a hashtag is in a category, show it as "category:hashtag" not both forms
  if (project.categorizedHashtags) {
    for (const [category, hashtags] of Object.entries(project.categorizedHashtags)) {
      hashtags.forEach(hashtag => {
        const lowerHashtag = hashtag.toLowerCase();
        // Add ONLY the category-prefixed version
        allRepresentations.add(`${category.toLowerCase()}:${lowerHashtag}`);
      });
    }
  }
  
  return Array.from(allRepresentations).sort();
}

/**
 * Validates hashtag uniqueness across traditional and categorized systems
 * Ensures no hashtag appears in both systems or multiple categories
 */
export function validateHashtagUniqueness(
  traditionalHashtags: string[],
  categorizedHashtags: CategorizedHashtagMap
): CategoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Build map of all hashtags and where they appear
  const hashtagToLocations = new Map<string, string[]>();
  
  // Add traditional hashtags
  traditionalHashtags.forEach(hashtag => {
    if (!hashtagToLocations.has(hashtag)) {
      hashtagToLocations.set(hashtag, []);
    }
    hashtagToLocations.get(hashtag)!.push('general');
  });
  
  // Add categorized hashtags
  Object.entries(categorizedHashtags).forEach(([categoryName, hashtags]) => {
    hashtags.forEach(hashtag => {
      if (!hashtagToLocations.has(hashtag)) {
        hashtagToLocations.set(hashtag, []);
      }
      hashtagToLocations.get(hashtag)!.push(categoryName);
    });
  });
  
  // Find duplicates
  for (const [hashtag, locations] of hashtagToLocations) {
    if (locations.length > 1) {
      const locationNames = locations.map(loc => loc === 'general' ? 'General Hashtags' : loc).join(', ');
      errors.push(`Hashtag "${hashtag}" appears in multiple locations: ${locationNames}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets the effective color for a hashtag considering category inheritance
 * Returns the resolved color based on the priority system
 * For multi-category hashtags, returns the first category color found (by category order)
 */
export function getHashtagColor(
  hashtag: string,
  categories: HashtagCategory[],
  categorizedHashtags: CategorizedHashtagMap,
  individualColors?: { [hashtag: string]: string }
): string {
  // Find category for this hashtag (first match wins based on category order)
  let categoryColor: string | undefined;
  
  for (const category of categories) {
    const categoryHashtags = categorizedHashtags[category.name] || [];
    if (categoryHashtags.includes(hashtag)) {
      categoryColor = category.color;
      break; // First match wins (respects category.order)
    }
  }
  
  const individualColor = individualColors?.[hashtag];
  
  return resolveHashtagColor(hashtag, categoryColor, individualColor);
}

/**
 * Gets all effective colors for a hashtag in all its categories
 * Returns array of colors for hashtags that appear in multiple categories
 */
export function getHashtagColors(
  hashtag: string,
  categories: HashtagCategory[],
  categorizedHashtags: CategorizedHashtagMap,
  individualColors?: { [hashtag: string]: string }
): { category: string; color: string; isDefault: boolean }[] {
  const colors: { category: string; color: string; isDefault: boolean }[] = [];
  const individualColor = individualColors?.[hashtag];
  
  // Find all categories this hashtag belongs to
  for (const category of categories) {
    const categoryHashtags = categorizedHashtags[category.name] || [];
    if (categoryHashtags.includes(hashtag)) {
      const effectiveColor = resolveHashtagColor(hashtag, category.color, individualColor);
      colors.push({
        category: category.name,
        color: effectiveColor,
        isDefault: effectiveColor === '#667eea' // Default color indicates fallback
      });
    }
  }
  
  // If no categories found, return individual color or default
  if (colors.length === 0) {
    const effectiveColor = resolveHashtagColor(hashtag, undefined, individualColor);
    colors.push({
      category: 'general',
      color: effectiveColor,
      isDefault: effectiveColor === '#667eea'
    });
  }
  
  return colors;
}

