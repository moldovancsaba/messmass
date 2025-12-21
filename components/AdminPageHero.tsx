import React from 'react';
import ColoredCard from './ColoredCard';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import styles from './AdminPageHero.module.css';

interface Badge {
  text: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

interface AdminPageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  hashtags?: string[];
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  badges?: Badge[];
  backLink?: string;
  onExportCSV?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
}

export default function AdminPageHero({
  title,
  subtitle,
  description,
  icon,
  hashtags = [],
  showSearch = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  badges = [],
  backLink,
  onExportCSV,
  onAction,
  actionLabel,
  children
}: AdminPageHeroProps) {
  return (
    <div className={`admin-container ${styles.container}`}>
      <ColoredCard className={`admin-header ${styles.header}`}>
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">
              {icon && <span className={styles.iconWrapper}>{icon}</span>}
              {title}
            </h1>
            
            {subtitle && (
              <p className={styles.subtitle}>
                {subtitle}
              </p>
            )}
            
            {description && (
              <p className={styles.description}>
                {description}
              </p>
            )}
            
            {/* Hashtags Display */}
            {hashtags.length > 0 && (
              <div className={styles.hashtagsWrapper}>
                {hashtags.map((hashtag) => (
                  <ColoredHashtagBubble 
                    key={hashtag}
                    hashtag={hashtag}
                    // WHAT: Custom sizing for hashtags in hero header
                    // WHY: Hero needs larger, bolder hashtags (1rem vs default 0.875rem)
                    // NOTE: customStyle prop is legitimate pattern in ColoredHashtagBubble
                    // eslint-disable-next-line react/forbid-dom-props
                    customStyle={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      padding: '0.5rem 1rem'
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Search Bar */}
            {(showSearch && onSearchChange) && (
              <div className={styles.searchWrapper}>
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
          
          <div className={`admin-user-info ${styles.userInfo}`}>
            {badges.length > 0 && (
              <div className={styles.badgesWrapper}>
                {badges.map((badge, index) => {
                  const getBadgeColor = (variant: string) => {
                    switch (variant) {
                      case 'primary': return { bg: '#3b82f6', text: '#ffffff' };
                      case 'secondary': return { bg: '#6b7280', text: '#ffffff' };
                      case 'success': return { bg: '#10b981', text: '#ffffff' };
                      case 'warning': return { bg: '#f59e0b', text: '#ffffff' };
                      case 'danger': return { bg: '#ef4444', text: '#ffffff' };
                      default: return { bg: '#6b7280', text: '#ffffff' };
                    }
                  };
                  const colors = getBadgeColor(badge.variant);
                  
                  return (
                    <span 
                      key={index}
                      className={styles.badge}
                      // WHAT: CSS variables for dynamic badge colors based on variant
                      // WHY: Badge variant (primary/success/warning/danger) determines colors
                      // HOW: CSS module uses var(--badge-bg) and var(--badge-text)
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{
                        '--badge-bg': colors.bg,
                        '--badge-text': colors.text
                      } as React.CSSProperties}
                    >
                      {badge.text}
                    </span>
                  );
                })}
              </div>
            )}
            
            {backLink && (
              <a href={backLink} className="btn btn-small btn-secondary admin-hero-back">
                ← Back to Admin
              </a>
            )}
          </div>
        </div>
        
        {/* Additional Content */}
        {children && (
          <div className={styles.additionalContent}>
            {children}
          </div>
        )}
        
        {/* Action Buttons */}
        {(onExportCSV || onAction) && (
          <div className={styles.actionsWrapper}>
            {onAction && (
              <button 
                onClick={onAction}
                className="btn btn-secondary btn-small"
              >
                {actionLabel || 'Action'}
              </button>
            )}
            {onExportCSV && (
              <button 
                onClick={onExportCSV}
                className="btn btn-primary btn-small"
              >
                📊 Export CSV
              </button>
            )}
          </div>
        )}
      </ColoredCard>
    </div>
  );
}
