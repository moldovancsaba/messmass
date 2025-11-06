'use client';

// WHAT: Partner report page with SharePopup modal and admin-style event cards
// WHY: Consistent UX - share modal like admin pages, event cards matching admin events display

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import StandardState from '@/components/StandardState';
import UnifiedPageHero from '@/components/UnifiedPageHero';
import ColoredCard from '@/components/ColoredCard';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import { exportPageToPDF } from '@/lib/export/pdf';
import styles from './PartnerReport.module.css';

interface Partner {
  _id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  createdAt: string;
  updatedAt: string;
}

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  viewSlug?: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    remoteImages?: number;
    hostessImages?: number;
    selfies?: number;
    remoteFans?: number;
    stadium?: number;
    eventAttendees?: number;
  };
}

export default function PartnerReportPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Data state
  const [partner, setPartner] = useState<Partner | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  
  // Fetch partner data
  const fetchPartnerData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching partner report for slug:', slug);
      const response = await fetch(`/api/partners/report/${slug}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success) {
        setPartner(data.partner);
        setEvents(data.events || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load partner');
      }
    } catch (err) {
      console.error('Failed to fetch partner:', err);
      setError('Failed to load partner data');
    } finally {
      setLoading(false);
    }
  }, [slug]);
  
  // Check authentication on mount
  useEffect(() => {
    if (slug) {
      const authenticated = isAuthenticated(slug, 'partner-report');
      setIsAuthorized(authenticated);
      setCheckingAuth(false);
      
      if (authenticated) {
        fetchPartnerData();
      }
    }
  }, [slug, fetchPartnerData]);
  
  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthorized(true);
    setCheckingAuth(false);
    fetchPartnerData();
  };
  
  // Export handlers
  const handleExportCSV = () => {
    if (!partner || !events) return;
    
    // WHAT: Inline CSV export implementation
    // WHY: No dedicated CSV utility - implement directly like filter page
    const esc = (v: any) => {
      const s = String(v ?? '');
      return '"' + s.replace(/"/g, '""') + '"';
    };
    
    const rows = events.map(event => {
      const totalImages = (event.stats.remoteImages || 0) + (event.stats.hostessImages || 0) + (event.stats.selfies || 0);
      const totalFans = (event.stats.remoteFans || 0) + (event.stats.stadium || 0);
      
      return [
        event.eventName,
        event.eventDate,
        totalImages,
        totalFans,
        event.stats.eventAttendees || 0,
        event.hashtags?.join(' ') || ''
      ];
    });
    
    const header = ['Event Name', 'Event Date', 'Total Images', 'Total Fans', 'Attendees', 'Hashtags'];
    const csv = [header, ...rows]
      .map(row => row.map(cell => esc(cell)).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${partner.name.replace(/[^a-z0-9]/gi, '-')}-events.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handleExportPDF = async () => {
    if (!partner) return;
    
    // WHAT: Export partner report page to PDF
    // WHY: Allow stakeholders to save/share partner reports offline
    await exportPageToPDF(
      'partner-report-container',
      {
        filename: `${partner.name.replace(/[^a-z0-9]/gi, '-')}-report`,
        orientation: 'portrait',
        quality: 0.95
      }
    );
  };
  
  // Calculate totals from events
  const totals = React.useMemo(() => {
    if (!events || events.length === 0) return null;
    
    return events.reduce((acc, event) => {
      const images = (event.stats.remoteImages || 0) + (event.stats.hostessImages || 0) + (event.stats.selfies || 0);
      const fans = (event.stats.remoteFans || 0) + (event.stats.stadium || 0);
      
      return {
        totalEvents: acc.totalEvents + 1,
        totalImages: acc.totalImages + images,
        totalFans: acc.totalFans + fans,
        totalAttendees: acc.totalAttendees + (event.stats.eventAttendees || 0)
      };
    }, {
      totalEvents: 0,
      totalImages: 0,
      totalFans: 0,
      totalAttendees: 0
    });
  }, [events]);
  
  // Show password gate if not authorized
  if (checkingAuth) {
    return <StandardState variant="loading" message="Checking access..." />;
  }
  
  if (!isAuthorized) {
    return (
      <PagePasswordLogin
        pageId={slug}
        pageType="partner-report"
        onSuccess={handleLoginSuccess}
      />
    );
  }
  
  // Show loading state
  if (loading) {
    return <StandardState variant="loading" message="Loading partner report..." />;
  }
  
  // Show error state
  if (error || !partner) {
    return <StandardState variant="error" message={error || 'Partner not found'} />;
  }
  
  return (
    <div className="page-bg-gray">
      <div className={styles.pageContainer}>
        {/* WHAT: Main content container matching filter page layout
             WHY: Consistent wrapper structure with max-width and centering */}
        <div className={styles.contentWrapper} id="partner-report-container">
          {/* WHAT: Use UnifiedPageHero with single-partner-spotlight mode
               WHY: Centralized styling system, consistent with event reports */}
          <UnifiedPageHero
            title={partner.name}
            hashtags={partner.hashtags}
            categorizedHashtags={partner.categorizedHashtags}
            partner1={{
              _id: partner._id,
              name: partner.name,
              emoji: partner.emoji,
              logoUrl: partner.logoUrl
            }}
          layoutMode="single-partner-spotlight"
          createdDate={partner.createdAt}
          lastUpdatedDate={partner.updatedAt}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        >
            {/* WHAT: Totals Summary Grid - uses CSS module
                 WHY: Key metrics displayed in responsive grid without inline styles */}
            {totals && (
              <div className={styles.totalsGrid}>
                <div className={styles.totalItem}>
                  <div className={styles.totalValue}>
                    {totals.totalEvents}
                  </div>
                  <div className={styles.totalLabel}>
                    Total Events
                  </div>
                </div>
                <div className={styles.totalItem}>
                  <div className={styles.totalValue}>
                    {totals.totalImages.toLocaleString()}
                  </div>
                  <div className={styles.totalLabel}>
                    Total Images
                  </div>
                </div>
                <div className={styles.totalItem}>
                  <div className={styles.totalValue}>
                    {totals.totalFans.toLocaleString()}
                  </div>
                  <div className={styles.totalLabel}>
                    Total Fans
                  </div>
                </div>
                <div className={styles.totalItem}>
                  <div className={styles.totalValue}>
                    {totals.totalAttendees.toLocaleString()}
                  </div>
                  <div className={styles.totalLabel}>
                    Total Attendees
                  </div>
                </div>
              </div>
            )}
          </UnifiedPageHero>
          
          {/* WHAT: Events list section with admin-style cards
               WHY: Match admin events page display with full details, stats, partners */}
          {events.length > 0 && (
            <div className={styles.eventsSection}>
              <ColoredCard>
                <h2 className={styles.eventsTitle}>
                  📊 Related Events ({events.length})
                </h2>
                <div className={styles.eventsGrid}>
                  {events.map((event) => {
                    const totalImages = (event.stats.remoteImages || 0) + 
                                       (event.stats.hostessImages || 0) + 
                                       (event.stats.selfies || 0);
                    const totalFans = (event.stats.remoteFans || 0) + (event.stats.stadium || 0);
                    
                    return (
                      <div key={event._id} className={styles.eventCard}>
                        {/* Event Name and Link */}
                        <div className={styles.eventHeader}>
                          {event.viewSlug ? (
                            <a
                              href={`/report/${event.viewSlug}`}
                              className={styles.eventLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`View ${event.eventName}`}
                            >
                              {event.eventName}
                            </a>
                          ) : (
                            <span className={styles.eventName}>{event.eventName}</span>
                          )}
                        </div>
                        
                        {/* Event Date */}
                        <div className={styles.eventDate}>
                          📅 {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                        
                        {/* Event Stats */}
                        <div className={styles.eventStats}>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>📷 Images:</span>
                            <span className={styles.statValue}>{totalImages.toLocaleString()}</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>👥 Fans:</span>
                            <span className={styles.statValue}>{totalFans.toLocaleString()}</span>
                          </div>
                          {event.stats.eventAttendees ? (
                            <div className={styles.statItem}>
                              <span className={styles.statLabel}>🏟️ Attendees:</span>
                              <span className={styles.statValue}>
                                {event.stats.eventAttendees.toLocaleString()}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        
                        {/* Hashtags */}
                        {(event.hashtags?.length || Object.keys(event.categorizedHashtags || {}).length) ? (
                          <div className={styles.eventHashtags}>
                            {event.hashtags?.slice(0, 4).map((hashtag) => (
                              <ColoredHashtagBubble
                                key={`general-${hashtag}`}
                                hashtag={hashtag}
                                small
                                interactive={false}
                                projectCategorizedHashtags={event.categorizedHashtags}
                                autoResolveColor
                              />
                            ))}
                            {event.categorizedHashtags &&
                              Object.entries(event.categorizedHashtags)
                                .slice(0, 2)
                                .map(([category, hashtags]) =>
                                  hashtags.slice(0, 2).map((hashtag) => (
                                    <ColoredHashtagBubble
                                      key={`${category}-${hashtag}`}
                                      hashtag={`${category}:${hashtag}`}
                                      showCategoryPrefix
                                      small
                                      interactive={false}
                                    />
                                  ))
                                )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </ColoredCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
