// lib/adapters/partnersAdapter.tsx
// WHAT: Adapter configuration for Partners admin page
// WHY: Defines list/card view structure for partners data
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import Image from 'next/image';
import { AdminPageAdapter } from '../adminDataAdapters';
import { PartnerResponse } from '../partner.types';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';

/**
 * WHAT: Complete adapter configuration for Partners page
 * WHY: Single source of truth for how partners are displayed in list and card views
 * 
 * @example
 * <UnifiedAdminPage
 *   adapter={partnersAdapter}
 *   items={partners}
 *   title="Partners"
 * />
 */
export const partnersAdapter: AdminPageAdapter<PartnerResponse> = {
  // WHAT: Page identifier for localStorage persistence
  pageName: 'partners',
  
  // WHAT: Default view mode (list or card)
  defaultView: 'list',
  
  // WHAT: List view configuration (table layout)
  listConfig: {
    columns: [
      {
        key: 'emoji',
        label: 'Icon',
        width: '60px',
        className: 'text-center',
        render: (partner) => (
          <span style={{ fontSize: '1.5rem' }}>{partner.emoji}</span>
        ),
      },
      {
        key: 'logoUrl',
        label: 'Logo',
        width: '80px',
        render: (partner) =>
          partner.logoUrl ? (
            <Image
              src={partner.logoUrl}
              alt={`${partner.name} logo`}
              width={60}
              height={60}
              style={{
                objectFit: 'contain',
                borderRadius: '4px',
              }}
              unoptimized
            />
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        minWidth: '200px',
        render: (partner) => (
          <span style={{ fontWeight: 600 }}>{partner.name}</span>
        ),
      },
      {
        key: 'hashtags',
        label: 'Hashtags',
        minWidth: '250px',
        render: (partner) => (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {/* Traditional hashtags */}
            {partner.hashtags?.map((hashtag) => (
              <ColoredHashtagBubble
                key={`general-${hashtag}`}
                hashtag={hashtag}
                small
                interactive={false}
                projectCategorizedHashtags={partner.categorizedHashtags}
                autoResolveColor
              />
            ))}
            {/* Categorized hashtags */}
            {partner.categorizedHashtags &&
              Object.entries(partner.categorizedHashtags).map(([category, hashtags]) =>
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
            {!partner.hashtags?.length &&
              !Object.keys(partner.categorizedHashtags || {}).length && (
                <span className="text-gray-400 text-sm">No hashtags</span>
              )}
          </div>
        ),
      },
      {
        key: 'bitlyLinks',
        label: 'Bitly Links',
        width: '150px',
        render: (partner) =>
          partner.bitlyLinks && partner.bitlyLinks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {partner.bitlyLinks.map((link) => (
                <a
                  key={link._id}
                  href={`https://${link.bitlink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem', color: '#3b82f6' }}
                  title={link.title}
                >
                  {link.bitlink}
                </a>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No links</span>
          ),
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        sortable: true,
        width: '120px',
        render: (partner) => (
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {new Date(partner.updatedAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    // WHAT: Row action buttons (Edit, Report, Delete)
    rowActions: [
      {
        label: 'Edit',
        icon: '✏️',
        variant: 'primary',
        handler: (partner) => {
          console.log('Edit partner:', partner._id);
          // This would be replaced with actual edit handler from parent
        },
        title: 'Edit partner',
      },
      {
        label: 'Report',
        icon: '📊',
        variant: 'secondary',
        handler: (partner) => {
          // WHAT: Open partner report page in new tab
          // WHY: Allow viewing shareable partner profile with events
          if (partner.viewSlug) {
            window.open(`/partner-report/${partner.viewSlug}`, '_blank');
          } else {
            alert('Partner does not have a viewSlug. Please edit and save the partner to generate one.');
          }
        },
        title: 'View partner report',
      },
      {
        label: 'Delete',
        icon: '🗑️',
        variant: 'danger',
        handler: (partner) => {
          if (confirm(`Delete partner "${partner.name}"?`)) {
            console.log('Delete partner:', partner._id);
            // This would be replaced with actual delete handler from parent
          }
        },
        title: 'Delete partner',
      },
    ],
  },

  // WHAT: Card view configuration (grid layout)
  cardConfig: {
    primaryField: 'name',
    iconField: 'emoji',
    imageField: 'logoUrl',
    metaFields: [
      {
        key: 'hashtags',
        label: 'Hashtags',
        icon: '🏷️',
        render: (partner) => {
          const totalHashtags =
            (partner.hashtags?.length || 0) +
            Object.values(partner.categorizedHashtags || {}).reduce(
              (sum, tags) => sum + tags.length,
              0
            );
          return totalHashtags > 0 ? `${totalHashtags} tags` : 'No tags';
        },
      },
      {
        key: 'bitlyLinks',
        label: 'Bitly Links',
        icon: '🔗',
        render: (partner) =>
          partner.bitlyLinks?.length
            ? `${partner.bitlyLinks.length} link${partner.bitlyLinks.length > 1 ? 's' : ''}`
            : 'No links',
      },
      {
        key: 'sportsDb.leagueName',
        label: 'League',
        icon: '🏆',
        render: (partner) =>
          partner.sportsDb?.leagueName || 'Not linked',
      },
      {
        key: 'updatedAt',
        label: 'Last Updated',
        icon: '📅',
        render: (partner) => new Date(partner.updatedAt).toLocaleDateString(),
      },
    ],
    // WHAT: Card action buttons
    cardActions: [
      {
        label: 'Edit',
        icon: '✏️',
        variant: 'primary',
        handler: (partner) => {
          console.log('Edit partner:', partner._id);
        },
      },
      {
        label: 'Report',
        icon: '📊',
        variant: 'secondary',
        handler: (partner) => {
          // WHAT: Open partner report page in new tab
          // WHY: Allow viewing shareable partner profile with events
          if (partner.viewSlug) {
            window.open(`/partner-report/${partner.viewSlug}`, '_blank');
          } else {
            alert('Partner does not have a viewSlug. Please edit and save the partner to generate one.');
          }
        },
      },
      {
        label: 'Delete',
        icon: '🗑️',
        variant: 'danger',
        handler: (partner) => {
          if (confirm(`Delete "${partner.name}"?`)) {
            console.log('Delete partner:', partner._id);
          }
        },
      },
    ],
  },

  // WHAT: Fields to search (client-side filtering)
  searchFields: ['name', 'hashtags', 'categorizedHashtags'],

  // WHAT: Empty state configuration
  emptyStateMessage: 'No partners found. Click "Add Partner" to create your first partner organization.',
  emptyStateIcon: '🤝',
};
