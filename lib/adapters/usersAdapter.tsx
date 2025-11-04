// lib/adapters/usersAdapter.tsx
// WHAT: Adapter configuration for Users admin page
// WHY: Defines list/card view structure for user management
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';

// WHAT: User data type (placeholder - adjust based on actual user schema)
interface UserDTO {
  _id: string;
  email: string;
  role: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

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
          <span style={{ fontWeight: 600 }}>{user.email}</span>
        ),
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        minWidth: '150px',
        render: (user) => user.name || <span className="text-gray-400">—</span>,
      },
      {
        key: 'role',
        label: 'Role',
        sortable: true,
        width: '120px',
        render: (user) => (
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
              color: user.role === 'admin' ? '#1e40af' : '#374151',
            }}
          >
            {user.role}
          </span>
        ),
      },
      {
        key: 'lastLogin',
        label: 'Last Login',
        sortable: true,
        width: '140px',
        render: (user) =>
          user.lastLogin ? (
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {new Date(user.lastLogin).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Never</span>
          ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        width: '120px',
        render: (user) => (
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
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
        render: (user) => user.role,
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
