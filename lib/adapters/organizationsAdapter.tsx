import React from 'react';
import type { AdminPageAdapter } from '../adminDataAdapters';
import type { AdminEntityConfig } from '@/lib/adminEntitySystem';

export interface OrganizationDTO {
  _id: string;
  name: string;
  slug: string;
  status?: 'active' | 'inactive';
  metadata?: {
    emoji?: string;
    [key: string]: unknown;
  };
}

export const organizationsEntityConfig: AdminEntityConfig<OrganizationDTO> = {
  entityKey: 'organization',
  pageName: 'organizations',
  displayName: 'Organization',
  supportedViews: ['list', 'card'],
  capabilities: ['create', 'edit', 'delete', 'report', 'edit-content', 'manage-members'],
  search: {
    fields: ['name', 'slug', 'status'],
    placeholder: 'Search organizations...',
  },
  permissionRequirements: ['superadmin'],
  actions: [
    {
      id: 'organization-report',
      label: 'Open Report',
      icon: 'visibility',
      variant: 'primary',
      requiredCapabilities: ['report'],
      requiredPermissions: ['superadmin'],
      execution: {
        kind: 'route',
        getHref: (org) => `/organization-report/${org._id}`,
        target: '_blank',
      },
    },
    {
      id: 'organization-edit-content',
      label: 'Open Editor',
      icon: 'bar_chart',
      variant: 'primary',
      requiredCapabilities: ['edit-content'],
      requiredPermissions: ['superadmin'],
      execution: {
        kind: 'route',
        getHref: (org) => `/organization-edit/${org._id}`,
        target: '_blank',
      },
    },
    {
      id: 'organization-edit',
      label: 'Edit',
      icon: 'edit',
      variant: 'secondary',
      requiredCapabilities: ['edit'],
      requiredPermissions: ['superadmin'],
      execution: {
        kind: 'modal',
        modalKey: 'edit-organization',
      },
    },
    {
      id: 'organization-manage-members',
      label: 'Manage Members',
      icon: 'group',
      variant: 'secondary',
      requiredCapabilities: ['manage-members'],
      requiredPermissions: ['superadmin'],
      execution: {
        kind: 'modal',
        modalKey: 'manage-members',
      },
    },
    {
      id: 'organization-delete',
      label: 'Delete',
      icon: 'delete',
      variant: 'danger',
      requiredCapabilities: ['delete'],
      requiredPermissions: ['superadmin'],
      execution: {
        kind: 'mutation',
        mutationKey: 'delete-organization',
        confirmMessage: (org) => `Delete organization "${org.name}"?`,
      },
    },
  ],
};

export const organizationsAdapter: AdminPageAdapter<OrganizationDTO> = {
  pageName: 'organizations',
  defaultView: 'list',
  listConfig: {
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        minWidth: '220px',
        render: (org) => (
          <div className="flex items-center gap-2">
            <span>{org.metadata?.emoji || '🏢'}</span>
            <span className="adapter-primary-field">{org.name}</span>
          </div>
        ),
      },
      {
        key: 'slug',
        label: 'Slug',
        sortable: true,
        minWidth: '180px',
        render: (org) => <span className="adapter-meta-text">/{org.slug}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        minWidth: '120px',
        render: (org) => <span className="adapter-meta-text">{org.status || 'active'}</span>,
      },
    ],
  },
  cardConfig: {
    primaryField: (org) => (
      <div className="flex items-center gap-2">
        <span>{org.metadata?.emoji || '🏢'}</span>
        <span>{org.name}</span>
      </div>
    ),
    secondaryField: (org) => `/${org.slug}`,
    metaFields: [
      {
        key: 'slug',
        label: 'Slug',
        render: (org) => org.slug,
      },
      {
        key: 'status',
        label: 'Status',
        render: (org) => org.status || 'active',
      },
    ],
    renderBadge: (org) => <span>{org.status || 'active'}</span>,
  },
  searchFields: ['name', 'slug', 'status'],
  emptyStateMessage: 'No organizations found. Create one to begin.',
  emptyStateIcon: '🏢',
};
