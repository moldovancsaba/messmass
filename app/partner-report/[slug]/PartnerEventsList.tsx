// WHAT: Partner Events List Component (v12.0.0)
// WHY: Show all events for this partner at bottom of partner report
// HOW: Display event cards with links to individual event reports

'use client';

import React from 'react';
import Link from 'next/link';
import styles from './PartnerEventsList.module.css';

/**
 * Event data structure
 * WHAT: Type-safe event interface matching PartnerReportData
 * WHY: Prevents type errors when passing events from usePartnerReportData
 */
interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  viewSlug?: string; // Optional - some events may not have public slugs
  stats?: {
    remoteImages?: number;
    hostessImages?: number;
    selfies?: number;
    female?: number;
    male?: number;
    indoor?: number;
    outdoor?: number;
    remoteFans?: number;
    stadium?: number;
    totalFans?: number;
    allImages?: number;
  };
}

/**
 * Props for PartnerEventsList
 */
interface PartnerEventsListProps {
  events: Event[];
  partnerName: string;
  showEventsList?: boolean; // WHAT: Controls whether to show the events list
  showEventsListTitle?: boolean; // WHAT: Controls whether to show the events list title
  showEventsListDetails?: boolean; // WHAT: Controls whether event cards show detailed info or just titles
}

/**
 * PartnerEventsList
 * 
 * WHAT: Displays list of all events for a partner
 * WHY: Users need to see and access individual event reports
 * 
 * Features:
 * - Shows event name and date
 * - Quick stats summary (images, fans)
 * - Links to individual event reports
 * - Responsive grid layout
 * - Optional visibility control via showEventsList prop
 * - Optional title visibility control via showEventsListTitle prop
 * - Optional details visibility control via showEventsListDetails prop
 */
export default function PartnerEventsList({ events, partnerName, showEventsList = true, showEventsListTitle = true, showEventsListDetails = true }: PartnerEventsListProps) {
  // WHAT: Respect showEventsList setting
  // WHY: Partners can control whether events list appears on their report page
  if (!showEventsList || !events || events.length === 0) {
    return null;
  }

  return (
    <div className={styles.eventsSection}>
      {/* WHAT: Conditionally render title based on showEventsListTitle */}
      {/* WHY: Partners can show events list but hide the title */}
      {showEventsListTitle && (
        <h2 className={styles.title}>
          {partnerName} Events ({events.length})
        </h2>
      )}
      
      <div className={styles.eventsGrid}>
        {events
          .filter(event => event.viewSlug) // Only show events with public slugs
          .map((event) => (
            <EventCard key={event._id} event={event} showDetails={showEventsListDetails} />
          ))}
      </div>
    </div>
  );
}

/**
 * Single event card
 */
function EventCard({ event, showDetails = true }: { event: Event; showDetails?: boolean }) {
  const totalImages = getTotalImages(event.stats);
  const totalFans = getTotalFans(event.stats);
  
  // Format date
  const formattedDate = formatDate(event.eventDate);
  
  // Skip if no viewSlug (should be filtered out, but defensive check)
  if (!event.viewSlug) {
    return null;
  }

  return (
    <Link 
      href={`/report/${event.viewSlug}`}
      className={styles.eventCard}
    >
      <div className={styles.eventHeader}>
        <h3 className={styles.eventName}>{event.eventName}</h3>
        {/* WHAT: Conditionally show date based on showDetails */}
        {showDetails && <p className={styles.eventDate}>{formattedDate}</p>}
      </div>
      
      {/* WHAT: Conditionally show stats based on showDetails */}
      {showDetails && (
        <div className={styles.eventStats}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>📸</span>
            <span className={styles.statValue}>{totalImages}</span>
            <span className={styles.statLabel}>Images</span>
          </div>
          
          <div className={styles.stat}>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statValue}>{totalFans}</span>
            <span className={styles.statLabel}>Fans</span>
          </div>
        </div>
      )}
      
      {/* WHAT: Conditionally show action button based on showDetails */}
      {showDetails && (
        <div className={styles.eventAction}>
          <span className={styles.actionText}>View Report</span>
          <span className={styles.actionArrow}>→</span>
        </div>
      )}
    </Link>
  );
}

/**
 * Format ISO date string for display
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return isoDate;
  }
}

function getTotalImages(stats?: Event['stats']): number {
  if (!stats) {
    return 0;
  }

  return Number(stats.remoteImages || 0) +
    Number(stats.hostessImages || 0) +
    Number(stats.selfies || 0);
}

function getTotalFans(stats?: Event['stats']): number {
  if (!stats) {
    return 0;
  }

  const totalFans = toFiniteNumber(stats.totalFans);
  if (totalFans !== null) {
    return totalFans;
  }

  const remoteFans = toFiniteNumber(stats.remoteFans);
  const derivedRemoteFans = remoteFans !== null
    ? remoteFans
    : Number(stats.indoor || 0) + Number(stats.outdoor || 0);

  return derivedRemoteFans + Number(stats.stadium || 0);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
