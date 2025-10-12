'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/* WHAT: Sidebar state context for managing collapse/expand state
 * WHY: Share sidebar state between Sidebar component and AdminLayout
 *      so main content can adjust margins when sidebar collapses/expands */

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
