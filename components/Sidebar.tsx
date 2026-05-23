'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ActionIcon, NavLink as MantineNavLink, ScrollArea, Text } from '@mantine/core';
import styles from './Sidebar.module.css';
import packageJson from '../package.json';
import { useSidebar } from '@/contexts/SidebarContext';
import MaterialIcon from '@/components/MaterialIcon';
import { canAccessMenuItem } from '@/lib/permissions';
import type { UserRole } from '@/lib/users';
import { adminNavSections, getSidebarNavGroups } from '@/lib/adminNavigation';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* What: Navigation item structure
   Why: Type-safe navigation configuration with Material Icons */
/* What: Responsive sidebar component for admin navigation with role-based filtering
   Why: TailAdmin V2-inspired sidebar with desktop/tablet/mobile variants
   
   Behavior:
   - Desktop (≥1280px): Full-width sidebar with section groups
   - Tablet (768-1279px): Collapsed mini variant (icons only)
   - Mobile (<768px): Overlay drawer with scrim, hamburger toggle
   - Menu items filtered by user role (guest → user → admin → superadmin)
   
   No breadcrumbs (explicitly prohibited by policy) */
export default function Sidebar() {
  const pathname = usePathname();
  /* WHAT: Use shared sidebar context instead of local state
   * WHY: AdminLayout needs to know collapse state to adjust main content margin */
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  
  // WHAT: Track user role for menu filtering
  // WHY: Show only menu items user has permission to access
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [loadingRole, setLoadingRole] = useState(true);
  const currentYear = new Date().getFullYear();
  
  // WHAT: Fetch user role on component mount
  // WHY: Determine which menu items to show
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/admin/auth', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role) {
            setUserRole(data.user.role as UserRole);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      } finally {
        setLoadingRole(false);
      }
    };
    
    fetchUserRole();
  }, []);
  
  /* WHAT: Reorganized navigation structure per user requirements
     WHY: More intuitive order - removed Dashboard (logo serves same purpose),
          grouped logically from core content to admin tools */
  /* What: Check if current path matches nav item
     Why: Highlight active navigation item for user orientation */
  const isActive = (path: string) => {
    if (path === '/admin' || path === '/admin/analytics') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const isGroupActive = (path: string, childrenPaths: string[]) => {
    return isActive(path) || childrenPaths.some((childPath) => isActive(childPath));
  };
  
  /* What: Close mobile drawer on route change
     Why: Better UX - user expects drawer to close after navigation */
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);
  
  /* What: Close drawer on Escape key
     Why: Accessibility requirement for modal-like overlays */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, setIsMobileOpen]);
  
  /* What: Prevent body scroll when mobile drawer is open
     Why: Better UX - focus on drawer, prevent background scrolling */
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  /* OPS-ADMIN-01: Focus trap when mobile drawer is open – keep focus inside sidebar */
  const sidebarRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!isMobileOpen) return;
    const el = document.getElementById('sidebar');
    sidebarRef.current = el;
    const focusables = el ? Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (first) first.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const target = document.activeElement as HTMLElement | null;
      if (!el?.contains(target)) return;
      if (e.shiftKey) {
        if (target === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (target === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  return (
    <>
      {/* What: Mobile hamburger button
         Why: Toggle drawer on mobile devices */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileOpen}
        aria-controls="sidebar"
      >
        <span className={styles.hamburger}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      
      {/* What: Mobile overlay scrim
         Why: Dim background when drawer is open, click to close */}
      {isMobileOpen && (
        <div 
          className={styles.mobileScrim}
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* WHAT: Desktop/tablet collapse toggle - positioned OUTSIDE sidebar
          WHY: Better UX - clearer affordance for sidebar control */}
      <div
        className={`${styles.collapseToggle} ${isCollapsed ? styles.collapseToggleCollapsed : ''}`}
      >
        <ActionIcon
          variant="default"
          radius="md"
          color="gray"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '»' : '«'}
        </ActionIcon>
      </div>
      
      {/* What: Main sidebar navigation
         Why: Core navigation structure with responsive behavior */}
      <aside
        id="sidebar"
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* What: Sidebar header with logo and collapse toggle
           Why: Branding and responsive control */}
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.logo}>
            {/* WHAT: Logo icon stays same size in both states
                WHY: Visual consistency - only text hides on collapse */}
            <Image src="/messmass-logo.png" alt="{messmass}" className={styles.logoImage} width={32} height={32} priority />
            
            {/* WHAT: 'messmass' text in Pacifico font, only visible when expanded
                WHY: User-requested branding with Google Font */}
            {!isCollapsed && (
              <span className={styles.logoText}>messmass</span>
            )}
          </Link>
        </div>
        
        {/* What: Scrollable navigation sections with role-based filtering
           Why: Handle many nav items without overflow issues, show only authorized items */}
        <ScrollArea className={styles.sidebarNav}>
        <nav>
          {adminNavSections.map((section) => {
            // WHAT: Filter section items based on user role permissions
            // WHY: Only show menu items user has access to
            const visibleItems = section.items.filter(item => 
              !loadingRole && canAccessMenuItem(userRole, item.label)
            );
            
            // WHAT: Skip entire section if no items are visible
            // WHY: Avoid empty sections in navigation
            if (visibleItems.length === 0) {
              return null;
            }
            
            const visibleSection = {
              ...section,
              items: visibleItems,
            };
            const navGroups = getSidebarNavGroups(visibleSection);

            return (
              <div key={section.title} className={styles.navSection}>
                {!isCollapsed && (
                  <div className={styles.sectionTitle}>{section.title}</div>
                )}
                
                <ul className={styles.navList}>
                  {navGroups.map((group) => {
                    const groupActive = isGroupActive(group.parent.path, group.children.map((child) => child.path));
                    return (
                    <li key={group.parent.path} className={styles.navItem}>
                      <MantineNavLink
                        component={Link}
                        href={group.parent.path}
                        className={`${styles.navLink} ${groupActive ? styles.active : ''}`}
                        label={!isCollapsed ? group.parent.label : undefined}
                        leftSection={
                          <span className={styles.navIcon}>
                            <MaterialIcon
                              name={group.parent.icon}
                              variant={group.parent.iconVariant || 'outlined'}
                              className={styles.materialIcon}
                            />
                          </span>
                        }
                        rightSection={groupActive && !isCollapsed ? <span className={styles.activeIndicator} aria-label="Current page" /> : undefined}
                        active={groupActive}
                        title={isCollapsed ? group.parent.label : undefined}
                        aria-current={isActive(group.parent.path) ? 'page' : undefined}
                      />
                      {!isCollapsed && group.children.length > 0 && (
                        <ul className={styles.childList} aria-label={`${group.parent.label} submenu`}>
                          {group.children.map((child) => (
                            <li key={child.path}>
                              <MantineNavLink
                                component={Link}
                                href={child.path}
                                className={`${styles.childLink} ${isActive(child.path) ? styles.childLinkActive : ''}`}
                                label={child.label}
                                leftSection={
                                  <>
                                    <span className={styles.childLinkLine} aria-hidden="true" />
                                    <span className={styles.navIcon}>
                                      <MaterialIcon
                                        name={child.icon}
                                        variant={child.iconVariant || 'outlined'}
                                        className={styles.materialIcon}
                                      />
                                    </span>
                                  </>
                                }
                                rightSection={isActive(child.path) ? <span className={styles.activeIndicator} aria-label="Current page" /> : undefined}
                                active={isActive(child.path)}
                                aria-current={isActive(child.path) ? 'page' : undefined}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )})}
                </ul>
              </div>
            );
          })}
        </nav>
        </ScrollArea>
        
        {/* WHAT: Unified footer with copyright and auto-updated version from package.json
           WHY: Single source of truth - reads version dynamically, avoids hardcoded duplicates */}
        <div className={styles.sidebarFooter}>
          {!isCollapsed && (
            <>
              <div className={styles.footerText}>
                © {currentYear} {'{messmass}'}
              </div>
              <div className={styles.versionInfo}>
                <Text className={styles.versionLabel}>Version</Text>
                <Text className={styles.versionNumber}>v{packageJson.version}</Text>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
