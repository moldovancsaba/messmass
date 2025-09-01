/**
 * Utility functions for displaying hashtags with category information
 */

export interface HashtagWithCategory {
  hashtag: string;
  categories: string[];
  primaryCategory?: string;
}

export interface ProjectHashtagData {
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
}

/**
 * Find all categories that contain a specific hashtag
 */
export function findHashtagCategories(
  hashtag: string, 
  projectData: ProjectHashtagData
): string[] {
  const categories: string[] = [];
  
  // Check general hashtags
  if (projectData.hashtags && projectData.hashtags.includes(hashtag)) {
    categories.push('general');
  }
  
  // Check categorized hashtags
  if (projectData.categorizedHashtags) {
    Object.entries(projectData.categorizedHashtags).forEach(([categoryName, categoryHashtags]) => {
      if (Array.isArray(categoryHashtags) && categoryHashtags.includes(hashtag)) {
        categories.push(categoryName);
      }
    });
  }
  
  return categories;
}

/**
 * Get primary category for a hashtag (first non-general category, or general if that's all)
 */
export function getPrimaryCategory(
  hashtag: string, 
  projectData: ProjectHashtagData
): string | undefined {
  const categories = findHashtagCategories(hashtag, projectData);
  
  // Prefer non-general categories first
  const nonGeneralCategories = categories.filter(cat => cat !== 'general');
  if (nonGeneralCategories.length > 0) {
    return nonGeneralCategories[0];
  }
  
  // Fall back to general if that's the only one
  if (categories.includes('general')) {
    return 'general';
  }
  
  return undefined;
}

/**
 * Create a comprehensive list of hashtags with their categories from project data
 */
export function getAllHashtagsWithCategories(
  projectData: ProjectHashtagData
): HashtagWithCategory[] {
  const hashtagMap = new Map<string, HashtagWithCategory>();
  
  // Process general hashtags
  if (projectData.hashtags) {
    projectData.hashtags.forEach(hashtag => {
      if (!hashtagMap.has(hashtag)) {
        hashtagMap.set(hashtag, {
          hashtag,
          categories: [],
          primaryCategory: undefined
        });
      }
      hashtagMap.get(hashtag)!.categories.push('general');
    });
  }
  
  // Process categorized hashtags
  if (projectData.categorizedHashtags) {
    Object.entries(projectData.categorizedHashtags).forEach(([categoryName, categoryHashtags]) => {
      if (Array.isArray(categoryHashtags)) {
        categoryHashtags.forEach(hashtag => {
          if (!hashtagMap.has(hashtag)) {
            hashtagMap.set(hashtag, {
              hashtag,
              categories: [],
              primaryCategory: undefined
            });
          }
          hashtagMap.get(hashtag)!.categories.push(categoryName);
        });
      }
    });
  }
  
  // Set primary categories
  hashtagMap.forEach((hashtagData) => {
    const nonGeneralCategories = hashtagData.categories.filter(cat => cat !== 'general');
    hashtagData.primaryCategory = nonGeneralCategories.length > 0 
      ? nonGeneralCategories[0] 
      : (hashtagData.categories.includes('general') ? 'general' : undefined);
  });
  
  return Array.from(hashtagMap.values()).sort((a, b) => a.hashtag.localeCompare(b.hashtag));
}

/**
 * Format hashtag display with category info for debugging or display
 */
export function formatHashtagWithCategory(
  hashtag: string,
  categories: string[]
): string {
  if (categories.length === 0) return `#${hashtag}`;
  if (categories.length === 1) {
    const category = categories[0];
    return category === 'general' ? `#${hashtag}` : `${category}: #${hashtag}`;
  }
  
  // Multiple categories
  const nonGeneral = categories.filter(cat => cat !== 'general');
  const hasGeneral = categories.includes('general');
  
  if (nonGeneral.length === 0) return `#${hashtag}`;
  
  const categoryList = hasGeneral 
    ? [...nonGeneral, 'general'].join(', ')
    : nonGeneral.join(', ');
    
  return `[${categoryList}]: #${hashtag}`;
}
