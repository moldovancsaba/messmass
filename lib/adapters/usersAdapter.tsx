// lib/adapters/usersAdapter.tsx
// WHAT: Adapter configuration for Users admin page
// WHY: Defines list/card view structure for user management
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';
import SemanticBadge from '@/components/SemanticBadge';

// WHAT: User data type (placeholder - adjust based on actual user schema)
interface UserDTO {
  _id: string;
  email: string;
  role: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  // WHAT: API access fields (v10.6.0+)
  // WHY: Track API key usage and status for external integrations
  apiKeyEnabled?: boolean;
  apiUsageCount?: number;
  lastAPICallAt?: string;
}

const roleConfig: Record<
  string,
  { tone: 'secondary' | 'info' | 'success' | 'primary'; icon: string; label: string }
> = {
  guest: { tone: 'secondary', icon: '👤', label: 'Guest' },
  user: { tone: 'info', icon: '👥', label: 'User' },
  admin: { tone: 'success', icon: '🔧', label: 'Admin' },
  superadmin: { tone: 'primary', icon: '⚡', label: 'Superadmin' },
  api: { tone: 'success', icon: '🔑', label: 'API' },
};

/**
 * WHAT: Complete adapter configuration for Users page
 * WHY: Single source of truth for how users are displayed
 */
export const usersAdapter: AdminPageAdapter<UserDTO> = {
  pageName: 'users',
  defaultView: 'list',
  
  listConfig: {
    columns: [
      {
        key: 'email',
        label: 'Email',
        sortable: true,
        minWidth: '200px',
        render: (user) => (
          <span className="adapter-primary-field">{user.email}</span>
        ),
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        minWidth: '150px',
        render: (user) => user.name || <span className="adapter-empty-value">—</span>,
      },
      {
        key: 'role',
        label: 'Role',
        sortable: true,
        width: '140px',
        render: (user) => {
          const config = roleConfig[user.role] || roleConfig.guest;
          return <SemanticBadge tone={config.tone} icon={config.icon} label={config.label} />;
        },
      },
      {
        key: 'apiAccess',
        label: 'API Access',
        sortable: false,
        width: '120px',
        render: (user) => (
          <SemanticBadge
            tone={user.apiKeyEnabled ? 'success' : 'secondary'}
            icon={user.apiKeyEnabled ? '✅' : '❌'}
            label={user.apiKeyEnabled ? 'Enabled' : 'Disabled'}
          />
        ),
      },
      {
        key: 'apiUsageCount',
        label: 'API Usage',
        sortable: true,
        width: '110px',
        render: (user) => (
          <span className="adapter-meta-text">
            {(user.apiUsageCount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'lastAPICallAt',
        label: 'Last API Call',
        sortable: true,
        width: '140px',
        render: (user) =>
          user.lastAPICallAt ? (
            <span className="adapter-meta-text">
              {new Date(user.lastAPICallAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="adapter-empty-value">Never</span>
          ),
      },
      {
        key: 'lastLogin',
        label: 'Last Login',
        sortable: true,
        width: '140px',
        render: (user) =>
          user.lastLogin ? (
            <span className="adapter-meta-text">
              {new Date(user.lastLogin).toLocaleDateString()}
            </span>
          ) : (
            <span className="adapter-empty-value">Never</span>
          ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        width: '120px',
        render: (user) => (
          <span className="adapter-meta-text">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    rowActions: [
      {
        label: 'Regenerate',
        icon: 'refresh',
        variant: 'secondary',
        handler: (user) => {
          // WHAT: Regenerate password action (overridden by page component)
          // WHY: Users cannot edit email/name after creation (security)
          console.log('Regenerate password for:', user._id);
        },
        title: 'Regenerate password',
      },
      {
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        handler: (user) => {
          // WHAT: Delete user action (overridden by page component)
          // WHY: Requires confirmation modal before deletion
          console.log('Delete user:', user._id);
        },
        title: 'Delete user',
      },
    ],
  },

  cardConfig: {
    primaryField: 'email',
    secondaryField: (user) => user.name || 'No name set',
    metaFields: [
      {
        key: 'role',
        label: 'Role',
        icon: '👤',
        render: (user) => {
          const icon = user.role === 'api' ? '🔑' : '👤'
          const label = user.role === 'api' ? 'API User' : 'Admin User'
          return `${icon} ${label}`
        },
      },
      {
        key: 'apiAccess',
        label: 'API Access',
        icon: '🔐',
        render: (user) => user.apiKeyEnabled ? '✅ Enabled' : '❌ Disabled',
      },
      {
        key: 'apiUsage',
        label: 'API Usage',
        icon: '📊',
        render: (user) => `${(user.apiUsageCount || 0).toLocaleString()} calls`,
      },
      {
        key: 'lastLogin',
        label: 'Last Login',
        icon: '🔐',
        render: (user) =>
          user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      },
      {
        key: 'createdAt',
        label: 'Created',
        icon: '📅',
        render: (user) => new Date(user.createdAt).toLocaleDateString(),
      },
    ],
    cardActions: [
      {
        label: 'Regenerate',
        icon: 'refresh',
        variant: 'secondary',
        handler: (user) => {
          // WHAT: Regenerate password action (overridden by page component)
          console.log('Regenerate password for:', user._id);
        },
        title: 'Regenerate password',
      },
      {
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        handler: (user) => {
          // WHAT: Delete user action (overridden by page component)
          console.log('Delete user:', user._id);
        },
        title: 'Delete user',
      },
    ],
  },

  searchFields: ['email', 'name', 'role'],
  emptyStateMessage: 'No users found. Click "Add User" to create your first user account.',
  emptyStateIcon: '👥',
};
