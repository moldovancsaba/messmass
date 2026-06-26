// lib/adapters/projectsAdapter.tsx
// WHAT: Adapter configuration for Projects admin page
// WHY: Defines list/card view structure for event projects data with partner support
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import Image from 'next/image';
import { AdminPageAdapter } from '../adminDataAdapters';
import { ProjectDTO } from '../types/api';
import type { AdminEntityConfig } from '@/lib/adminEntitySystem';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import { getStoredOrDerivedTotalFans } from '@/lib/totalFans';

export const projectsEntityConfig: AdminEntityConfig<ProjectDTO> = {
  entityKey: 'project',
  pageName: 'projects',
  displayName: 'Event',
  supportedViews: ['list', 'card'],
  capabilities: ['create', 'edit', 'delete', 'report', 'share', 'edit-content', 'fanmass-sync', 'kyc', 'export'],
  search: {
    fields: ['eventName', 'hashtags', 'categorizedHashtags'],
    placeholder: 'Search events...',
  },
  permissionRequirements: ['admin'],
  actions: [
    {
      id: 'project-open-report',
      label: 'Open Report',
      mobileLabel: 'Report',
      icon: 'visibility',
      variant: 'primary',
      priority: 'primary',
      requiredCapabilities: ['report'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'route',
        getHref: (project) => `/report/${project.viewSlug || project._id}`,
        target: '_blank',
      },
    },
    {
      id: 'project-open-editor',
      label: 'Open Editor',
      mobileLabel: 'Editor',
      icon: 'bar_chart',
      variant: 'primary',
      priority: 'primary',
      requiredCapabilities: ['edit-content'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'route',
        getHref: (project) => `/edit/${project.editSlug || project._id}`,
        target: '_blank',
      },
    },
    {
      id: 'project-share-report',
      label: 'Share Report',
      mobileLabel: 'Share Report',
      icon: 'ios_share',
      variant: 'secondary',
      priority: 'secondary',
      requiredCapabilities: ['report', 'share'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'share',
        shareKey: 'project-report',
        getResourceId: (project) => project.viewSlug || project._id,
      },
    },
    {
      id: 'project-share-editor',
      label: 'Share Editor',
      mobileLabel: 'Share Editor',
      icon: 'share',
      variant: 'secondary',
      priority: 'overflow',
      requiredCapabilities: ['edit-content', 'share'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'share',
        shareKey: 'project-editor',
        getResourceId: (project) => project.editSlug || project._id,
      },
    },
    {
      id: 'project-fanmass-sync',
      label: 'Fanmass Sync',
      mobileLabel: 'Fanmass',
      icon: 'sync',
      variant: 'secondary',
      priority: 'overflow',
      requiredCapabilities: ['fanmass-sync'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'modal',
        modalKey: 'fanmass-sync',
      },
    },
    {
      id: 'project-edit',
      label: 'Edit',
      icon: 'edit',
      variant: 'secondary',
      priority: 'overflow',
      requiredCapabilities: ['edit'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'modal',
        modalKey: 'edit-project',
      },
    },
    {
      id: 'project-export-csv',
      label: 'Export CSV',
      mobileLabel: 'Export',
      icon: 'download',
      variant: 'secondary',
      priority: 'overflow',
      requiredCapabilities: ['export'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'mutation',
        mutationKey: 'export-project-csv',
      },
    },
    {
      id: 'project-kyc',
      label: 'KYC Data',
      mobileLabel: 'KYC',
      icon: 'table_chart',
      variant: 'secondary',
      priority: 'overflow',
      requiredCapabilities: ['kyc'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'route',
        getHref: (project) => `/admin/events/${project._id}/kyc-data`,
        target: '_blank',
      },
    },
    {
      id: 'project-delete',
      label: 'Delete',
      icon: 'delete',
      variant: 'danger',
      priority: 'danger',
      requiredCapabilities: ['delete'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'mutation',
        mutationKey: 'delete-project',
        confirmMessage: (project) => `Delete event "${project.eventName}"?`,
      },
    },
  ],
};

/**
 * WHAT: Complete adapter configuration for Projects page
 * WHY: Single source of truth for how projects/events are displayed
 * 
 * @example
 * <UnifiedAdminPage
 *   adapter={projectsAdapter}
 *   items={projects}
 *   title="Projects"
 * />
 */
