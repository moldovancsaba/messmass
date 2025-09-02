'use client';

/**
 * HashtagColorResolver hook
 * 
 * Provides advanced hashtag color resolution functionality that:
 * 1. Determines which category a hashtag belongs to
 * 2. Resolves color priority: Category Color > Individual Color > Default Color
 * 3. Caches results for performance
 * 4. Provides real-time updates when categories or colors change
 */

import { useCallback } from 'react';
import { useHashtagData } from '@/contexts/HashtagDataProvider';

interface HashtagColorInfo {
  hashtag: string;
  category?: string;
  categoryColor?: string;
  individualColor?: string;
  effectiveColor: string;
  isUncategorized: boolean;
}

interface UseHashtagColorResolverReturn {
  // Core functions
  getHashtagColorInfo: (hashtag: string, projectCategorizedHashtags?: { [categoryName: string]: string[] }) => HashtagColorInfo;
  resolveHashtagColor: (hashtag: string, projectCategorizedHashtags?: { [categoryName: string]: string[] }) => string;
  findHashtagCategory: (hashtag: string, projectCategorizedHashtags?: { [categoryName: string]: string[] }) => string | undefined;
  
  // Loading states
  loading: boolean;
  
  // Data refresh
  refresh: () => Promise<void>;
}

export default function useHashtagColorResolver(): UseHashtagColorResolverReturn {
  const { 
    categories, 
    hashtagColors, 
    loadingCategories, 
    loadingColors, 
    getCategoryColor, 
    getHashtagColor,
    refreshCategories,
    refreshColors
  } = useHashtagData();

  const loading = loadingCategories || loadingColors;

  /**
   * Finds which category a hashtag belongs to within a specific project's categorized hashtags
   */
  const findHashtagCategory = useCallback((
    hashtag: string, 
    projectCategorizedHashtags?: { [categoryName: string]: string[] }
  ): string | undefined => {
    if (!projectCategorizedHashtags) return undefined;
    
    // Search through project's categorized hashtags
    for (const [categoryName, hashtags] of Object.entries(projectCategorizedHashtags)) {
      if (hashtags.includes(hashtag.toLowerCase())) {
        return categoryName;
      }
    }
    
    return undefined;
  }, []);

  /**
   * Resolves the effective color for a hashtag based on the priority system:
   * 1. Category Color (if hashtag is in a category)
   * 2. Individual Hashtag Color (from hashtag-colors API)
   * 3. Default Color (#667eea)
   */
  const resolveHashtagColor = useCallback((
    hashtag: string, 
    projectCategorizedHashtags?: { [categoryName: string]: string[] }
  ): string => {
    // 1. Check if hashtag is in a category (highest priority)
    const category = findHashtagCategory(hashtag, projectCategorizedHashtags);
    if (category) {
      const categoryColor = getCategoryColor(category);
      if (categoryColor) {
        return categoryColor;
      }
    }

    // 2. Check for individual hashtag color
    const individualColor = getHashtagColor(hashtag);
    if (individualColor) {
      return individualColor;
    }

    // 3. Default color
    return '#667eea';
  }, [findHashtagCategory, getCategoryColor, getHashtagColor]);

  /**
   * Gets complete color information for a hashtag
   */
  const getHashtagColorInfo = useCallback((
    hashtag: string, 
    projectCategorizedHashtags?: { [categoryName: string]: string[] }
  ): HashtagColorInfo => {
    const category = findHashtagCategory(hashtag, projectCategorizedHashtags);
    const categoryColor = category ? getCategoryColor(category) : undefined;
    const individualColor = getHashtagColor(hashtag);
    const effectiveColor = resolveHashtagColor(hashtag, projectCategorizedHashtags);

    return {
      hashtag,
      category,
      categoryColor,
      individualColor,
      effectiveColor,
      isUncategorized: !category
    };
  }, [findHashtagCategory, getCategoryColor, getHashtagColor, resolveHashtagColor]);

  /**
   * Refreshes all color and category data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      refreshCategories(),
      refreshColors()
    ]);
  }, [refreshCategories, refreshColors]);

  return {
    getHashtagColorInfo,
    resolveHashtagColor,
    findHashtagCategory,
    loading,
    refresh
  };
}
