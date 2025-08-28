import React from 'react';
import UnifiedPageHero from './UnifiedPageHero';
import { PageStyle } from '@/lib/pageStyleTypes';

interface UnifiedStatsHeroProps {
  title: string;
  hashtags?: string[];
  createdDate: string;
  lastUpdatedDate: string;
  pageStyle?: PageStyle;
  onExportCSV?: () => void;
}

export default function UnifiedStatsHero({
  title,
  hashtags = [],
  createdDate,
  lastUpdatedDate,
  pageStyle,
  onExportCSV
}: UnifiedStatsHeroProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <UnifiedPageHero
      title={title}
      hashtags={hashtags}
      statusBadge={{
        role: 'Event Statistics',
        level: 'Live Data',
        status: '✅ Active'
      }}
      onExportCSV={onExportCSV}
    >
      {/* Creation and Update Dates */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '100%',
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
            background: 'rgba(68, 68, 68, 0.1)',
            color: '#444444',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            📅 {formatDate(lastUpdatedDate)}
          </span>
        </div>
      </div>
    </UnifiedPageHero>
  );
};
