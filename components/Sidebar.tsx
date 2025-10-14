'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import packageJson from '../package.json';
import { useSidebar } from '@/contexts/SidebarContext';

/* What: Navigation item structure
   Why: Type-safe navigation configuration with icons and paths */
interface NavItem {
  label: string;
  path: string;
  icon: string; // emoji for now, can be replaced with icon library later
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/* What: Responsive sidebar component for admin navigation
   Why: TailAdmin V2-inspired sidebar with desktop/tablet/mobile variants
   
   Behavior:
   - Desktop (≥1280px): Full-width sidebar with section groups
   - Tablet (768-1279px): Collapsed mini variant (icons only)
   - Mobile (<768px): Overlay drawer with scrim, hamburger toggle
   
   No breadcrumbs (explicitly prohibited by policy) */
export default function Sidebar() {
  const pathname = usePathname();
  /* WHAT: Use shared sidebar context instead of local state
   * WHY: AdminLayout needs to know collapse state to adjust main content margin */
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  
  /* What: Navigation structure organized by functional sections
     Why: Logical grouping makes it easier to find admin features */
  const navSections: NavSection[] = [
    {
      title: 'Content',
      items: [
        { label: 'Dashboard', path: '/admin', icon: '📊' },
        { label: 'Manage Projects', path: '/admin/projects', icon: '🍿' },
        { label: 'Partner Management', path: '/admin/partners', icon: '🤝' },
        { label: 'Quick Add', path: '/admin/quick-add', icon: '⚡' },
        { label: 'Hashtag Filter', path: '/admin/filter', icon: '🔍' },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Hashtag Manager', path: '/admin/hashtags', icon: '🏷️' },
        { label: 'Category Manager', path: '/admin/categories', icon: '🌍' },
        { label: 'Chart Algorithm Manager', path: '/admin/charts', icon: '📈' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'Variable Manager', path: '/admin/variables', icon: '🔢' },
        { label: 'Visualization Manager', path: '/admin/visualization', icon: '👁️' },
        { label: 'Design Manager', path: '/admin/design', icon: '🎨' },
        { label: 'Bitly Management', path: '/admin/bitly', icon: '🔗' },
        { label: 'Users', path: '/admin/users', icon: '👥' },
        { label: 'Cache Management', path: '/admin/cache', icon: '🗑️' },
      ],
    },
    {
      title: 'Help',
      items: [
        { label: 'User Guide', path: '/admin/help', icon: '📖' },
      ],
    },
  ];
  
  /* What: Check if current path matches nav item
     Why: Highlight active navigation item for user orientation */
  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(path);
  };
  
  /* What: Close mobile drawer on route change
     Why: Better UX - user expects drawer to close after navigation */
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);
  
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
  }, [isMobileOpen]);
  
  /* What: Prevent body scroll when mobile drawer is open
     Why: Better UX - focus on drawer, prevent background scrolling */
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
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
            {!isCollapsed && <span className={styles.logoText}>MessMass</span>}
            {isCollapsed && <span className={styles.logoIcon}>MM</span>}
          </Link>
          
          {/* What: Desktop/tablet collapse toggle
             Why: Allow users to maximize content area */}
          <button
            className={styles.collapseToggle}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '»' : '«'}
          </button>
        </div>
        
        {/* What: Scrollable navigation sections
           Why: Handle many nav items without overflow issues */}
        <nav className={styles.sidebarNav}>
          {navSections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              {!isCollapsed && (
                <h3 className={styles.sectionTitle}>{section.title}</h3>
              )}
              
              <ul className={styles.navList}>
                {section.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`${styles.navLink} ${isActive(item.path) ? styles.active : ''}`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <span className={styles.navIcon}>{item.icon}</span>
                      {!isCollapsed && (
                        <span className={styles.navLabel}>{item.label}</span>
                      )}
                      {isActive(item.path) && !isCollapsed && (
                        <span className={styles.activeIndicator} aria-label="Current page" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        
        {/* WHAT: Unified footer with copyright and auto-updated version from package.json
           WHY: Single source of truth - reads version dynamically, avoids hardcoded duplicates */}
        <div className={styles.sidebarFooter}>
          {!isCollapsed && (
            <>
              <div className={styles.footerText}>
                © 2025 MessMass. All rights reserved.
              </div>
              <div className={styles.versionInfo}>
                <span className={styles.versionLabel}>Version</span>
                <span className={styles.versionNumber}>v{packageJson.version}</span>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
