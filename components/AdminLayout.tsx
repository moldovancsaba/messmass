'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mantine/core';
import { OverlayManagerProvider } from '@sovereignsquad/gds-core/client';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import styles from './AdminLayout.module.css';
import { useSidebar } from '@/contexts/SidebarContext';

const PUBLIC_AUTH_PATHS = new Set([
  '/admin/login',
  '/admin/register',
  '/admin/clear-session',
  '/admin/unauthorized',
]);

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  if (pathname && PUBLIC_AUTH_PATHS.has(pathname)) {
    return (
      <Box component="main" id="main-content" tabIndex={-1}>
        {children}
      </Box>
    );
  }

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
