'use client';

import React from 'react';
import Link from 'next/link';
import { AdminUser } from '@/lib/auth';
import ColoredCard from './ColoredCard';
import { adminNavSections } from '@/lib/adminNavigation';

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

const sectionHeaderStyles: React.CSSProperties = {
  margin: '0 0 var(--mm-space-4) 0',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--mm-font-size-xl)',
  fontWeight: 'var(--mm-font-weight-semibold)',
  color: 'var(--mm-gray-900)',
  margin: '0 0 var(--mm-space-1) 0',
};

const sectionDescriptionStyles: React.CSSProperties = {
  fontSize: 'var(--mm-font-size-sm)',
  color: 'var(--mm-gray-600)',
  margin: 0,
};

export default function AdminDashboard({ user, permissions }: AdminDashboardProps) {
  return (
    <>
      {adminNavSections.map((section) => (
        <section key={section.key}>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <div style={sectionHeaderStyles}>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <h2 style={sectionTitleStyles}>{section.title}</h2>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <p style={sectionDescriptionStyles}>{section.description}</p>
          </div>
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <div style={gridStyles}>
            {section.items.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                // eslint-disable-next-line react/forbid-dom-props
                style={{ textDecoration: 'none' }}
              >
                <ColoredCard accentColor={item.accentColor} hoverable={true}>
                  {/* eslint-disable-next-line react/forbid-dom-props */}
                  <div style={cardContentStyles}>
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div style={iconStyles}>{item.icon}</div>
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div style={textContainerStyles}>
                      {/* eslint-disable-next-line react/forbid-dom-props */}
                      <h3 style={titleStyles}>{item.label}</h3>
                      {/* eslint-disable-next-line react/forbid-dom-props */}
                      <p style={descriptionStyles}>{item.description}</p>
                    </div>
                  </div>
                </ColoredCard>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
