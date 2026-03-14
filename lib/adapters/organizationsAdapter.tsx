// lib/adapters/organizationsAdapter.tsx
// WHAT: Adapter configuration for Organization management UI
// WHY: Defines list/card structure for root-level V3 hierarchy control
// USAGE: Import and pass to UnifiedAdminPage in /admin/organizations/page.tsx

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';

interface OrganizationDTO {
  _id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * WHAT: Adapter for Organizations
 * WHY: Anchor for the V3 multi-tenant hierarchy
 */
export const organizationsAdapter: AdminPageAdapter<OrganizationDTO> = {
  pageName: 'organizations',
  defaultView: 'list',
  
  listConfig: {
    columns: [
      {
        key: 'name',
        label: 'Organization Name',
        sortable: true,
        minWidth: '200px',
        render: (org) => (
          <div className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <span className="adapter-primary-field">{org.name}</span>
          </div>
        ),
      },
      {
        key: 'slug',
        label: 'Identifier (Slug)',
        sortable: true,
        width: '180px',
        render: (org) => (
          <code className="px-2 py-1 bg-gray-100 rounded text-sm text-blue-600 font-mono">
            {org.slug}
          </code>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: '120px',
        render: (org) => {
          const isActive = org.status === 'active';
          return (
            <span style={{ // eslint-disable-line react/forbid-dom-props
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: isActive ? '#d1fae5' : '#fee2e2',
              color: isActive ? '#065f46' : '#991b1b',
            }}>
              {isActive ? '● Active' : '○ Inactive'}
            </span>
          );
        },
      },
      {
        key: 'updatedAt',
        label: 'Last Updated',
        sortable: true,
        width: '160px',
        render: (org) => (
          <span className="adapter-meta-text">
            {new Date(org.updatedAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    rowActions: [
      {
        label: 'Report',
        icon: 'visibility',
        variant: 'secondary',
        handler: (org) => {
          // WHAT: Open organization report page in new tab
          // WHY: Allow viewing shareable organization profile with sub-entities
          window.open(`/organization-report/${org._id}`, '_blank');
        },
        title: 'View organization report',
      },
      {
        label: 'Edit Stats',
        icon: 'bar_chart',
        variant: 'primary',
        handler: (org) => {
          // WHAT: Open organization content editor
          // WHY: Allow editing organization-level metadata
          window.open(`/organization-edit/${org._id}`, '_blank');
        },
        title: 'Edit organization content',
      },
      {
        label: 'Members',
        icon: 'group',
        variant: 'secondary',
        handler: (org) => console.log('Manage members:', org._id),
        title: 'Manage organization members',
      },
      {
        label: 'Edit',
        icon: 'edit',
        variant: 'secondary',
        handler: (org) => console.log('Edit org:', org._id),
        title: 'Edit organization details',
      },
      {
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        handler: (org) => console.log('Delete org:', org._id),
        title: 'Delete organization',
      },
    ],
  },

  cardConfig: {
    primaryField: 'name',
    secondaryField: (org) => `/${org.slug}`,
    metaFields: [
      {
        key: 'status',
        label: 'Status',
        icon: '📊',
        render: (org) => org.status.toUpperCase(),
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        icon: '📅',
        render: (org) => new Date(org.updatedAt).toLocaleDateString(),
      },
    ],
    cardActions: [
      {
        label: 'Report',
        icon: 'visibility',
        variant: 'secondary',
        handler: (org) => {
          window.open(`/organization-report/${org._id}`, '_blank');
        },
      },
      {
        label: 'Edit Stats',
        icon: 'bar_chart',
        variant: 'primary',
        handler: (org) => {
          window.open(`/organization-edit/${org._id}`, '_blank');
        },
      },
      {
        label: 'Edit',
        icon: 'edit',
        variant: 'secondary',
        handler: (org) => console.log('Edit org:', org._id),
      },
    ],
  },

  searchFields: ['name', 'slug'],
  emptyStateMessage: 'No organizations found. Create first root entity to begin V3 migration.',
  emptyStateIcon: '🏢',
};
