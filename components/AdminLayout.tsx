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
      {/* OPS-ADMIN-01: Skip to main content for keyboard/screen reader users (WCAG 2.4.1) */}
      <a href="#main-content" className={styles.skipToContent}>
        Skip to main content
      </a>
      <Sidebar />
      
      <div className={`${styles.mainWrapper} ${isCollapsed ? styles.collapsed : ''}`}>
        <TopHeader user={user} />
        
        <main id="main-content" className={`${styles.mainContent} content-surface`} tabIndex={-1}>
          {children}
        </main>
        
        {/* WHAT: Footer removed from main content area
           WHY: Single unified footer in Sidebar only - avoids duplicate footers */}
      </div>
    </div>
  );
}
