/* WHAT: Hook to fetch and apply report styles (v12.0.0+)
 * WHY: Reports can have custom styling themes via styleId
 * HOW: Fetch style from NEW /api/report-styles, inject 26 CSS variables */

'use client';

import { useEffect, useState } from 'react';
import { ReportStyle, injectStyleAsCSS, removeStyleCSS } from '@/lib/reportStyleTypes';

interface UseReportStyleOptions {
  styleId?: string | null;
  enabled?: boolean;
  fallbackToGlobal?: boolean; // Default: false (no fallback for new system)
}

interface UseReportStyleReturn {
  style: ReportStyle | null;
  loading: boolean;
  error: string | null;
}

/**
 * WHAT: Custom hook to fetch and apply NEW report styles (26 colors)
 * WHY: Reports need custom theming based on report.styleId
 * HOW: Fetch from /api/report-styles, inject CSS variables via injectStyleAsCSS
 * 
 * @param styleId - MongoDB ObjectId of ReportStyle
 * @param enabled - Whether to fetch and apply style (default: true)
 * @param fallbackToGlobal - Whether to fetch first available style if no styleId (default: false)
 * @returns Style object, loading state, and error
 * 
 * @example
 * ```tsx
 * const { style, loading, error } = useReportStyle({ styleId: report.styleId });
 * ```
 */
export function useReportStyle({ 
  styleId, 
  enabled = true,
  fallbackToGlobal = false
}: UseReportStyleOptions = {}): UseReportStyleReturn {
  const [style, setStyle] = useState<ReportStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchById = async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        // WHAT: Fetch from NEW /api/report-styles endpoint
        // WHY: Use new 26-color system instead of old PageStyleEnhanced
        const response = await fetch(`/api/report-styles/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !data.style) {
          // WHAT: Fallback to first available style when specified style not found
          // WHY: Reports should still render with default styling instead of failing
          console.warn('⚠️ Style not found, falling back to first available:', id);
          await fetchFirstAvailable();
          return;
        }
        setStyle(data.style);
        injectStyleAsCSS(data.style);
        console.log('✅ Applied report style:', data.style.name, 'with 26 colors');
      } catch (err) {
        console.error('❌ Failed to fetch report style by id, falling back to first available:', err);
        // WHAT: Fallback instead of throwing error
        // WHY: Reports must render even if specified style is missing
        try {
          await fetchFirstAvailable();
        } catch (fallbackErr) {
          // Only set error if fallback also fails
          setError(fallbackErr instanceof Error ? fallbackErr.message : 'Failed to load any style');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchFirstAvailable = async () => {
      setLoading(true);
      setError(null);
      try {
        // WHAT: Fetch first available style from NEW system
        // WHY: Fallback when no styleId specified
        const response = await fetch('/api/report-styles', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.styles) || data.styles.length === 0) {
          throw new Error(data.error || 'No styles available');
        }
        const firstStyle = data.styles[0];
        setStyle(firstStyle);
        injectStyleAsCSS(firstStyle);
        console.log('✅ Applied first available style:', firstStyle.name);
      } catch (err) {
        console.error('❌ Failed to fetch fallback style:', err);
        setError(err instanceof Error ? err.message : 'Failed to load default style');
      } finally {
        setLoading(false);
      }
    };

    if (styleId) {
      console.log('🎨 [useReportStyle] Fetching style by id:', styleId);
      fetchById(styleId);
    } else if (fallbackToGlobal) {
      console.log('🎨 [useReportStyle] No styleId — fetching first available style');
      fetchFirstAvailable();
    } else {
      console.log('🎨 [useReportStyle] No styleId and fallbackToGlobal=false — skipping style fetch');
    }

    // Cleanup: Remove CSS variables when component unmounts
    return () => {
      removeStyleCSS();
    };
  }, [styleId, enabled, fallbackToGlobal]);

  return { style, loading, error };
}

// REMOVED: Old applyStyleToPage() function - now using injectStyleAsCSS() from reportStyleTypes.ts
