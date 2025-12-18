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
  
  /** Show date information */
  showDate?: boolean;
  
  /** Show export options */
  showExport?: boolean;
  
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
  showDate = true,
  showExport = true,
  className 
}: ReportHeroProps) {
  
  // Format date for display
  const formattedDate = showDate ? formatDate(project.eventDate) : null;
  
  // Handle PDF export
  const handleExport = () => {
    // TODO: Implement PDF export in Phase 6
    alert('PDF export will be implemented in Phase 6');
  };
  
  return (
    <div className={`${styles.hero} report-hero ${className || ''}`} data-report-section="hero">
      <div className={styles.heroContent}>
        <div className={styles.heroInfo}>
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
        </div>
        
        {showExport && (
          <div className={styles.heroActions}>
            <button 
              className={styles.exportButton}
              onClick={handleExport}
              type="button"
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
