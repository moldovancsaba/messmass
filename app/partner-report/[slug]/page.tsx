'use client';

// WHAT: Public partner report page with basic info and related events
// WHY: Allow sharing partner profiles with stakeholders, similar to event stats pages

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import StandardState from '@/components/StandardState';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import { exportPageToPDF } from '@/lib/export/pdf';
import styles from './page.module.css';

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
  viewSlug?: string;
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
      const authenticated = isAuthenticated(slug, 'stats');
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
        pageType="stats"
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
    <div className={styles.container} id="partner-report-container">
      {/* Hero Block with Partner Info */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroHeader}>
            <div className={styles.partnerInfo}>
              {partner.logoUrl && (
                <img 
                  src={partner.logoUrl} 
                  alt={`${partner.name} logo`}
                  className={styles.partnerLogo}
                />
              )}
              <div className={styles.partnerTitle}>
                <span className={styles.partnerEmoji}>{partner.emoji}</span>
                <h1 className={styles.partnerName}>{partner.name}</h1>
              </div>
            </div>
            
            <div className={styles.exportButtons}>
              <button 
                onClick={handleExportCSV}
                className={styles.exportButton}
                title="Export events to CSV"
              >
                📊 Export CSV
              </button>
              <button 
                onClick={handleExportPDF}
                className={styles.exportButton}
                title="Export report to PDF"
              >
                📄 Export PDF
              </button>
            </div>
          </div>
          
          {/* Hashtags */}
          {(partner.hashtags && partner.hashtags.length > 0) || 
           (partner.categorizedHashtags && Object.keys(partner.categorizedHashtags).length > 0) ? (
            <div className={styles.hashtagsSection}>
              <div className={styles.hashtags}>
                {partner.hashtags?.map((hashtag, idx) => (
                  <ColoredHashtagBubble 
                    key={`general-${idx}`}
                    hashtag={hashtag}
                  />
                ))}
                {partner.categorizedHashtags && Object.entries(partner.categorizedHashtags).map(([category, tags]) =>
                  tags.map((tag, idx) => (
                    <ColoredHashtagBubble
                      key={`${category}-${idx}`}
                      hashtag={tag}
                      showCategoryPrefix={true}
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}
          
          {/* Metadata */}
          <div className={styles.metadata}>
            <span className={styles.metaItem}>
              Created: {new Date(partner.createdAt).toLocaleDateString()}
            </span>
            <span className={styles.metaDivider}>•</span>
            <span className={styles.metaItem}>
              Last Updated: {new Date(partner.updatedAt).toLocaleDateString()}
            </span>
          </div>
          
          {/* Totals Summary */}
          {totals && (
            <div className={styles.totalsGrid}>
              <div className={styles.totalCard}>
                <div className={styles.totalValue}>{totals.totalEvents}</div>
                <div className={styles.totalLabel}>Total Events</div>
              </div>
              <div className={styles.totalCard}>
                <div className={styles.totalValue}>{totals.totalImages.toLocaleString()}</div>
                <div className={styles.totalLabel}>Total Images</div>
              </div>
              <div className={styles.totalCard}>
                <div className={styles.totalValue}>{totals.totalFans.toLocaleString()}</div>
                <div className={styles.totalLabel}>Total Fans</div>
              </div>
              <div className={styles.totalCard}>
                <div className={styles.totalValue}>{totals.totalAttendees.toLocaleString()}</div>
                <div className={styles.totalLabel}>Total Attendees</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Events List */}
      <div className={styles.eventsSection}>
        <h2 className={styles.sectionTitle}>Related Events ({events.length})</h2>
        
        {events.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No events found for this partner</p>
          </div>
        ) : (
          <div className={styles.eventsList}>
            {events.map((event) => {
              const totalImages = (event.stats.remoteImages || 0) + (event.stats.hostessImages || 0) + (event.stats.selfies || 0);
              const totalFans = (event.stats.remoteFans || 0) + (event.stats.stadium || 0);
              
              return (
                <div key={event._id} className={styles.eventCard}>
                  <div className={styles.eventHeader}>
                    <h3 className={styles.eventName}>{event.eventName}</h3>
                    <span className={styles.eventDate}>
                      {new Date(event.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className={styles.eventStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{totalImages.toLocaleString()}</span>
                      <span className={styles.statLabel}>Images</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{totalFans.toLocaleString()}</span>
                      <span className={styles.statLabel}>Fans</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>
                        {(event.stats.eventAttendees || 0).toLocaleString()}
                      </span>
                      <span className={styles.statLabel}>Attendees</span>
                    </div>
                  </div>
                  
                  {event.hashtags && event.hashtags.length > 0 && (
                    <div className={styles.eventHashtags}>
                      {event.hashtags.slice(0, 3).map((hashtag, idx) => (
                        <span key={idx} className={styles.hashtagTag}>
                          #{hashtag}
                        </span>
                      ))}
                      {event.hashtags.length > 3 && (
                        <span className={styles.hashtagMore}>
                          +{event.hashtags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {event.viewSlug && (
                    <a 
                      href={`/report/${event.viewSlug}`}
                      className={styles.viewEventLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Report →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
