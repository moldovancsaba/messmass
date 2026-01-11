/* WHAT: Hook to fetch available fonts from MongoDB
 * WHY: Centralized font management, no hardcoding
 * HOW: Fetch from /api/available-fonts, cache for performance */

'use client';

import { useEffect, useState } from 'react';
import { AvailableFont } from '@/lib/fontTypes';

interface UseAvailableFontsReturn {
  fonts: AvailableFont[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * WHAT: Custom hook to fetch available fonts
 * WHY: Dynamic font list from MongoDB, no hardcoding
 * HOW: Fetch from /api/available-fonts, cache in component state
 * 
 * @param includeInactive - Whether to include inactive fonts (default: false)
 * @returns Fonts array, loading state, error, and refetch function
 * 
 * @example
 * ```tsx
 * const { fonts, loading, error } = useAvailableFonts();
 * ```
 */
export function useAvailableFonts(includeInactive = false): UseAvailableFontsReturn {
  const [fonts, setFonts] = useState<AvailableFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFonts = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = includeInactive 
        ? '/api/available-fonts?includeInactive=true'
        : '/api/available-fonts';
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch fonts');
      }
      
      setFonts(data.fonts || []);
    } catch (err) {
      console.error('Failed to fetch available fonts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load fonts');
      // WHAT: Set empty array on error to prevent crashes
      // WHY: Components should handle empty font list gracefully
      setFonts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFonts();
  }, [includeInactive]);

  return {
    fonts,
    loading,
    error,
    refetch: fetchFonts
  };
}

