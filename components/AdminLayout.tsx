'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import styles from './AdminLayout.module.css';
import { useSidebar } from '@/contexts/SidebarContext';

/* What: AdminLayout wrapper for all admin pages
   Why: Consistent layout with sidebar and header across admin section
   
   Structure:
   - Fixed Sidebar on left
   - TopHeader at top (accounts for sidebar width)
   - Main content area with proper margins */

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  /* WHAT: Access sidebar collapse state from context
   * WHY: Adjust main content margin when sidebar expands/collapses */
  const { isCollapsed } = useSidebar();
  
  return (
    <div className={styles.adminLayout}>
      {/* What: Fixed sidebar navigation
         Why: Persistent navigation across all admin pages */}
      <Sidebar />
      
      {/* What: Main content wrapper with dynamic margin based on sidebar state
         Why: Content expands to fill available width when sidebar collapses */}
      <div className={`${styles.mainWrapper} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* What: Top header with user info
           Why: Consistent header across admin pages */}
        <TopHeader user={user} />
        
        {/* What: Main content area
           Why: Page-specific content renders here */}
        <main className={styles.mainContent}>
          {children}
        </main>
        
        {/* WHAT: Footer removed from main content area
           WHY: Single unified footer in Sidebar only - avoids duplicate footers */}
      </div>
    </div>
  );
}
