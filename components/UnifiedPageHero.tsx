import React from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';

interface UnifiedPageHeroProps {
  title: string;
  hashtags?: string[];
  statusBadge?: {
    role: string;
    level: string;
    status: string;
  };
  onExportCSV?: () => void;
  children?: React.ReactNode; // For additional content like dates
}

export default function UnifiedPageHero({
  title,
  hashtags = [],
  statusBadge,
  onExportCSV,
  children
}: UnifiedPageHeroProps) {
  return (
    <div className="admin-container" style={{ padding: '2rem', minHeight: 'auto' }}>
      <div className="admin-header glass-card" style={{ margin: 0 }}>
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{title}</h1>
            
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
          </div>
          
          <div className="admin-user-info">
            <div className="admin-badge">
              {statusBadge && (
                <>
                  <div className="admin-role">{statusBadge.role}</div>
                  <div className="admin-level">{statusBadge.level}</div>
                  <div className="admin-status">{statusBadge.status}</div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Additional Content (like dates) */}
        {children && (
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(68, 68, 68, 0.2)'
          }}>
            {children}
          </div>
        )}
        
        {/* Export Button */}
        {onExportCSV && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(68, 68, 68, 0.2)'
          }}>
            <button 
              onClick={onExportCSV}
              className="btn btn-primary btn-sm"
            >
              📊 Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
