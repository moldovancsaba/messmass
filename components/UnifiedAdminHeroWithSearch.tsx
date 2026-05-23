// components/UnifiedAdminHeroWithSearch.tsx
// WHAT: Enhanced admin hero with integrated search and view toggle
// WHY: Unified header component for all admin pages with dual view support
// DESIGN SYSTEM: Extends AdminHero with view toggle integration

'use client';

import React from 'react';
import Link from 'next/link';
import { Badge as MantineBadge, Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconArrowLeft, IconSearch } from '@tabler/icons-react';
import UnifiedAdminViewToggle, { ViewMode } from './UnifiedAdminViewToggle';
import styles from './UnifiedAdminHeroWithSearch.module.css';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'info';
  icon?: string;
  disabled?: boolean;
  title?: string;
}

interface Badge {
  text: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

interface UnifiedAdminHeroWithSearchProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional back link URL */
  backLink?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Search input value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Optional action buttons */
  actionButtons?: ActionButton[];
  /** Optional badges */
  badges?: Badge[];
  /** Show view toggle */
  showViewToggle?: boolean;
  /** Current view mode */
  currentView?: ViewMode;
  /** View change handler */
  onViewChange?: (view: ViewMode) => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * WHAT: Enhanced admin hero with search and view toggle
 * WHY: Consistent header across all admin pages with dual-view support
 * 
 * @example
 * <UnifiedAdminHeroWithSearch
 *   title="Partners"
 *   showSearch
 *   searchValue={searchTerm}
 *   onSearchChange={setSearchTerm}
 *   showViewToggle
 *   currentView={viewMode}
 *   onViewChange={setViewMode}
 *   actionButtons={[{ label: 'Add Partner', onClick: handleAdd }]}
 * />
 */
export default function UnifiedAdminHeroWithSearch({
  title,
  subtitle,
  backLink,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  actionButtons = [],
  badges = [],
  showViewToggle = false,
  currentView = 'list',
  onViewChange,
  className = '',
}: UnifiedAdminHeroWithSearchProps) {
  const badgeVariantClass = (variant: Badge['variant']) =>
    styles[`badge${variant.charAt(0).toUpperCase() + variant.slice(1)}`];

  const actionButtonClass = (variant?: ActionButton['variant']) => `btn btn-small btn-${variant || 'primary'}`;

  return (
    <div className={`${styles.heroContainer} ${className}`}>
      <div className={styles.heroContent}>
        {/* WHAT: Left section - Title, subtitle, and search */}
        <Stack gap="md" className={styles.heroLeft}>
          <Stack gap="xs" className={styles.heroTitleGroup}>
            <Title order={1} className={styles.heroTitle}>
              {title}
            </Title>
            {subtitle && (
              <Text className={styles.heroSubtitle}>{subtitle}</Text>
            )}
          </Stack>

          {/* WHAT: Search input with debouncing handled by parent */}
          {showSearch && onSearchChange && (
            <div className={styles.searchContainer}>
              <TextInput
                value={searchValue}
                onChange={(event) => onSearchChange(event.currentTarget.value)}
                placeholder={searchPlaceholder}
                aria-label="Search"
                leftSection={<IconSearch size={16} stroke={1.8} />}
                classNames={{
                  input: styles.searchInput,
                  section: styles.searchIcon,
                }}
              />
            </div>
          )}
        </Stack>

        {/* WHAT: Right section - View toggle, actions, back link */}
        <Group gap="md" className={styles.heroRight}>
          {badges.length > 0 && (
            <Group gap="xs" className={styles.badgeContainer}>
              {badges.map((badge, idx) => (
                <MantineBadge
                  key={idx}
                  className={`${styles.badge} ${badgeVariantClass(badge.variant)}`}
                  radius="xl"
                  variant="filled"
                >
                  {badge.text}
                </MantineBadge>
              ))}
            </Group>
          )}

          {/* WHAT: View toggle for list/card switching */}
          {showViewToggle && onViewChange && (
            <div className={styles.viewToggleWrapper}>
              <UnifiedAdminViewToggle
                currentView={currentView}
                onViewChange={onViewChange}
              />
            </div>
          )}

          {/* WHAT: Action buttons (e.g., "Add New") */}
          {actionButtons.length > 0 && (
            <Group gap="sm" className={styles.actionButtons}>
              {actionButtons.map((btn, idx) => {
                return (
                  <Button
                    key={idx}
                    onClick={btn.onClick}
                    disabled={!!btn.disabled}
                    title={btn.title}
                    className={actionButtonClass(btn.variant)}
                    variant="filled"
                    size="sm"
                  >
                    {btn.icon ? `${btn.icon} ${btn.label}` : btn.label}
                  </Button>
                );
              })}
            </Group>
          )}

          {/* WHAT: Back link to parent page */}
          {backLink && (
            <Button
              component={Link}
              href={backLink}
              className="btn btn-small btn-secondary"
              variant="filled"
              size="sm"
              leftSection={<IconArrowLeft size={16} stroke={1.8} />}
            >
              Back
            </Button>
          )}
        </Group>
      </div>
    </div>
  );
}
