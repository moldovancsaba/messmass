'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ActionIcon, NavLink as MantineNavLink, ScrollArea, Text } from '@mantine/core';
import { IconMenu2, IconX } from '@tabler/icons-react';
import styles from './Sidebar.module.css';
import packageJson from '../package.json';
import { useSidebar } from '@/contexts/SidebarContext';
import MaterialIcon from '@/components/MaterialIcon';
import { canAccessMenuItem } from '@/lib/permissions';
import type { UserRole } from '@/lib/users';
import { adminNavSections, getSidebarNavGroups } from '@/lib/adminNavigation';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [loadingRole, setLoadingRole] = useState(true);
  const currentYear = new Date().getFullYear();
  
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
  
  const isActive = (path: string) => {
    if (path === '/admin' || path === '/admin/analytics') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const isGroupActive = (path: string, childrenPaths: string[]) => {
    return isActive(path) || childrenPaths.some((childPath) => isActive(childPath));
  };
  
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, setIsMobileOpen]);
  
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
      <ActionIcon
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileOpen}
        aria-controls="sidebar"
        color="gray"
        radius="md"
        size="lg"
        variant="default"
      >
        {isMobileOpen ? <IconX size={20} stroke={1.8} /> : <IconMenu2 size={20} stroke={1.8} />}
      </ActionIcon>
      
      {isMobileOpen && (
        <div 
          className={styles.mobileScrim}
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      
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
      
      <aside
        id="sidebar"
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.logo}>
            <Image src="/messmass-logo.png" alt="{messmass}" className={styles.logoImage} width={32} height={32} priority />
            
            {!isCollapsed && (
              <span className={styles.logoText}>messmass</span>
            )}
          </Link>
        </div>
        
        <ScrollArea className={styles.sidebarNav}>
        <nav>
          {adminNavSections.map((section) => {
            const visibleItems = section.items.filter(item => 
              !loadingRole && canAccessMenuItem(userRole, item.label)
            );
            
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
