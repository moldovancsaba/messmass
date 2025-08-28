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
    backgroundGradient: '0deg, #f8fafc 0%, #f1f5f9 100%',
    headerBackgroundGradient: '0deg, #ffffff 0%, #f8fafc 100%',
    titleBubble: {
      backgroundColor: '#6366f1',
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
    <div 
      style={{
        background: `linear-gradient(${style.headerBackgroundGradient})`,
        padding: '3rem 2rem',
        borderRadius: '0 0 24px 24px',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ 
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Main Title in Beautiful Bubble */}
        <div style={{
          display: 'inline-block',
          background: style.titleBubble.backgroundColor,
          color: style.titleBubble.textColor,
          padding: '1.5rem 3rem',
          borderRadius: '50px',
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '2rem',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          transform: 'scale(1)',
          transition: 'all 0.3s ease'
        }}>
          {title}
        </div>

        {/* Hashtags Display */}
        {hashtags.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '2rem'
          }}>
            {hashtags.map((hashtag) => (
              <ColoredHashtagBubble 
                key={hashtag}
                hashtag={hashtag}
                customStyle={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  padding: '0.75rem 1.5rem'
                }}
              />
            ))}
          </div>
        )}

        {/* Creation and Update Dates */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          fontSize: '0.95rem',
          color: '#6b7280',
          fontWeight: '500'
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
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontWeight: '600'
            }}>
              📅 {formatDate(lastUpdatedDate)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
