import React from 'react';
import UnifiedPageHero from './UnifiedPageHero';
import { PageStyle } from '@/lib/pageStyleTypes';
import styles from './UnifiedStatsHero.module.css';

interface UnifiedStatsHeroProps {
  title: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  createdDate: string;
  lastUpdatedDate: string;
  pageStyle?: PageStyle;
  onExportCSV?: () => void;
  onExportPDF?: () => void; // PDF export callback
  extraContent?: React.ReactNode; // Optional controls or info injected by pages (e.g., export toggles)
}

export default function UnifiedStatsHero({
  title,
  hashtags = [],
  categorizedHashtags = {},
  createdDate,
  lastUpdatedDate,
  pageStyle,
  onExportCSV,
  onExportPDF,
  extraContent
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
      statusBadge={undefined}
      onExportCSV={onExportCSV}
      onExportPDF={onExportPDF}
      pageStyle={pageStyle}
    >
      {/* Creation and Update Dates + Extra Controls */}
      <div className={styles.datesContainer}>
        <div className={styles.dateWrapper}>
          <span>Created:</span>
          <span className={styles.createdDateBadge}>
            📅 {formatDate(createdDate)}
          </span>
        </div>

        <div className={styles.dateWrapper}>
          <span>Last Updated:</span>
          <span className={styles.updatedDateBadge}>
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
