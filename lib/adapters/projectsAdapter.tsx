// lib/adapters/projectsAdapter.tsx
// WHAT: Adapter configuration for Projects admin page
// WHY: Defines list/card view structure for event projects data
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';
import { ProjectDTO } from '../types/api';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';

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
        minWidth: '200px',
        render: (project) => (
          <span style={{ fontWeight: 600 }}>{project.eventName}</span>
        ),
      },
      {
        key: 'eventDate',
        label: 'Event Date',
        sortable: true,
        width: '120px',
        render: (project) => (
          <span style={{ fontSize: '0.875rem' }}>
            {new Date(project.eventDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'stats',
        label: 'Images',
        width: '100px',
        sortField: 'stats.remoteImages',
        sortable: true,
        render: (project) => {
          const total = (project.stats.remoteImages || 0) + 
                       (project.stats.hostessImages || 0) + 
                       (project.stats.selfies || 0);
          return <span>{total.toLocaleString()}</span>;
        },
      },
      {
        key: 'stats.stadium',
        label: 'Fans',
        width: '100px',
        sortable: true,
        render: (project) => {
          const total = (project.stats.stadium || 0) + (project.stats.remoteFans || 0);
          return <span>{total.toLocaleString()}</span>;
        },
      },
      {
        key: 'hashtags',
        label: 'Hashtags',
        minWidth: '200px',
        render: (project) => (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
            {!project.hashtags?.length &&
              !Object.keys(project.categorizedHashtags || {}).length && (
                <span className="text-gray-400 text-sm">No tags</span>
              )}
          </div>
        ),
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        sortable: true,
        width: '120px',
        render: (project) => (
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    rowActions: [
      {
        label: 'View',
        icon: '👁️',
        variant: 'secondary',
        handler: (project) => {
          if (project.viewSlug) {
            window.open(`/stats/${project.viewSlug}`, '_blank');
          }
        },
        title: 'View public stats page',
      },
      {
        label: 'Edit',
        icon: '✏️',
        variant: 'primary',
        handler: (project) => {
          if (project.editSlug) {
            window.location.href = `/edit/${project.editSlug}`;
          }
        },
        title: 'Edit project',
      },
      {
        label: 'Delete',
        icon: '🗑️',
        variant: 'danger',
        handler: (project) => {
          if (confirm(`Delete event "${project.eventName}"?`)) {
            console.log('Delete project:', project._id);
          }
        },
        title: 'Delete project',
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
          const total = (project.stats.stadium || 0) + (project.stats.remoteFans || 0);
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
        key: 'hashtags',
        label: 'Hashtags',
        icon: '🏷️',
        render: (project) => {
          const totalHashtags =
            (project.hashtags?.length || 0) +
            Object.values(project.categorizedHashtags || {}).reduce(
              (sum, tags) => sum + tags.length,
              0
            );
          return totalHashtags > 0 ? `${totalHashtags} tags` : 'No tags';
        },
      },
    ],
    cardActions: [
      {
        label: 'View',
        icon: '👁️',
        variant: 'secondary',
        handler: (project) => {
          if (project.viewSlug) {
            window.open(`/stats/${project.viewSlug}`, '_blank');
          }
        },
      },
      {
        label: 'Edit',
        icon: '✏️',
        variant: 'primary',
        handler: (project) => {
          if (project.editSlug) {
            window.location.href = `/edit/${project.editSlug}`;
          }
        },
      },
    ],
  },

  searchFields: ['eventName', 'hashtags', 'categorizedHashtags'],
  emptyStateMessage: 'No events found. Click "Add Event" to create your first project.',
  emptyStateIcon: '🍿',
};
