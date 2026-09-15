// components/RoleDropdown.tsx
// WHAT: Dropdown component for superadmins to change user roles
// WHY: Enable quick role promotion/demotion from Users page
// HOW: Fetches current user, validates superadmin, prevents self-demotion

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { UserRole } from '@/lib/users';
import { getRoleBadgeColor, getRoleDisplayName } from '@/lib/permissions';

interface RoleDropdownProps {
  userId: string;
  currentRole: UserRole;
  currentUserRole: UserRole | undefined;
  currentUserId: string | undefined;
  onRoleChange: (userId: string, newRole: UserRole, followSso?: boolean) => Promise<void>;
  /** True when a superadmin pinned this role locally, so SSO will not rewrite it. */
  roleManagedLocally?: boolean;
  disabled?: boolean;
}

/**
 * WHAT: Role dropdown with permission-based visibility
 * WHY: Only superadmins can change roles, prevent self-demotion
 */
export default function RoleDropdown({
  userId,
  currentRole,
  currentUserRole,
  currentUserId,
  onRoleChange,
  roleManagedLocally = false,
  disabled = false,
}: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // WHAT: Viewport coordinates for the portalled menu.
  // WHY: The menu used to be a positioned child of the table cell, so the row
  //   below painted over it and the cell clipped it -- it was unusable in a
  //   table. Rendering it into document.body with fixed coordinates removes it
  //   from every ancestor's clipping and stacking context.
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const placeMenu = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const MENU_W = 180;
    const MENU_H = 220;
    // Flip above the trigger when there is not enough room below.
    const below = window.innerHeight - r.bottom;
    const top = below < MENU_H && r.top > MENU_H ? r.top - MENU_H - 4 : r.bottom + 4;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - MENU_W - 8));
    setMenuPos({ top, left });
  }, []);
  
  // WHAT: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      // the menu lives in a portal, so it is not inside dropdownRef
      if (
        dropdownRef.current && !dropdownRef.current.contains(t) &&
        !(menuRef.current && menuRef.current.contains(t))
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    placeMenu();
    const onMove = () => placeMenu();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [isOpen, placeMenu]);
  
  // WHAT: Check if current user is superadmin
  // WHY: Only superadmins can change roles
  const isSuperadmin = currentUserRole === 'superadmin';
  const isSelf = userId === currentUserId;
  
  // WHAT: Available roles for dropdown
  const roles: UserRole[] = ['guest', 'user', 'admin', 'superadmin'];
  
  const handleRoleSelect = async (newRole: UserRole, followSso = false) => {
    if (newRole === currentRole) {
      setIsOpen(false);
      return;
    }
    
    // WHAT: Prevent self-demotion
    if (isSelf && newRole !== 'superadmin') {
      alert('You cannot demote yourself. Ask another superadmin to change your role.');
      setIsOpen(false);
      return;
    }
    
    setChanging(true);
    try {
      await onRoleChange(userId, newRole, followSso);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change role:', error);
    } finally {
      setChanging(false);
    }
  };
  
  // WHAT: Render read-only badge if not superadmin
  if (!isSuperadmin) {
    const config = getRoleConfig(currentRole);
    return (
      <span
        className="role-badge"
        style={{ // eslint-disable-line react/forbid-dom-props
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: 500,
          backgroundColor: config.bg,
          color: config.color,
          display: 'inline-block',
        }}
      >
        {config.icon} {config.label}
      </span>
    );
  }
  
  // WHAT: Render interactive dropdown for superadmins
  const currentConfig = getRoleConfig(currentRole);
  
  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}> {/* eslint-disable-line react/forbid-dom-props */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && !changing && setIsOpen(!isOpen)}
        disabled={disabled || changing}
        className="role-dropdown-trigger"
        style={{ // eslint-disable-line react/forbid-dom-props
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: 500,
          backgroundColor: currentConfig.bg,
          color: currentConfig.color,
          border: 'none',
          cursor: disabled || changing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          opacity: disabled || changing ? 0.6 : 1,
        }}
        title={
          isSelf
            ? 'Your role (cannot demote yourself)'
            : roleManagedLocally
              ? 'Pinned in messmass — SSO will not change it'
              : 'Managed by SSO — resets to the SSO role at this user\'s next sign-in'
        }
      >
        {currentConfig.icon} {currentConfig.label}
        {roleManagedLocally && <span style={{ marginLeft: '2px' }} aria-label="pinned locally">📌</span>} {/* eslint-disable-line react/forbid-dom-props */}
        {!disabled && !changing && <span style={{ marginLeft: '4px' }}>▼</span>} {/* eslint-disable-line react/forbid-dom-props */}
        {changing && <span style={{ marginLeft: '4px' }}>⏳</span>} {/* eslint-disable-line react/forbid-dom-props */}
      </button>
      
      {isOpen && !disabled && !changing && menuPos && createPortal(
        <div
          ref={menuRef}
          className="role-dropdown-menu z-dropdown"
          style={{ // eslint-disable-line react/forbid-dom-props
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 'var(--mm-z-modal, 1000)',
            backgroundColor: 'var(--mm-white)',
            border: '1px solid var(--mm-gray-200)',
            borderRadius: 'var(--mm-radius-md)',
            boxShadow: 'var(--mm-shadow-lg)',
            minWidth: '140px',
          }}
        >
          {roles.map((role) => {
            const config = getRoleConfig(role);
            const isCurrentRole = role === currentRole;
            const isSelfDemotion = isSelf && role !== 'superadmin';
            
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                disabled={isSelfDemotion}
                className="role-dropdown-item"
                style={{ // eslint-disable-line react/forbid-dom-props
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: isCurrentRole ? 'var(--mm-gray-100)' : 'transparent',
                  color: isSelfDemotion ? 'var(--mm-gray-400)' : config.color,
                  fontSize: '0.875rem',
                  fontWeight: isCurrentRole ? 600 : 400,
                  textAlign: 'left',
                  cursor: isSelfDemotion ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelfDemotion && !isCurrentRole) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'var(--mm-gray-50)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentRole) {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }
                }}
                title={isSelfDemotion ? 'Cannot demote yourself' : `Change role to ${config.label}`}
              >
                {config.icon} {config.label}
                {isCurrentRole && <span style={{ marginLeft: '8px' }}>✓</span>} {/* eslint-disable-line react/forbid-dom-props */}
              </button>
            );
          })}
          {roleManagedLocally && !isSelf && (
            <button
              type="button"
              onClick={() => handleRoleSelect(currentRole, true)}
              className="role-dropdown-item"
              style={{ // eslint-disable-line react/forbid-dom-props
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                borderTop: '1px solid var(--mm-gray-200)',
                backgroundColor: 'transparent',
                color: 'var(--mm-gray-600)',
                fontSize: '0.8125rem',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              title="Stop pinning this role; SSO sets it again at the next sign-in"
            >
              ↩︎ Follow SSO again
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * WHAT: Get role configuration for badge styling
 * WHY: Consistent role colors across dropdown and badges
 */
function getRoleConfig(role: UserRole): { bg: string; color: string; icon: string; label: string } {
  const configs: Record<UserRole, { bg: string; color: string; icon: string; label: string }> = {
    guest: { bg: 'var(--mm-gray-100)', color: 'var(--mm-gray-500)', icon: '👤', label: 'Guest' },
    user: { bg: 'var(--mm-info-light)', color: 'var(--mm-color-primary-800)', icon: '👥', label: 'User' },
    admin: { bg: 'var(--mm-success-light)', color: 'var(--mm-color-secondary-800)', icon: '🔧', label: 'Admin' },
    superadmin: { bg: 'var(--mantine-color-violet-1)', color: 'var(--mantine-color-violet-8)', icon: '⚡', label: 'Superadmin' },
    api: { bg: 'var(--mm-warning-light)', color: 'var(--mantine-color-messmassAmber-7)', icon: '🔑', label: 'API' },
  };
  return configs[role] || configs.guest;
}
