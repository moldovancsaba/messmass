// WHAT: Report Hero Section (v12.0.0)
// WHY: Display event information and export options at top of report
// HOW: Clean, responsive header with event details and PDF export button

'use client';

import React from 'react';
import styles from './ReportHero.module.css';

/**
 * Project data for hero display
 */
interface ProjectData {
  eventName: string;
  eventDate: string;
  _id: string;
}

/**
 * Props for ReportHero component
 */
interface ReportHeroProps {
  /** Project/event data */
  project: ProjectData;
  
  /** Optional emoji to display */
  emoji?: string;
  
  /** Partner 1 logo URL (before title) */
  partnerLogo?: string;
  
  /** Partner 2 logo URL (after title) - for match reports */
  partner2Logo?: string;
  
  /** Show date information */
  showDate?: boolean;
  
  /** Show export options */
  showExport?: boolean;
  
  /** CSV export handler */
  onExportCSV?: () => void;
  
  /** PDF export handler */
  onExportPDF?: () => void;
  
  /** Optional CSS class */
  className?: string;
}

/**
 * ReportHero
 * 
 * WHAT: Hero section at top of event reports
 * WHY: Provides context and actions for the report
 * 
 * Features:
 * - Event name and date display
 * - Optional emoji/icon
 * - PDF export button
 * - Responsive layout
 */
export default function ReportHero({ 
  project, 
  emoji,
  partnerLogo,
  partner2Logo,
  showDate = true,
  showExport = true,
  onExportCSV,
  onExportPDF,
  className 
}: ReportHeroProps) {
  
  // Debug: Log partner logos
  console.log('🖼️ [ReportHero] Received partnerLogo (Partner 1):', partnerLogo);
  console.log('🖼️ [ReportHero] Received partner2Logo (Partner 2):', partner2Logo);
  console.log('🖼️ [ReportHero] Will render Partner 1 logo?', !!partnerLogo);
  console.log('🖼️ [ReportHero] Will render Partner 2 logo?', !!partner2Logo);
  
  // Format date for display
  const formattedDate = showDate ? formatDate(project.eventDate) : null;
  
  // WHAT: Handle CSV export
  // WHY: Trigger CSV download with all report data
  const handleCSVExport = () => {
    if (onExportCSV) {
      onExportCSV();
    } else {
      console.warn('CSV export handler not provided');
    }
  };
  
  // WHAT: Handle PDF export
  // WHY: Trigger PDF generation with hero on every page
  const handlePDFExport = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      console.warn('PDF export handler not provided');
    }
  };
  
  return (
    <div className={`${styles.hero} report-hero ${className || ''}`} data-report-section="hero">
      <div className={styles.heroContent}>
        <div className={styles.heroInfo}>
          {partnerLogo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={partnerLogo} 
              alt="Partner Logo" 
              className={styles.heroLogo}
            />
          )}
          {emoji && (
            <span className={styles.heroEmoji} role="img" aria-label="Event">
              {emoji}
            </span>
          )}
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>{project.eventName}</h1>
            {formattedDate && (
              <p className={styles.heroDate}>{formattedDate}</p>
            )}
          </div>
          {partner2Logo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={partner2Logo} 
              alt="Partner 2 Logo" 
              className={styles.heroLogo}
            />
          )}
        </div>
        
        {showExport && (
          <div className={styles.heroActions} data-pdf-export-buttons="true">
            <button 
              className={styles.exportButton}
              onClick={handleCSVExport}
              type="button"
              title="Download complete report data as CSV"
            >
              <span className={styles.exportIcon}>📊</span>
              <span className={styles.exportText}>Export CSV</span>
            </button>
            <button 
              className={styles.exportButton}
              onClick={handlePDFExport}
              type="button"
              title="Download report as PDF document"
            >
              <span className={styles.exportIcon}>📄</span>
              <span className={styles.exportText}>Export PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format ISO date string for display
 * 
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string (e.g., "January 15, 2025")
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return isoDate; // Fallback to raw string
  }
}
