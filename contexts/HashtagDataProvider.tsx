'use client';

/**
 * HashtagDataProvider - Global Context for Hashtag Data
 * 
 * Provides centralized management of hashtag colors and categories to prevent
 * duplicate API requests when multiple components need the same data.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { HashtagCategory } from '@/lib/hashtagCategoryTypes';

interface HashtagColor {
  _id: string;
  uuid: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface HashtagDataContextType {
  // Data
  hashtagColors: HashtagColor[];
  categories: HashtagCategory[];
  
  // Loading states
  loadingColors: boolean;
  loadingCategories: boolean;
  
  // Utility functions
  getHashtagColor: (hashtag: string) => string | undefined;
  getCategoryColor: (categoryName: string) => string | undefined;
  
  // Refresh functions
  refreshColors: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const HashtagDataContext = createContext<HashtagDataContextType | null>(null);

interface HashtagDataProviderProps {
  children: ReactNode;
}

// Global flags to prevent duplicate requests
let isLoadingColors = false;
let isLoadingCategories = false;

export function HashtagDataProvider({ children }: HashtagDataProviderProps) {
  const [hashtagColors, setHashtagColors] = useState<HashtagColor[]>([]);
  const [categories, setCategories] = useState<HashtagCategory[]>([]);
  const [loadingColors, setLoadingColors] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Load hashtag colors
  const refreshColors = useCallback(async () => {
    if (isLoadingColors) return; // Prevent duplicate requests
    
    isLoadingColors = true;
    setLoadingColors(true);
    
    try {
      console.log('🔄 Fetching hashtag colors...');
      const response = await fetch(`/api/hashtag-colors?t=${Date.now()}`);
      const data = await response.json();
      
      if (data.success) {
        setHashtagColors(data.hashtagColors);
        console.log('✅ Retrieved hashtag colors:', data.hashtagColors.length);
      } else {
        console.error('❌ Failed to load hashtag colors:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching hashtag colors:', error);
    } finally {
      setLoadingColors(false);
      isLoadingColors = false;
    }
  }, []);

  // Load categories
  const refreshCategories = useCallback(async () => {
    if (isLoadingCategories) return; // Prevent duplicate requests
    
    isLoadingCategories = true;
    setLoadingCategories(true);
    
    try {
      console.log('🔄 Fetching hashtag categories...');
      const response = await fetch('/api/hashtag-categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
        console.log('✅ Retrieved hashtag categories:', data.categories.length);
      } else {
        console.error('❌ Failed to load hashtag categories:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching hashtag categories:', error);
    } finally {
      setLoadingCategories(false);
      isLoadingCategories = false;
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshColors(), refreshCategories()]);
  }, [refreshColors, refreshCategories]);

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

  // Load data on provider mount
  useEffect(() => {
    console.log('🚀 HashtagDataProvider mounted, initializing data...');
    refreshAll();
  }, [refreshAll]);

  const contextValue: HashtagDataContextType = {
    hashtagColors,
    categories,
    loadingColors,
    loadingCategories,
    getHashtagColor,
    getCategoryColor,
    refreshColors,
    refreshCategories,
    refreshAll
  };

  return (
    <HashtagDataContext.Provider value={contextValue}>
      {children}
    </HashtagDataContext.Provider>
  );
}

// Custom hook to use the context
export function useHashtagData(): HashtagDataContextType {
  const context = useContext(HashtagDataContext);
  if (!context) {
    throw new Error('useHashtagData must be used within a HashtagDataProvider');
  }
  return context;
}
