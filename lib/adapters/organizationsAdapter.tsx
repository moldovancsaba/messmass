import React from 'react';
import type { AdminPageAdapter } from '../adminDataAdapters';

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
    rowActions: [
      { label: 'Edit', icon: 'edit', variant: 'primary', handler: () => {} },
      { label: 'Report', icon: 'visibility', variant: 'secondary', handler: () => {} },
      { label: 'Edit Stats', icon: 'bar_chart', variant: 'primary', handler: () => {} },
      { label: 'Manage Members', icon: 'group', variant: 'secondary', handler: () => {} },
      { label: 'Delete', icon: 'delete', variant: 'danger', handler: () => {} },
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
    cardActions: [
      { label: 'Edit', icon: 'edit', variant: 'primary', handler: () => {} },
      { label: 'Report', icon: 'visibility', variant: 'secondary', handler: () => {} },
      { label: 'Edit Stats', icon: 'bar_chart', variant: 'primary', handler: () => {} },
      { label: 'Manage Members', icon: 'group', variant: 'secondary', handler: () => {} },
      { label: 'Delete', icon: 'delete', variant: 'danger', handler: () => {} },
    ],
  },
  searchFields: ['name', 'slug', 'status'],
  emptyStateMessage: 'No organizations found. Create one to begin.',
  emptyStateIcon: '🏢',
};
