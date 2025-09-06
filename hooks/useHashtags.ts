'use client';

/**
 * useHashtags hook
 * 
 * Provides consistent hashtag API integration across all components
 * Now uses HashtagDataProvider context for colors and categories to prevent duplicate API calls
 */

import { useCallback } from 'react';
import { useHashtagData } from '@/contexts/HashtagDataProvider';

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
  
  // Colors (from context)
  hashtagColors: any[];
  refreshColors: () => Promise<void>;
  
  // Categories (from context)
  categories: any[];
  refreshCategories: () => Promise<void>;
  
  // Utility functions
  getAllHashtags: () => Promise<string[]>;
  getHashtagColor: (hashtag: string) => string | undefined;
  getCategoryColor: (categoryName: string) => string | undefined;
}

export default function useHashtags(): UseHashtagsReturn {
  // Use context for colors and categories data
  const {
    hashtagColors,
    categories,
    getHashtagColor,
    getCategoryColor,
    refreshColors,
    refreshCategories
  } = useHashtagData();

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

  return {
    // Search and suggestions
    searchHashtags,
    getSuggestions,
    
    // Validation
    validateHashtag,
    
    // Colors (from context)
    hashtagColors,
    refreshColors,
    
    // Categories (from context)
    categories,
    refreshCategories,
    
    // Utility functions
    getAllHashtags,
    getHashtagColor,
    getCategoryColor
  };
}
