import React from 'react';
import UnifiedPageHero from './UnifiedPageHero';
import { PageStyleEnhanced } from '@/lib/pageStyleTypesEnhanced';
import styles from './UnifiedStatsHero.module.css';

interface Partner {
  _id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
}

interface UnifiedStatsHeroProps {
  title: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  partner1?: Partner | null;
  partner2?: Partner | null;
  createdDate: string;
  lastUpdatedDate: string;
  pageStyle?: PageStyleEnhanced;
  onExportCSV?: () => void;
  onExportPDF?: () => void; // PDF export callback
  extraContent?: React.ReactNode;
  layoutMode?: 'dual-partners' | 'single-partner-spotlight'; // WHAT: Pass layout mode to UnifiedPageHero
  hidePartnerEmoji?: boolean; // WHAT: Optional flag to hide partner emoji
}

export default function UnifiedStatsHero({
  title,
  hashtags = [],
  categorizedHashtags = {},
  partner1,
  partner2,
  createdDate,
  lastUpdatedDate,
  pageStyle,
  onExportCSV,
  onExportPDF,
  extraContent,
  layoutMode = 'single-partner-spotlight', // WHAT: Default to spotlight for reporting pages
  hidePartnerEmoji = false // WHAT: Default to showing emoji
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
      categorizedHashtags={categorizedHashtags}
      partner1={partner1}
      partner2={partner2}
      statusBadge={undefined}
      onExportCSV={onExportCSV}
      onExportPDF={onExportPDF}
      pageStyle={pageStyle}
      layoutMode={layoutMode}
      hidePartnerEmoji={hidePartnerEmoji}
    >
      {/* Creation and Update Dates + Extra Controls */}
      <div className={styles.datesContainer}>
        <div className={styles.dateWrapper}>
          <span>Created:</span>
          <span 
            className={styles.createdDateBadge}
            style={pageStyle ? {
              backgroundColor: pageStyle.colorScheme.primary,
              color: '#ffffff'
            } : undefined}
          >
            📅 {formatDate(createdDate)}
          </span>
        </div>

        <div className={styles.dateWrapper}>
          <span>Last Updated:</span>
          <span 
            className={styles.updatedDateBadge}
            style={pageStyle ? {
              backgroundColor: pageStyle.colorScheme.primary,
              color: '#ffffff'
            } : undefined}
          >
            📅 {formatDate(lastUpdatedDate)}
          </span>
        </div>

        {/* Extra controls injected by pages, e.g., export toggles */}
        {extraContent && (
          <div className={styles.extraContent}>
            {extraContent}
          </div>
        )}
      </div>
    </UnifiedPageHero>
  );
};
