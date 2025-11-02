// lib/adapters/hashtagsAdapter.tsx
// WHAT: Adapter configuration for Hashtags admin page
// WHY: Defines list/card view structure for hashtag data
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';
import { HashtagDTO } from '../types/api';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';

/**
 * WHAT: Complete adapter configuration for Hashtags page
 * WHY: Single source of truth for how hashtags are displayed
 * 
 * @example
 * <UnifiedAdminPage
 *   adapter={hashtagsAdapter}
 *   items={hashtags}
 *   title="Hashtags"
 * />
 */
export const hashtagsAdapter: AdminPageAdapter<HashtagDTO> = {
  pageName: 'hashtags',
  defaultView: 'card',
  
  listConfig: {
    columns: [
      {
        key: 'hashtag',
        label: 'Hashtag',
        sortable: true,
        minWidth: '200px',
        render: (hashtag) => (
          <ColoredHashtagBubble
            hashtag={hashtag.hashtag}
            interactive={false}
          />
        ),
      },
      {
        key: 'count',
        label: 'Usage Count',
        sortable: true,
        width: '150px',
        render: (hashtag) => (
          <span style={{ fontWeight: 600 }}>
            {hashtag.count.toLocaleString()} project{hashtag.count !== 1 ? 's' : ''}
          </span>
        ),
      },
      {
        key: 'color',
        label: 'Color',
        width: '100px',
        render: (hashtag) =>
          hashtag.color ? (
            <div
              style={{
                width: '40px',
                height: '24px',
                backgroundColor: hashtag.color,
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
              }}
              title={hashtag.color}
            />
          ) : (
            <span className="text-gray-400 text-sm">Default</span>
          ),
      },
    ],
    rowActions: [
      {
        label: 'View Projects',
        icon: '🔍',
        variant: 'primary',
        handler: (hashtag) => {
          window.location.href = `/admin/filter?hashtag=${encodeURIComponent(hashtag.hashtag)}`;
        },
        title: 'View all projects with this hashtag',
      },
    ],
  },

  cardConfig: {
    primaryField: (hashtag) => (
      <ColoredHashtagBubble
        hashtag={hashtag.hashtag}
        interactive={false}
      />
    ),
    secondaryField: (hashtag) => 
      `Used in ${hashtag.count} project${hashtag.count !== 1 ? 's' : ''}`,
    metaFields: [
      {
        key: 'color',
        label: 'Color',
        icon: '🎨',
        render: (hashtag) => hashtag.color || 'Default',
      },
      {
        key: 'count',
        label: 'Projects',
        icon: '📊',
        render: (hashtag) => hashtag.count.toLocaleString(),
      },
    ],
    cardActions: [
      {
        label: 'View Projects',
        icon: '🔍',
        variant: 'primary',
        handler: (hashtag) => {
          window.location.href = `/admin/filter?hashtag=${encodeURIComponent(hashtag.hashtag)}`;
        },
      },
    ],
  },

  searchFields: ['hashtag'],
  emptyStateMessage: 'No hashtags found. Hashtags are automatically created when you add them to projects.',
  emptyStateIcon: '🏷️',
};
