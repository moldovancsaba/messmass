import React from 'react';
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
  
  // Search functionality
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Dynamic content under title (like hashtag display, filter results, etc.)
  children?: React.ReactNode;
  
  // Hashtags display
  hashtags?: string[];
  showHashtagResults?: boolean;
  
  // Action buttons (flexible array of buttons)
  actionButtons?: ActionButton[];
  
  // Back button
  backLink?: string;
  backLabel?: string;
  
  // Badges for status/info display
  badges?: Badge[];
  
  // Results summary (like "X projects match this filter")
  resultsSummary?: {
    count: number;
    itemType: string; // "projects", "items", etc.
    additionalInfo?: string; // like date range
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

  // Button style generator
  const getButtonStyle = (variant: ActionButton['variant'] = 'primary', disabled = false) => {
    const baseStyle = {
      border: 'none',
      borderRadius: '6px',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500' as const,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.6 : 1
    };

    const variants = {
      primary: { background: '#3b82f6', color: 'white', hoverBg: '#2563eb' },
      secondary: { background: '#6b7280', color: 'white', hoverBg: '#4b5563' },
      success: { background: '#10b981', color: 'white', hoverBg: '#059669' },
      danger: { background: '#ef4444', color: 'white', hoverBg: '#dc2626' },
      info: { background: '#6366f1', color: 'white', hoverBg: '#4f46e5' }
    };

    return { ...baseStyle, ...variants[variant] };
  };

  // Badge style generator
  const getBadgeStyle = (variant: Badge['variant']) => {
    const variants = {
      primary: { bg: '#3b82f6', text: '#ffffff' },
      secondary: { bg: '#6b7280', text: '#ffffff' },
      success: { bg: '#10b981', text: '#ffffff' },
      warning: { bg: '#f59e0b', text: '#ffffff' },
      danger: { bg: '#ef4444', text: '#ffffff' }
    };
    
    return {
      background: variants[variant].bg,
      color: variants[variant].text,
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.875rem',
      fontWeight: '600',
      whiteSpace: 'nowrap' as const
    };
  };

  return (
    <div className="glass-card admin-header">
      <div className="admin-header-content">
        {/* Left Side - Branding and Content */}
        <div className="admin-branding">
          {/* Main Title - Always centered like hashtags filter page */}
          <h1 className="admin-title" style={{
            textAlign: 'center',
            /* Override the gradient background from admin.css */
            background: 'none',
            WebkitBackgroundClip: 'unset',
            WebkitTextFillColor: 'initial',
            backgroundClip: 'unset',
            /* Use regular color */
            color: '#1f2937'
          }}>
            {icon && <span style={{ marginRight: '0.5rem' }}>{icon}</span>}
            {title}
          </h1>
          
          {/* Subtitle - Always centered */}
          {subtitle && (
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem',
              marginTop: '0.5rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {subtitle}
            </p>
          )}
          
          {/* Description - Always centered */}
          {description && (
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              marginTop: '0.5rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {description}
            </p>
          )}
          
          {/* Search Bar - Centered like hashtags filter page */}
          {(showSearch && onSearchChange) && (
            <div style={{
              marginTop: '1rem',
              maxWidth: '400px',
              margin: '1rem auto 0 auto'
            }}>
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  borderRadius: '25px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  textAlign: 'center'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}
          
          {/* Hashtags Display */}
          {showHashtagResults && hashtags.length > 0 && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {hashtags.map((hashtag) => (
                  <ColoredHashtagBubble 
                    key={hashtag}
                    hashtag={hashtag}
                    customStyle={{
                      fontSize: '1.125rem',
                      fontWeight: '600'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Results Summary */}
          {resultsSummary && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              {resultsSummary.additionalInfo && (
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {resultsSummary.additionalInfo}
                </div>
              )}
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                📊 {resultsSummary.count} {resultsSummary.itemType}
                {resultsSummary.count !== 1 ? 's' : ''} 
                {resultsSummary.count > 0 ? ' found' : ''}
              </div>
            </div>
          )}
          
          {/* Custom Children Content */}
          {children && (
            <div style={{ marginTop: '1rem' }}>
              {children}
            </div>
          )}
        </div>
        
        {/* Right Side - Actions and Info */}
        <div className="admin-user-info" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexDirection: 'column'
        }}>
          {/* Badges */}
          {badges.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {badges.map((badge, index) => (
                <span 
                  key={index}
                  style={getBadgeStyle(badge.variant)}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          )}
          
          {/* Action Buttons Container */}
          <div className="admin-badge" style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Back Button */}
              {backLink && (
                <a
                  href={backLink}
                  style={getButtonStyle('secondary')}
                >
                  {backLabel}
                </a>
              )}
              
              {/* Custom Action Buttons */}
              {actionButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.disabled ? undefined : button.onClick}
                  disabled={button.disabled}
                  title={button.title}
                  style={getButtonStyle(button.variant, button.disabled)}
                  onMouseEnter={(e) => {
                    if (!button.disabled) {
                      const style = getButtonStyle(button.variant);
                      e.currentTarget.style.background = (style as any).hoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!button.disabled) {
                      const style = getButtonStyle(button.variant);
                      e.currentTarget.style.background = style.background;
                    }
                  }}
                >
                  {button.icon && <span style={{ marginRight: '0.25rem' }}>{button.icon}</span>}
                  {button.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
