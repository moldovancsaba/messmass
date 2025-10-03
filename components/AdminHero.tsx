import React from 'react';
import Link from 'next/link';
import styles from './AdminHero.module.css';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

interface Badge {
  text: string;
  variant: BadgeVariant;
}

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'info';
  icon?: string;
  disabled?: boolean;
  title?: string;
}

interface AdminHeroProps {
  title: string;
  subtitle?: string;
  badges?: Badge[];
  backLink?: string;
  // Optional search controls
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  // Optional actions (right-side buttons)
  actionButtons?: ActionButton[];
}

// WHAT: Single-source robust ADMIN HERO used across all admin pages with TailAdmin V2 flat design.
// WHY: Prevents per-page divergence and guarantees consistent modern flat aesthetic.
// HOW: Uses CSS Modules with design tokens from theme.css for consistent TailAdmin V2 styling.
export default function AdminHero({
  title,
  subtitle,
  badges = [],
  backLink,
  showSearch = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actionButtons = []
}: AdminHeroProps) {
  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroContent}>
        {/* Left: Title/Subtitle/Search */}
        <div className={styles.heroLeft}>
          <div className={styles.heroTitleGroup}>
            <h1 className={styles.heroTitle}>{title}</h1>
            {subtitle && (
              <p className={styles.heroSubtitle}>{subtitle}</p>
            )}
          </div>

          {showSearch && onSearchChange && (
            <div className={styles.searchContainer}>
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={styles.searchInput}
              />
            </div>
          )}
        </div>

        {/* Right: Badges / Back link / Actions */}
        <div className={styles.heroRight}>
          {badges.length > 0 && (
            <div className={styles.badgeContainer}>
              {badges.map((badge, idx) => (
                <span key={idx} className={`${styles.badge} ${styles[`badge${badge.variant.charAt(0).toUpperCase() + badge.variant.slice(1)}`]}`}>
                  {badge.text}
                </span>
              ))}
            </div>
          )}

          {/* Back link (when provided) */}
          {backLink && (
            <Link href={backLink} className={styles.backLink}>
              ← Back to Admin
            </Link>
          )}

          {/* Action buttons */}
          {actionButtons.length > 0 && (
            <div className={styles.actionButtons}>
              {actionButtons.map((btn, idx) => {
                const variantClass = btn.variant ? styles[`btn${btn.variant.charAt(0).toUpperCase() + btn.variant.slice(1)}`] : styles.btnPrimary;
                return (
                  <button
                    key={idx}
                    onClick={btn.onClick}
                    disabled={!!btn.disabled}
                    title={btn.title}
                    className={`${styles.actionButton} ${variantClass} ${btn.disabled ? styles.btnDisabled : ''}`}
                  >
                    {btn.icon ? `${btn.icon} ${btn.label}` : btn.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
