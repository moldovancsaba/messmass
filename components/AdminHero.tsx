import React from 'react';
import Link from 'next/link';

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

// WHAT: Single-source robust ADMIN HERO used across all admin pages.
// WHY: Prevents per-page divergence in styles/structure and guarantees the Admin Design theme applies.
// HOW: Purely uses CSS classes (admin-header, glass-card, admin-title, etc.). No inline background overrides.
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
  // Helper: button styles for actionButtons
  return (
    <div className="admin-header glass-card">
      <div className="admin-header-content">
        {/* Left: Title/Subtitle/Search */}
        <div className="admin-branding">
          <h1 className="admin-title admin-title-center">{title}</h1>
          {subtitle && (
            <p className="admin-subtitle admin-subtitle-center">{subtitle}</p>
          )}

          {showSearch && onSearchChange && (
            <div className="admin-hero-search">
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="form-input admin-hero-search-input"
              />
            </div>
          )}
        </div>

        {/* Right: Badges / Back link / Actions */}
        <div className="admin-hero-right">
          {badges.length > 0 && (
            <div className="admin-hero-badges">
              {badges.map((badge, idx) => (
                <span key={idx} className={`badge badge-${badge.variant}`}>{badge.text}</span>
              ))}
            </div>
          )}

          {/* Back link (when provided) */}
          {backLink && (
            <Link href={backLink} className="btn btn-sm btn-secondary admin-hero-back">
              ← Back to Admin
            </Link>
          )}

          {/* Action buttons */}
          {actionButtons.length > 0 && (
            <div className="admin-hero-actions">
              {actionButtons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  disabled={!!btn.disabled}
                  title={btn.title}
                  className={`btn btn-sm ${btn.variant ? `btn-${btn.variant}` : 'btn-primary'}`}
                >
                  {btn.icon ? `${btn.icon} ${btn.label}` : btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
