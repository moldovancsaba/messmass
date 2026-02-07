'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const STORAGE_KEY = 'mm-sidebar-collapsed';

/**
 * What: Sidebar state management context for admin layout system
 * Why: Provides shared state between Sidebar component and AdminLayout to coordinate:
 *      - Desktop/tablet collapse/expand behavior (tokens: --mm-sidebar-width ↔ --mm-sidebar-width-collapsed)
 *      - Mobile overlay drawer open/close state
 *      - Main content margin adjustments based on sidebar width
 * 
 * Architecture:
 *      - isCollapsed persisted in localStorage (SSR-safe: read only in useEffect)
 *      - Type-safe with TypeScript interfaces
 *      - Provider wraps entire admin layout in app/admin/layout.tsx
 * 
 * OPS-ADMIN-01: Persist sidebar collapse state with SSR-safe localStorage guards.
 */

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setCollapsedState] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  /* OPS-ADMIN-01: Hydrate collapse state from localStorage (client-only, SSR-safe) */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCollapsedState(stored === 'true');
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setCollapsedState(collapsed);
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        isMobileOpen,
        setIsMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
