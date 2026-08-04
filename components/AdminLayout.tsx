'use client';

import React from 'react';
import { Box } from '@mantine/core';
import { OverlayManagerProvider } from '@sovereignsquad/gds-core/client';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import styles from './AdminLayout.module.css';
import { useSidebar } from '@/contexts/SidebarContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    // WHAT: OverlayManagerProvider backs the guided-tour overlay stack (lib/tour/*)
    // WHY: scoped to the admin layout, not the app-wide providers in app/providers.tsx,
    //      since public report pages don't need overlay-manager machinery
    <OverlayManagerProvider>
      <Box className={styles.adminLayout}>
        <a href="#main-content" className={styles.skipToContent}>
          Skip to main content
        </a>
        <Sidebar />

        <Box className={`${styles.mainWrapper} ${isCollapsed ? styles.collapsed : ''}`}>
          <TopHeader user={user} />

          <Box component="main" id="main-content" className={`${styles.mainContent} content-surface`} tabIndex={-1}>
            {children}
          </Box>
        </Box>
      </Box>
    </OverlayManagerProvider>
  );
}
