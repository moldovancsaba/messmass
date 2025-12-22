// components/RoleDropdown.tsx
// WHAT: Dropdown component for superadmins to change user roles
// WHY: Enable quick role promotion/demotion from Users page
// HOW: Fetches current user, validates superadmin, prevents self-demotion

'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { UserRole } from '@/lib/users';
import { getRoleBadgeColor, getRoleDisplayName } from '@/lib/permissions';

interface RoleDropdownProps {
  userId: string;
  currentRole: UserRole;
  currentUserRole: UserRole | undefined;
  currentUserId: string | undefined;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
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
  disabled = false,
}: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // WHAT: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // WHAT: Check if current user is superadmin
  // WHY: Only superadmins can change roles
  const isSuperadmin = currentUserRole === 'superadmin';
  const isSelf = userId === currentUserId;
  
  // WHAT: Available roles for dropdown
  const roles: UserRole[] = ['guest', 'user', 'admin', 'superadmin'];
  
  const handleRoleSelect = async (newRole: UserRole) => {
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
      await onRoleChange(userId, newRole);
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
        title={isSelf ? 'Your role (cannot demote yourself)' : 'Click to change role'}
      >
        {currentConfig.icon} {currentConfig.label}
        {!disabled && !changing && <span style={{ marginLeft: '4px' }}>▼</span>} {/* eslint-disable-line react/forbid-dom-props */}
        {changing && <span style={{ marginLeft: '4px' }}>⏳</span>} {/* eslint-disable-line react/forbid-dom-props */}
      </button>
      
      {isOpen && !disabled && !changing && (
        <div
          className="role-dropdown-menu"
          style={{ // eslint-disable-line react/forbid-dom-props
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: 'var(--mm-white)',
            border: '1px solid var(--mm-gray-200)',
            borderRadius: 'var(--mm-radius-md)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
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
        </div>
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
    guest: { bg: '#f3f4f6', color: '#6b7280', icon: '👤', label: 'Guest' },
    user: { bg: '#dbeafe', color: '#1e40af', icon: '👥', label: 'User' },
    admin: { bg: '#d1fae5', color: '#065f46', icon: '🔧', label: 'Admin' },
    superadmin: { bg: '#ede9fe', color: '#5b21b6', icon: '⚡', label: 'Superadmin' },
  };
  return configs[role] || configs.guest;
}
