import React from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';

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
    <div className="admin-container" style={{ padding: '2rem', minHeight: 'auto' }}>
      <div className="admin-header admin-card" style={{ margin: 0 }}>
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">
              {icon && <span style={{ marginRight: '0.5rem' }}>{icon}</span>}
              {title}
            </h1>
            
            {subtitle && (
              <p style={{
                color: '#6b7280',
                fontSize: '1.1rem',
                marginTop: '0.5rem',
                marginBottom: '1rem'
              }}>
                {subtitle}
              </p>
            )}
            
            {description && (
              <p style={{
                color: '#6b7280',
                fontSize: '1rem',
                marginTop: '0.5rem',
                marginBottom: '1rem'
              }}>
                {description}
              </p>
            )}
            
            {/* Hashtags Display */}
            {hashtags.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                {hashtags.map((hashtag) => (
                  <ColoredHashtagBubble 
                    key={hashtag}
                    hashtag={hashtag}
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
              <div style={{
                marginTop: '1.5rem',
                maxWidth: '400px'
              }}>
                <input
                  type="text"
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1.25rem',
                    fontSize: '1rem',
                    border: '2px solid rgba(68, 68, 68, 0.2)',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="admin-user-info" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexDirection: 'column'
          }}>
            {badges.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
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
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}
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
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(68, 68, 68, 0.2)'
          }}>
            {children}
          </div>
        )}
        
        {/* Action Buttons */}
        {(onExportCSV || onAction) && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(68, 68, 68, 0.2)'
          }}>
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
      </div>
    </div>
  );
}
