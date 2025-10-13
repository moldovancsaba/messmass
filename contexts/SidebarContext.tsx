'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * What: Sidebar state management context for admin layout system
 * Why: Provides shared state between Sidebar component and AdminLayout to coordinate:
 *      - Desktop/tablet collapse/expand behavior (280px ↔ 80px)
 *      - Mobile overlay drawer open/close state
 *      - Main content margin adjustments based on sidebar width
 *      This centralized approach ensures consistent state across all admin pages without
 *      prop drilling through the layout hierarchy.
 * 
 * Architecture:
 *      - Pure React state (no localStorage for SSR safety)
 *      - Type-safe with TypeScript interfaces
 *      - Custom useSidebar() hook prevents context misuse
 *      - Provider wraps entire admin layout in app/admin/layout.tsx
 * 
 * Responsive Behavior:
 *      - Desktop (≥1280px): User can toggle between 280px (expanded) and 80px (collapsed)
 *      - Tablet (768-1279px): Auto-collapsed to 80px, isCollapsed state affects styling
 *      - Mobile (<768px): isMobileOpen controls overlay drawer visibility
 * 
 * Version: 5.49.3
 * Last Updated: 2025-10-12T19:30:00.000Z
 * Status: Stable, production-ready
 * Review: See CODE_REVIEW_FINDINGS_ADMIN_LAYOUT.md
 */

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/* WHAT: Hook to access sidebar context
 * WHY: Provides type-safe access to sidebar state and setters */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

/* WHAT: Provider component for sidebar state
 * WHY: Wraps admin layout to provide sidebar state to all children */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
