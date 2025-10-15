'use client';

import React from 'react';
import Link from 'next/link';
import { AdminUser } from '@/lib/auth';
import ColoredCard from './ColoredCard';

/* What: Admin dashboard navigation component
   Why: Provides quick access to all admin sections
   
   Design:
   - Uses centralized ColoredCard component for consistency
   - All styling controlled via ColoredCard (maintainable in one place)
   - Color-coded accent bars via accentColor prop
   - No custom CSS modules - pure component reuse */

interface AdminDashboardProps {
  user: AdminUser;
  permissions: {
    canManageUsers: boolean;
    canDelete: boolean;
    canRead: boolean;
    canWrite: boolean;
  };
}

/* What: Navigation card data structure
   Why: Centralize card configuration for easier maintenance */
interface NavCard {
  href: string;
  icon: string;
  title: string;
  description: string;
  accentColor: string; // Hex color for ColoredCard left border
}

/* What: Navigation card configuration with accent colors
   Why: Centralized config - easy to add/remove/reorder cards
   Colors: Match design token system from theme.css */
const navCards: NavCard[] = [
  {
    href: '/admin/projects',
    icon: '🍿',
    title: 'Manage Projects',
    description: 'Create, edit, delete, and organize all your events',
    accentColor: '#10b981', // var(--mm-color-secondary-500) - Green
  },
  {
    href: '/admin/partners',
    icon: '🤝',
    title: 'Partner Management',
    description: 'Manage clubs, federations, venues, and brands',
    accentColor: '#06b6d4', // var(--mm-chart-cyan)
  },
  {
    href: '/admin/bitly',
    icon: '🔗',
    title: 'Bitly Link Management',
    description: 'Track and manage Bitly short links and analytics',
    accentColor: '#0ea5e9', // Sky Blue
  },
  {
    href: '/admin/insights',
    icon: '💡',
    title: 'Analytics Insights',
    description: 'AI-powered insights with anomaly detection, trends, and predictions',
    accentColor: '#f59e0b', // var(--mm-chart-yellow) - Golden/amber for insights
  },
  {
    href: '/admin/filter',
    icon: '🔍',
    title: 'Hashtag Filter',
    description: 'Advanced multi-hashtag filtering and search',
    accentColor: '#8b5cf6', // var(--mm-chart-purple)
  },
  {
    href: '/admin/hashtags',
    icon: '🏷️',
    title: 'Hashtag Manager',
    description: 'Manage hashtag categories and colors',
    accentColor: '#a855f7', // Purple
  },
  {
    href: '/admin/categories',
    icon: '🌍',
    title: 'Category Manager',
    description: 'Organize and group hashtag categories',
    accentColor: '#f97316', // var(--mm-chart-orange)
  },
  {
    href: '/admin/design',
    icon: '🎨',
    title: 'Design Manager',
    description: 'Customize styles and visualization layouts',
    accentColor: '#ec4899', // var(--mm-chart-pink)
  },
  {
    href: '/admin/charts',
    icon: '📊',
    title: 'Chart Algorithm Manager',
    description: 'Configure chart algorithms and calculations',
    accentColor: '#f59e0b', // var(--mm-chart-yellow)
  },
  {
    href: '/admin/variables',
    icon: '🔢',
    title: 'Variable Manager',
    description: 'Manage dynamic variables and formulas',
    accentColor: '#3b82f6', // var(--mm-color-primary-500) - Blue
  },
  {
    href: '/admin/visualization',
    icon: '📈',
    title: 'Visualization Manager',
    description: 'Control chart display and ordering',
    accentColor: '#14b8a6', // var(--mm-chart-teal)
  },
  {
    href: '/admin/cache',
    icon: '🗑️',
    title: 'Cache Management',
    description: 'Clear server and browser caches for fresh content',
    accentColor: '#ef4444', // var(--mm-error) - Red
  },
];

/* What: Card grid styles using design tokens
   Why: Consistent with other admin pages, maintainable via globals.css */
const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 'var(--mm-space-6)',
  marginBottom: 'var(--mm-space-6)',
};

/* What: Navigation card content layout
   Why: Flex layout for icon + text, consistent spacing */
const cardContentStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--mm-space-4)',
};

const iconStyles: React.CSSProperties = {
  fontSize: '2.5rem',
  lineHeight: 1,
  flexShrink: 0,
};

const textContainerStyles: React.CSSProperties = {
  flex: 1,
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--mm-font-size-lg)',
  fontWeight: 'var(--mm-font-weight-semibold)',
  color: 'var(--mm-gray-900)',
  margin: '0 0 var(--mm-space-1) 0',
  lineHeight: 'var(--mm-line-height-sm)',
};

const descriptionStyles: React.CSSProperties = {
  fontSize: 'var(--mm-font-size-sm)',
  color: 'var(--mm-gray-600)',
  margin: 0,
  lineHeight: 'var(--mm-line-height-md)',
};

export default function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  return (
    <>
      {/* What: Navigation cards grid using centralized ColoredCard
          Why: All styling controlled via ColoredCard component - maintainable in one place */}
      <div style={gridStyles}>
        {navCards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
            <ColoredCard accentColor={card.accentColor} hoverable={true}>
              <div style={cardContentStyles}>
                <div style={iconStyles}>{card.icon}</div>
                <div style={textContainerStyles}>
                  <h2 style={titleStyles}>{card.title}</h2>
                  <p style={descriptionStyles}>{card.description}</p>
                </div>
              </div>
            </ColoredCard>
          </Link>
        ))}
      </div>
    </>
  );
}
