import React from 'react';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import { PageStyle } from '@/lib/pageStyleTypes';

interface UnifiedStatsHeroProps {
  title: string; // Main title (e.g., "Aggregated Statistics - 2/20/2025 - 8/28/2025")
  hashtags?: string[]; // Array of hashtags to display
  createdDate: string; // When the page/data was created
  lastUpdatedDate: string; // When the page/data was last updated
  pageStyle?: PageStyle; // Styling configuration
  onExportCSV?: () => void; // Optional CSV export function
}

export default function UnifiedStatsHero({
  title,
  hashtags = [],
  createdDate,
  lastUpdatedDate,
  pageStyle,
  onExportCSV
}: UnifiedStatsHeroProps) {
  const defaultStyle: PageStyle = {
    name: 'Default',
    backgroundGradient: '135deg, #667eea 0%, #764ba2 100%',
    headerBackgroundGradient: '135deg, #667eea 0%, #764ba2 100%',
    titleBubble: {
      backgroundColor: '#667eea',
      textColor: '#ffffff'
    }
  };

  const style = pageStyle || defaultStyle;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="admin-container" style={{ padding: '2rem', minHeight: 'auto' }}>
      <div className="admin-header glass-card" style={{ margin: 0 }}>
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{title}</h1>
            <p className="admin-subtitle">Event Statistics Dashboard</p>
            
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
              <div className="admin-role">Event Statistics</div>
              <div className="admin-level">Live Data</div>
              <div className="admin-status">✅ Active</div>
            </div>
          </div>
        </div>
        
        {/* Creation and Update Dates */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '100%',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(102, 126, 234, 0.2)',
          fontSize: '0.9rem',
          color: '#4a5568',
          fontWeight: '500',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Created:</span>
            <span style={{ 
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              📅 {formatDate(createdDate)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Last Updated:</span>
            <span style={{ 
              background: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              📅 {formatDate(lastUpdatedDate)}
            </span>
          </div>
          
          {onExportCSV && (
            <button 
              onClick={onExportCSV}
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              📊 Export CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
