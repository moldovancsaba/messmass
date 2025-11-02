// lib/adminViewState.ts
// WHAT: View mode persistence and state management for admin pages
// WHY: Centralized logic for localStorage persistence, URL sync, and view mode defaults
// USAGE: Import hooks and helpers to manage list/card view state consistently

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type ViewMode = 'list' | 'card';

/**
 * WHAT: Get persisted view mode from localStorage
 * WHY: Remember user's view preference per page
 * 
 * @param pageName - Unique page identifier (e.g., 'partners', 'projects')
 * @param defaultView - Fallback view mode if no preference stored
 * @returns Stored view mode or default
 */
export function getPersistedViewMode(
  pageName: string,
  defaultView: ViewMode = 'list'
): ViewMode {
  if (typeof window === 'undefined') return defaultView;
  
  try {
    const key = `admin_view_mode_${pageName}`;
    const stored = localStorage.getItem(key);
    if (stored === 'list' || stored === 'card') {
      return stored;
    }
  } catch (err) {
    console.warn('Failed to read view mode from localStorage:', err);
  }
  
  return defaultView;
}

/**
 * WHAT: Persist view mode to localStorage
 * WHY: Save user's view preference for next visit
 * 
 * @param pageName - Unique page identifier
 * @param viewMode - View mode to persist
 */
export function persistViewMode(pageName: string, viewMode: ViewMode): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `admin_view_mode_${pageName}`;
    localStorage.setItem(key, viewMode);
  } catch (err) {
    console.warn('Failed to save view mode to localStorage:', err);
  }
}

/**
 * WHAT: Custom hook for managing view mode state with persistence
 * WHY: Encapsulates localStorage logic and provides React state management
 * 
 * @param pageName - Unique page identifier
 * @param defaultView - Default view mode (fallback)
 * @returns [viewMode, setViewMode] tuple
 * 
 * @example
 * const [viewMode, setViewMode] = useViewMode('partners', 'list');
 */
export function useViewMode(
  pageName: string,
  defaultView: ViewMode = 'list'
): [ViewMode, (mode: ViewMode) => void] {
  // WHAT: Initialize state from localStorage or URL param
  // WHY: URL param takes precedence for shareable links
  const searchParams = useSearchParams();
  const urlView = searchParams?.get('view') as ViewMode | null;
  
  const [viewMode, setViewModeInternal] = useState<ViewMode>(() => {
    // Priority: URL param > localStorage > default
    if (urlView === 'list' || urlView === 'card') {
      return urlView;
    }
    return getPersistedViewMode(pageName, defaultView);
  });

  // WHAT: Wrapper that persists to localStorage and syncs to URL
  // WHY: Single function handles all state updates
  const setViewMode = (mode: ViewMode) => {
    setViewModeInternal(mode);
    persistViewMode(pageName, mode);
  };

  // WHAT: Sync URL param changes to state
  // WHY: Handle browser back/forward navigation
  useEffect(() => {
    if (urlView === 'list' || urlView === 'card') {
      setViewModeInternal(urlView);
    }
  }, [urlView]);

  return [viewMode, setViewMode];
}

/**
 * WHAT: Update URL query param without navigation
 * WHY: Make view mode shareable via URL while preserving other params
 * 
 * @param router - Next.js router instance
 * @param pathname - Current pathname
 * @param searchParams - Current search params
 * @param viewMode - View mode to sync to URL
 */
export function syncViewModeToUrl(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  searchParams: URLSearchParams | null,
  viewMode: ViewMode
): void {
  const params = new URLSearchParams(Array.from(searchParams?.entries() || []));
  params.set('view', viewMode);
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
}

/**
 * WHAT: Custom hook for complete view mode management with URL sync
 * WHY: All-in-one hook for pages that want URL persistence
 * 
 * @param pageName - Unique page identifier
 * @param defaultView - Default view mode
 * @param syncToUrl - Whether to sync view mode to URL query params
 * @returns [viewMode, setViewMode] tuple with automatic URL sync
 * 
 * @example
 * const [viewMode, setViewMode] = useViewModeWithUrlSync('partners', 'list', true);
 */
export function useViewModeWithUrlSync(
  pageName: string,
  defaultView: ViewMode = 'list',
  syncToUrl: boolean = true
): [ViewMode, (mode: ViewMode) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useViewMode(pageName, defaultView);

  // WHAT: Wrapper that also syncs to URL if enabled
  // WHY: Optional URL sync for shareable links
  const setViewModeWithSync = (mode: ViewMode) => {
    setViewMode(mode);
    if (syncToUrl) {
      syncViewModeToUrl(router, pathname, searchParams, mode);
    }
  };

  return [viewMode, setViewModeWithSync];
}
