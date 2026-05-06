// lib/adapters/partnersAdapter.tsx
// WHAT: Adapter configuration for Partners admin page
// WHY: Defines list/card view structure for partners data
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import Image from 'next/image';
import { AdminPageAdapter } from '../adminDataAdapters';
import { PartnerResponse } from '../partner.types';
import type { AdminEntityConfig } from '@/lib/adminEntitySystem';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';

export const partnersEntityConfig: AdminEntityConfig<PartnerResponse> = {
  entityKey: 'partner',
  pageName: 'partners',
  displayName: 'Partner',
  supportedViews: ['list', 'card'],
  capabilities: ['create', 'edit', 'delete', 'report', 'share', 'edit-content', 'analytics', 'kyc'],
  search: {
    fields: ['name', 'hashtags', 'categorizedHashtags'],
    placeholder: 'Search partners...',
  },
  permissionRequirements: ['admin'],
  actions: [
    {
      id: 'partner-edit',
      label: 'Edit',
      icon: '✏️',
      variant: 'primary',
      requiredCapabilities: ['edit'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'modal',
        modalKey: 'edit-partner',
      },
    },
    {
      id: 'partner-report-share',
      label: 'Report',
      icon: '📊',
      variant: 'secondary',
      requiredCapabilities: ['report', 'share'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'share',
        shareKey: 'partner-report',
        getResourceId: (partner) => partner._id || partner.viewSlug || '',
      },
    },
    {
      id: 'partner-edit-content',
      label: 'Edit Stats',
      icon: 'bar_chart',
      variant: 'primary',
      requiredCapabilities: ['edit-content'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'route',
        getHref: (partner) => `/partner-edit/${partner._id || partner.viewSlug}`,
        target: '_blank',
      },
    },
    {
      id: 'partner-kyc',
      label: 'KYC Data',
      icon: 'table_chart',
      variant: 'secondary',
      surfaces: ['list'],
      requiredCapabilities: ['kyc'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'route',
        getHref: (partner) => `/admin/partners/${partner._id}/kyc-data`,
        target: '_blank',
      },
    },
    {
      id: 'partner-analytics',
      label: 'Analytics',
      icon: 'insert_chart',
      variant: 'primary',
      requiredCapabilities: ['analytics'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'route',
        getHref: (partner) => `/admin/partners/${partner._id}/analytics`,
        target: '_blank',
      },
    },
    {
      id: 'partner-delete',
      label: 'Delete',
      icon: '🗑️',
      variant: 'danger',
      requiredCapabilities: ['delete'],
      requiredPermissions: ['admin'],
      execution: {
        kind: 'mutation',
        mutationKey: 'delete-partner',
        confirmMessage: (partner) => `Delete partner "${partner.name}"? This action cannot be undone.`,
      },
    },
  ],
};

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
  defaultView: 'card',
  
  // WHAT: List view configuration (table layout)
  listConfig: {
    columns: [
      {
        key: 'emoji',
        label: 'Icon',
        width: '60px',
        className: 'text-center',
        render: (partner) => (
          <span className="text-2xl">{partner.showEmoji !== false ? partner.emoji : ''}</span>
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
          <span className="adapter-primary-field">{partner.name}</span>
        ),
      },
      {
        key: 'hashtags',
        label: 'Hashtags',
        minWidth: '250px',
        render: (partner) => (
          <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-col gap-1">
              {partner.bitlyLinks.map((link) => (
                <a
                  key={link._id}
                  href={`https://${link.bitlink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm link-primary"
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
          <span className="adapter-meta-text">
            {new Date(partner.updatedAt).toLocaleDateString()}
          </span>
        ),
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
  },

  // WHAT: Fields to search (client-side filtering)
  searchFields: ['name', 'hashtags', 'categorizedHashtags'],

  // WHAT: Empty state configuration
  emptyStateMessage: 'No partners found. Click "Add Partner" to create your first partner organization.',
  emptyStateIcon: '🤝',
};
