import React from 'react';
import ColoredCard from './ColoredCard';
import ColoredHashtagBubble from './ColoredHashtagBubble';

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

interface UnifiedAdminHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  hashtags?: string[];
  showHashtagResults?: boolean;
  actionButtons?: ActionButton[];
  backLink?: string;
  backLabel?: string;
  badges?: Badge[];
  resultsSummary?: {
    count: number;
    itemType: string;
    additionalInfo?: string;
  };
}

export default function UnifiedAdminHero({
  title,
  subtitle,
  description,
  icon,
  showSearch = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  hashtags = [],
  showHashtagResults = false,
  actionButtons = [],
  backLink,
  backLabel = '← Back to Admin',
  badges = [],
  resultsSummary
}: UnifiedAdminHeroProps) {
  const variantClass = (v: ActionButton['variant'] = 'primary') => `btn-${v}`;

  return (
    <ColoredCard className="admin-header">
      <div className="admin-header-content">
        {/* Left Side - Branding and Content */}
        <div className="admin-branding">
          {/* Title and subtitle centered via helper classes */}
          <h1 className="admin-title admin-title-center">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h1>

          {subtitle && (
            <p className="admin-subtitle admin-subtitle-center">{subtitle}</p>
          )}

          {description && (
            <p className="admin-subtitle admin-subtitle-center">{description}</p>
          )}

          {/* Search Bar */}
          {(showSearch && onSearchChange) && (
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

          {/* Hashtags Display */}
          {showHashtagResults && hashtags.length > 0 && (
            <div className="mt-3">
              <div className="centered-pill-row">
                {hashtags.map((hashtag) => (
                  <ColoredHashtagBubble 
                    key={hashtag}
                    hashtag={hashtag}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Results Summary */}
          {resultsSummary && (
            <div className="mt-2 admin-subtitle-center">
              {resultsSummary.additionalInfo && (
                <div className="info-note mb-2">
                  {resultsSummary.additionalInfo}
                </div>
              )}
              <div className="info-note">📊 {resultsSummary.count} {resultsSummary.itemType}{resultsSummary.count !== 1 ? 's' : ''} {resultsSummary.count > 0 ? 'found' : ''}</div>
            </div>
          )}

          {/* Custom Children Content */}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>

        {/* Right Side - Actions and Info */}
        <div className="admin-user-info">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="admin-hero-badges">
              {badges.map((badge, index) => (
                <span key={index} className={`badge badge-${badge.variant}`}>{badge.text}</span>
              ))}
            </div>
          )}

          {/* Action Buttons Container */}
          <div className="admin-badge">
            <div className="admin-hero-actions">
              {backLink && (
                <a href={backLink} className="btn btn-small btn-secondary admin-hero-back">
                  {backLabel}
                </a>
              )}

              {actionButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.disabled ? undefined : button.onClick}
                  disabled={button.disabled}
                  title={button.title}
                  className={`btn btn-small ${variantClass(button.variant)}`}
                >
                  {button.icon && <span className="mr-2">{button.icon}</span>}
                  {button.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ColoredCard>
  );
}
