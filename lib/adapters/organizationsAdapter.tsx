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
  capabilities: ['create', 'edit', 'delete', 'report', 'report-workspace', 'edit-content', 'manage-members'],
  search: {
    fields: ['name', 'slug', 'status'],
    placeholder: 'Search organizations...',
  },
  permissionRequirements: ['superadmin'],
  forms: [
    {
      id: 'create-organization',
      title: '+ Add Organization',
      submitText: 'Create',
      fields: [
        {
          key: 'name',
          label: 'Organization Name',
          type: 'text',
          required: true,
          placeholder: 'e.g., Champions Hockey League',
        },
      ],
    },
    {
      id: 'edit-organization',
      title: 'Edit Organization',
      submitText: 'Save Changes',
      fields: [
        {
          key: 'name',
          label: 'Organization Name',
          type: 'text',
          required: true,
          placeholder: 'Organization name',
        },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
        },
      ],
    },
  ],
  actions: [
    {
      id: 'organization-reports',
      label: 'Reports',
      mobileLabel: 'Reports',
      icon: 'visibility',
      variant: 'primary',
      priority: 'primary',
      requiredCapabilities: ['report-workspace'],
      requiredPermissions: ['superadmin'],
      execution: {
        kind: 'route',
        getHref: (org) => `/admin/organizations/${org._id}/reports`,
        target: '_self',
      },
    },
    {
      id: 'organization-report',
      label: 'Open Default Report',
      mobileLabel: 'Default Report',
      icon: 'visibility',
      variant: 'secondary',
      priority: 'secondary',
      requiredCapabilities: ['report'],
      requiredPermissions: ['superadmin'],
      execution: {
        kind: 'route',
        getHref: (org) => `/organization-report/${org._id}`,
        target: '_blank',
      },
    },
    {
      id: 'organization-edit',
      label: 'Edit',
      icon: 'edit',
      variant: 'secondary',
      priority: 'overflow',
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
      mobileLabel: 'Members',
      icon: 'group',
      variant: 'secondary',
      priority: 'overflow',
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
      priority: 'danger',
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
        mobile: { behavior: 'primary' },
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
        mobile: { behavior: 'secondary' },
        render: (org) => <span className="adapter-meta-text">/{org.slug}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        minWidth: '120px',
        mobile: { behavior: 'secondary' },
        render: (org) => <span className="adapter-meta-text">{org.status || 'active'}</span>,
      },
    ],
    actionEmptyStateLabel: 'No organization actions are available for your role.',
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
    actionEmptyStateLabel: 'No organization actions are available for your role.',
  },
  searchFields: ['name', 'slug', 'status'],
  emptyStateMessage: 'No organizations found. Create one to begin.',
  emptyStateIcon: '🏢',
};
