'use client';

/**
 * useHashtags hook
 * 
 * Provides consistent hashtag API integration across all components
 * Includes search, validation, colors, and categories
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { HashtagCategory } from '@/lib/hashtagCategoryTypes';

interface HashtagColor {
  _id: string;
  uuid: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface HashtagSuggestion {
  hashtag: string;
  isExisting: boolean;
}

interface UseHashtagsReturn {
  // Search and suggestions
  searchHashtags: (query: string) => Promise<string[]>;
  getSuggestions: (query: string, existingHashtags: string[]) => Promise<HashtagSuggestion[]>;
  
  // Validation
  validateHashtag: (hashtag: string) => Promise<{ success: boolean; hashtag?: string; error?: string }>;
  
  // Colors
  hashtagColors: HashtagColor[];
  loadingColors: boolean;
  refreshColors: () => Promise<void>;
  
  // Categories
  categories: HashtagCategory[];
  loadingCategories: boolean;
  refreshCategories: () => Promise<void>;
  
  // Utility functions
  getAllHashtags: () => Promise<string[]>;
  getHashtagColor: (hashtag: string) => string | undefined;
  getCategoryColor: (categoryName: string) => string | undefined;
}

// Global cache for hashtag colors to avoid repeated API calls
let hashtagColorsCache: HashtagColor[] | null = null;
let categoriesCache: HashtagCategory[] | null = null;

export default function useHashtags(): UseHashtagsReturn {
  const [hashtagColors, setHashtagColors] = useState<HashtagColor[]>(hashtagColorsCache || []);
  const [loadingColors, setLoadingColors] = useState(!hashtagColorsCache);
  const [categories, setCategories] = useState<HashtagCategory[]>(categoriesCache || []);
  const [loadingCategories, setLoadingCategories] = useState(!categoriesCache);

  // Load hashtag colors on mount
  useEffect(() => {
    if (!hashtagColorsCache) {
      refreshColors();
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    if (!categoriesCache) {
      refreshCategories();
    }
  }, []);

  // Search hashtags with API
  const searchHashtags = useCallback(async (query: string): Promise<string[]> => {
    if (query.length < 2) return [];

    try {
      const response = await fetch(`/api/hashtags?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        return data.hashtags || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to search hashtags:', error);
      return [];
    }
  }, []);

  // Get suggestions with existing/new indicators
  const getSuggestions = useCallback(async (
    query: string, 
    existingHashtags: string[]
  ): Promise<HashtagSuggestion[]> => {
    if (query.length < 3) return [];

    try {
      const allHashtags = await searchHashtags(query);
      const suggestions: HashtagSuggestion[] = [];

      // Add existing hashtags that match and aren't already selected
      const existingSuggestions = allHashtags
        .filter(hashtag => !existingHashtags.includes(hashtag))
        .map(hashtag => ({ hashtag, isExisting: true }));

      suggestions.push(...existingSuggestions);

      // Add new hashtag suggestion if valid and not duplicate
      const cleanedQuery = query.replace(/^#/, '').toLowerCase().trim();
      const isValidQuery = /^[a-z0-9_]+$/.test(cleanedQuery);
      const isNotExisting = !allHashtags.includes(cleanedQuery);
      const isNotSelected = !existingHashtags.includes(cleanedQuery);

      if (isValidQuery && isNotExisting && isNotSelected && cleanedQuery) {
        suggestions.unshift({ hashtag: cleanedQuery, isExisting: false });
      }

      return suggestions.slice(0, 8); // Limit to 8 suggestions
    } catch (error) {
      console.error('Failed to get hashtag suggestions:', error);
      return [];
    }
  }, [searchHashtags]);

  // Validate and clean hashtag
  const validateHashtag = useCallback(async (hashtag: string) => {
    try {
      const response = await fetch('/api/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtag })
      });

      const data = await response.json();
      return data; // { success, hashtag?, error? }
    } catch (error) {
      console.error('Failed to validate hashtag:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  // Load hashtag colors
  const refreshColors = useCallback(async () => {
    setLoadingColors(true);
    try {
      const response = await fetch(`/api/hashtag-colors?t=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        hashtagColorsCache = data.hashtagColors;
        setHashtagColors(data.hashtagColors);
      }
    } catch (error) {
      console.error('Failed to load hashtag colors:', error);
    } finally {
      setLoadingColors(false);
    }
  }, []);

  // Load categories
  const refreshCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('/api/hashtag-categories');
      const data = await response.json();
      
      if (data.success) {
        categoriesCache = data.categories;
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load hashtag categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Get all hashtags from API
  const getAllHashtags = useCallback(async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/hashtags');
      const data = await response.json();
      
      if (data.success) {
        return data.hashtags || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get all hashtags:', error);
      return [];
    }
  }, []);

  // Get color for a specific hashtag
  const getHashtagColor = useCallback((hashtag: string): string | undefined => {
    const colorRecord = hashtagColors.find(hc => 
      hc.name.toLowerCase() === hashtag.toLowerCase()
    );
    return colorRecord?.color;
  }, [hashtagColors]);

  // Get color for a category
  const getCategoryColor = useCallback((categoryName: string): string | undefined => {
    const category = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.color;
  }, [categories]);

  return {
    // Search and suggestions
    searchHashtags,
    getSuggestions,
    
    // Validation
    validateHashtag,
    
    // Colors
    hashtagColors,
    loadingColors,
    refreshColors,
    
    // Categories
    categories,
    loadingCategories,
    refreshCategories,
    
    // Utility functions
    getAllHashtags,
    getHashtagColor,
    getCategoryColor
  };
}