export const projectsAdapter: AdminPageAdapter<ProjectDTO> = {
  pageName: 'projects',
  defaultView: 'list',
  
  listConfig: {
    columns: [
      {
        key: 'eventName',
        label: 'Event Name',
        sortable: true,
        minWidth: '250px',
        mobile: { behavior: 'primary', label: 'Event' },
        render: (project) => {
          return (
            <div>
              <div className="flex items-center gap-2">
                {project.partner1 && project.partner1.showEmoji !== false && (
                  <span className="text-3xl shrink-0">
                    {project.partner1.emoji}
                  </span>
                )}
                
                {project.partner1?.logoUrl ? (
                  <Image
                    src={project.partner1.logoUrl}
                    alt={`${project.partner1.name} logo`}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain rounded shrink-0"
                    title={project.partner1.name}
                    unoptimized
                  />
                ) : project.partner1 ? (
                  <div className="w-10 h-10 shrink-0" />
                ) : null}
                
                <span className="adapter-primary-field">{project.eventName}</span>
                
                {project.partner2?.logoUrl ? (
                  <Image
                    src={project.partner2.logoUrl}
                    alt={`${project.partner2.name} logo`}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain rounded shrink-0"
                    title={project.partner2.name}
                    unoptimized
                  />
                ) : project.partner2 ? (
                  <div className="w-10 h-10 shrink-0" />
                ) : null}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {project.hashtags?.map((hashtag) => (
                  <ColoredHashtagBubble
                    key={`general-${hashtag}`}
                    hashtag={hashtag}
                    small
                    interactive={false}
                    projectCategorizedHashtags={project.categorizedHashtags}
                    autoResolveColor
                  />
                ))}
                {project.categorizedHashtags &&
                  Object.entries(project.categorizedHashtags).map(([category, hashtags]) =>
                    hashtags.map((hashtag) => (
                      <ColoredHashtagBubble
                        key={`${category}-${hashtag}`}
                        hashtag={`${category}:${hashtag}`}
                        showCategoryPrefix
                        small
                        interactive={false}
                      />
                    ))
                  )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'eventDate',
        label: 'Date',
        sortable: true,
        width: '120px',
        mobile: { behavior: 'secondary' },
        render: (project) => (
          <span className="text-sm">
            {new Date(project.eventDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'images',
        label: 'Images',
        width: '100px',
        sortable: true,
        mobile: { behavior: 'hidden' },
        render: (project) => {
          const total = (project.stats.remoteImages || 0) + 
                       (project.stats.hostessImages || 0) + 
                       (project.stats.selfies || 0);
          return <span>{total.toLocaleString()}</span>;
        },
      },
      {
        key: 'fans',
        label: 'Total Fans',
        width: '100px',
        sortable: true,
        mobile: { behavior: 'secondary', label: 'Fans' },
        render: (project) => {
          const total = getStoredOrDerivedTotalFans(project.stats);
          return <span>{total.toLocaleString()}</span>;
        },
      },
      {
        key: 'attendees',
        label: 'Attendees',
        width: '100px',
        sortable: true,
        mobile: { behavior: 'hidden' },
        render: (project) => (
          <span>{(project.stats.eventAttendees || 0).toLocaleString()}</span>
        ),
      },
    ],
  },

  cardConfig: {
    primaryField: 'eventName',
    secondaryField: (project) => new Date(project.eventDate).toLocaleDateString(),
    metaFields: [
      {
        key: 'stats',
        label: 'Total Images',
        icon: '📷',
        render: (project) => {
          const total = (project.stats.remoteImages || 0) + 
                       (project.stats.hostessImages || 0) + 
                       (project.stats.selfies || 0);
          return total.toLocaleString();
        },
      },
      {
        key: 'stats.stadium',
        label: 'Total Fans',
        icon: '👥',
        render: (project) => {
          const total = getStoredOrDerivedTotalFans(project.stats);
          return total.toLocaleString();
        },
      },
      {
        key: 'stats.merched',
        label: 'Merchandise',
        icon: '🛍️',
        render: (project) => (project.stats.merched || 0).toLocaleString(),
      },
      {
        key: 'stats.eventAttendees',
        label: 'Attendees',
        icon: '🏟️',
        render: (project) => (project.stats.eventAttendees || 0).toLocaleString(),
      },
    ],
  },

  searchFields: ['eventName', 'hashtags', 'categorizedHashtags'],
  emptyStateMessage: 'No projects found. Click "Add New Project" to create your first event.',
  emptyStateIcon: '🍿',
};
