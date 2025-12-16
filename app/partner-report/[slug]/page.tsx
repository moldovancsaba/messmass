'use client';

// WHAT: Partner report page with SharePopup modal and admin-style event cards
// WHY: Consistent UX - share modal like admin pages, event cards matching admin events display

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import PagePasswordLogin, { isAuthenticated } from '@/components/PagePasswordLogin';
import StandardState from '@/components/StandardState';
import ResourceLoader from '@/components/ResourceLoader';
import UnifiedPageHero from '@/components/UnifiedPageHero';
import UnifiedDataVisualization from '@/components/UnifiedDataVisualization';
import ColoredCard from '@/components/ColoredCard';
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
import { exportPageToPDF } from '@/lib/export/pdf';
import { ChartConfiguration, ChartCalculationResult } from '@/lib/chartConfigTypes';
import { calculateActiveCharts } from '@/lib/chartCalculator';
import { DataVisualizationBlock } from '@/lib/pageStyleTypes';
import { PageStyleEnhanced, generateGradientCSS } from '@/lib/pageStyleTypesEnhanced';
import styles from './PartnerReport.module.css';

interface Partner {
  _id: string;
  name: string;
  emoji: string;
  logoUrl?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  styleId?: string;
  reportTemplateId?: string;
  createdAt: string;
  updatedAt: string;
  // WHAT: Partner-level stats for content (reportText*, reportImage*)
  // WHY: Partner editor creates content that should appear in partner reports
  stats?: { [key: string]: string | number | undefined };
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
  const [chartsLoading, setChartsLoading] = useState(false);
  const [styleLoading, setStyleLoading] = useState(true);
  
  // WHAT: Template and visualization state (v11.0.0)
  // WHY: Support visualization blocks in partner reports
  const [template, setTemplate] = useState<any>(null);
  const [dataBlocks, setDataBlocks] = useState<DataVisualizationBlock[]>([]);
  const [chartConfigurations, setChartConfigurations] = useState<ChartConfiguration[]>([]);
  const [gridUnits, setGridUnits] = useState<{ desktop: number; tablet: number; mobile: number }>({ desktop: 6, tablet: 3, mobile: 2 });
  const [pageStyle, setPageStyle] = useState<PageStyleEnhanced | null>(null);
  
  
  // WHAT: Fetch report template configuration (v11.0.0)
  // WHY: Partner reports should use default event template for universal compatibility
  const fetchReportTemplate = useCallback(async (partnerData: Partner) => {
    try {
      console.log('🎨 Loading partner report template...');
      console.log('📋 Partner:', partnerData.name);
      
      // WHAT: Use proper partner template resolution
      // WHY: Partners may have their own specific templates assigned
      // HOW: Use partner slug to resolve template hierarchy: partner-specific → default
      const response = await fetch(`/api/report-config/${slug}?type=partner`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success && data.template) {
        console.log('✅ Loaded template:', data.template.name, '(resolved from:', data.resolvedFrom, ')');
        console.log('✅ Template ID:', data.template._id);
        console.log('✅ Template data blocks:', data.template.dataBlocks?.length || 0);
        
        // Store template data including HERO settings
        setTemplate(data.template);
        
        // WHAT: Use partner's direct style if available, otherwise use template style
        // WHY: Partner can override template style with their own branding
        let styleToUse = null;
        
        // Check if partner has direct styleId (highest priority)
        if (partnerData.styleId) {
          try {
            console.log('🎨 Partner has direct styleId - fetching:', partnerData.styleId);
            const styleResponse = await fetch(`/api/page-styles-enhanced?styleId=${partnerData.styleId}`, { cache: 'no-store' });
            const styleData = await styleResponse.json();
            if (styleData.success && styleData.style) {
              styleToUse = styleData.style;
              console.log('✅ Using partner direct style:', styleData.style.name);
            }
          } catch (styleErr) {
            console.warn('⚠️  Could not fetch partner style, trying template style:', styleErr);
          }
        }
        
        // Fall back to template style if no partner style
        if (!styleToUse && data.template.styleId) {
          try {
            console.log('🎨 Using template styleId:', data.template.styleId);
            const styleResponse = await fetch(`/api/page-styles-enhanced?styleId=${data.template.styleId}`, { cache: 'no-store' });
            const styleData = await styleResponse.json();
            if (styleData.success && styleData.style) {
              styleToUse = styleData.style;
              console.log('✅ Using template style:', styleData.style.name);
            }
          } catch (styleErr) {
            console.warn('⚠️  Could not fetch template style:', styleErr);
          }
        }
        
        if (styleToUse) {
          setPageStyle(styleToUse);
          console.log('🎨 Style applied:', styleToUse.name);
        } else {
          console.log('ℹ️  No custom style found, will use default styling');
          // Don't set pageStyle - let it remain null for default styling
        }
        
        // Mark style loading as complete
        setStyleLoading(false);
        
        // WHAT: Load data blocks from template (these define the visualization layout)
        // WHY: Template specifies which charts/blocks to show and in what order
        console.log('📊 Template has', data.template.dataBlocks?.length || 0, 'data blocks');
        
        if (data.template.dataBlocks && data.template.dataBlocks.length > 0) {
          console.log('📊 Data blocks from template:', data.template.dataBlocks);
          console.log('📊 Block details:');
          data.template.dataBlocks.forEach((block: any, index: number) => {
            console.log(`  Block ${index + 1}: ${block.name} (${block.charts?.length || 0} charts) - Active: ${block.isActive !== false}`);
          });
          setDataBlocks(data.template.dataBlocks);
        } else {
          console.warn('⚠️  Template has no data blocks configured');
          setDataBlocks([]);
        }
        
        // Set grid settings from template
        if (data.template.gridSettings) {
          console.log('📐 Setting grid units from template:', data.template.gridSettings);
          setGridUnits(data.template.gridSettings);
        }
      } else {
        console.warn('⚠️  Failed to load report template:', data.error);
        setDataBlocks([]);
        setStyleLoading(false); // Mark style loading as complete even if template fails
      }
    } catch (err) {
      console.error('⚠️  Failed to fetch report template:', err);
      setStyleLoading(false); // Mark style loading as complete even if there's an error
      // Continue without template - just show event list
    }
  }, []);

  // WHAT: Fetch partner data and report configuration (v11.0.0)
  // WHY: Load both partner details and visualization template
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
        
        // WHAT: Fetch partner's assigned report template (or default if none assigned)
        // WHY: Partners should use their selected template, not hardcoded default
        await fetchReportTemplate(data.partner);
        
        console.log('🎯 Partner reports use assigned template with aggregated event data');
      } else {
        setError(data.error || 'Failed to load partner');
      }
    } catch (err) {
      console.error('Failed to fetch partner:', err);
      setError('Failed to load partner data');
    } finally {
      setLoading(false);
    }
  }, [slug, fetchReportTemplate]);
  
  // WHAT: Fetch chart configurations for visualization
  // WHY: Need chart definitions to calculate aggregate stats
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const response = await fetch('/api/chart-config/public', { cache: 'no-store' });
        const data = await response.json();
        if (data.success) {
          setChartConfigurations(data.configurations);
        }
      } catch (err) {
        console.error('Failed to fetch chart configurations:', err);
      }
    };
    fetchCharts();
  }, []);
  
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
  
  // WHAT: Calculate aggregate stats from all partner events (exactly like filter page)
  // WHY: Charts need aggregated data to render partner-level visualizations  
  // HOW: Create a project-like object with stats property, matching filter page structure
  const aggregateProject = useMemo(() => {
    if (!events || events.length === 0) return null;
    
    // Initialize aggregator with all possible fields (same as filter page ProjectStats interface)
    const stats: any = {
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      remoteFans: 0,
      stadium: 0,
      indoor: 0,
      outdoor: 0,
      female: 0,
      male: 0,
      genAlpha: 0,
      genYZ: 0,
      genX: 0,
      boomer: 0,
      merched: 0,
      jersey: 0,
      scarf: 0,
      flags: 0,
      baseballCap: 0,
      other: 0,
      eventAttendees: 0,
      eventTicketPurchases: 0,
      visitQrCode: 0,
      visitShortUrl: 0,
      visitWeb: 0,
      visitFacebook: 0,
      visitInstagram: 0,
      visitYoutube: 0,
      visitTiktok: 0,
      visitX: 0,
      visitTrustpilot: 0,
      eventResultHome: 0,
      eventResultVisitor: 0,
      eventValuePropositionVisited: 0,
      eventValuePropositionPurchases: 0,
      approvedImages: 0,
      rejectedImages: 0
    };
    
    // Sum all stats across events
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats as any)[key];
        if (typeof value === 'number') {
          stats[key] = (stats[key] || 0) + value;
        }
      });
    });
    
    // WHAT: Merge partner-level content (reportText*, reportImage*) with aggregated event data
    // WHY: Partner editor creates partner-specific content that should appear in partner reports
    // HOW: Add partner.stats (text/image content) to the aggregated numeric stats
    if (partner && partner.stats) {
      console.log('🖼️ Partner stats available:', Object.keys(partner.stats));
      const imageKeys = Object.keys(partner.stats).filter(key => key.startsWith('reportImage'));
      const textKeys = Object.keys(partner.stats).filter(key => key.startsWith('reportText'));
      console.log('🖼️ Partner image keys:', imageKeys);
      console.log('📝 Partner text keys:', textKeys);
      
      Object.keys(partner.stats).forEach(key => {
        const value = (partner.stats as any)[key];
        // WHAT: Include text and image content from partner editor
        // WHY: Charts need access to reportText* and reportImage* fields
        if (typeof value === 'string' && value.length > 0) {
          stats[key] = value; // Partner-level text/image content (e.g., reportImage1)
          stats[`stats.${key}`] = value; // Also add with stats. prefix for formula compatibility
          if (key.startsWith('reportImage')) {
            console.log(`🖼️ Added partner image ${key}:`, value);
            console.log(`🖼️ Also added stats.${key}:`, value);
          }
        }
      });
    } else {
      console.log('⚠️ No partner stats available for content');
    }
    
    // WHAT: Create project-like object matching filter page structure
    // WHY: Filter page expects project.stats, so we create same structure
    // HOW: Return object with stats property containing aggregated data + partner content
    const projectLike = {
      stats,
      eventCount: events.length,
      dateRange: {
        oldest: events.length > 0 ? events[events.length - 1].eventDate : '',
        newest: events.length > 0 ? events[0].eventDate : '',
        formatted: `${events.length} events`
      }
    };
    
    console.log('📊 Calculated aggregate project for', events.length, 'events');
    console.log('📊 Key totals: Images =', stats.remoteImages + stats.hostessImages + stats.selfies, ', Fans =', stats.female + stats.male);
    return projectLike;
  }, [events]);
  
  // WHAT: Calculate chart results from aggregate stats (exactly like filter page)
  // WHY: UnifiedDataVisualization needs chart results to render
  const [chartResults, setChartResults] = useState<ChartCalculationResult[]>([]);
  
  useEffect(() => {
    if (aggregateProject && chartConfigurations.length > 0) {
      setChartsLoading(true);
      try {
        // WHAT: Use identical chart calculation as filter page
        // WHY: Filter page works with: calculateActiveCharts(chartConfigurations, project.stats)
        // HOW: Pass aggregateProject.stats directly to calculateActiveCharts
        console.log('🧮 Calculating chart results with partner aggregate stats (filter page method)...');
        console.log('Stats for calculation:', aggregateProject.stats);
        
        // Debug: Show all reportImage* and reportText* fields
        const imageFields = Object.keys(aggregateProject.stats).filter(key => key.includes('reportImage'));
        const textFields = Object.keys(aggregateProject.stats).filter(key => key.includes('reportText'));
        console.log('🖼️ Available image fields:', imageFields);
        console.log('📝 Available text fields:', textFields);
        imageFields.forEach(field => {
          console.log(`🖼️ ${field}:`, aggregateProject.stats[field]);
        });
        
        const results = calculateActiveCharts(chartConfigurations, aggregateProject.stats);
        console.log('✅ Calculated', results.length, 'chart results from aggregate stats');
        setChartResults(results);
      } catch (err) {
        console.error('❌ Failed to calculate chart results:', err);
        setChartResults([]);
      } finally {
        setChartsLoading(false);
      }
    }
  }, [aggregateProject, chartConfigurations]);
  
  // Calculate simple totals for hero display
  const totals = useMemo(() => {
    if (!events || events.length === 0 || !aggregateProject) return null;
    
    const stats = aggregateProject.stats;
    return {
      totalEvents: events.length,
      totalImages: (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0),
      totalFans: (stats.remoteFans || 0) + (stats.stadium || 0),
      totalAttendees: stats.eventAttendees || 0
    };
  }, [events, aggregateProject]);
  
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
  
  // Show error state
  if (error || !partner) {
    return <StandardState variant="error" message={error || 'Partner not found'} />;
  }
  
  // WHAT: Collect logo URLs for preloading
  // WHY: Prevent logo pop-in after page renders
  const logoUrls = [partner?.logoUrl].filter(Boolean) as string[];
  
  // WHAT: Use ResourceLoader to wait for all critical resources
  // WHY: Prevent visual flashing - show branded loading screen until everything is ready
  return (
    <ResourceLoader
      partner={partner ? {
        name: partner.name,
        emoji: partner.emoji,
        logoUrl: partner.logoUrl
      } : null}
      isLoading={loading || styleLoading} // Wait for both data and style
      logoUrls={logoUrls}
      fontFamily={pageStyle?.typography?.fontFamily}
      hasPageStyle={!styleLoading} // True when style loading is complete (regardless of success)
      minLoadingTime={500}
    >
      {/* WHAT: Partner report content after all resources loaded */}
    <div 
      className="admin-container"
      style={(() => {
        const baseStyle = { minHeight: '100vh' };
        
        if (!pageStyle) {
          // No custom style - use default styling
          console.log('🎨 Using default styling (no custom pageStyle)');
          return {
            ...baseStyle,
            background: '#f9fafb', // Default light gray background
            color: '#111827', // Default dark text
            fontFamily: 'system-ui, -apple-system, sans-serif' // Default system font
          };
        }
        
        // Custom style - fully dynamic
        const safeColor = (typeof pageStyle.typography?.primaryTextColor === 'string' && pageStyle.typography.primaryTextColor.trim()) ? pageStyle.typography.primaryTextColor.trim() : '#111827';
        const safeFont = (typeof pageStyle.typography?.fontFamily === 'string' && pageStyle.typography.fontFamily.trim()) ? pageStyle.typography.fontFamily.trim() : 'system-ui, -apple-system, sans-serif';
        const backgroundCSS = generateGradientCSS(pageStyle.pageBackground) || '#ffffff';
        
        console.log('🎨 Applying custom partner style:', {
          partnerName: partner?.name,
          styleName: pageStyle.name,
          backgroundCSS,
          safeColor,
          safeFont
        });
        
        return {
          ...baseStyle,
          background: backgroundCSS,
          color: safeColor,
          fontFamily: safeFont
        };
      })()}
    >
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
          pageStyle={pageStyle || undefined}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          heroSettings={template?.heroSettings}
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
          
          {/* WHAT: Visualization blocks section (v11.0.0)
               WHY: Display partner-level aggregate stats with charts (same as hashtag page)
               HOW: Always render UnifiedDataVisualization like hashtag page does */}
          <div className={styles.visualizationSection}>
            <UnifiedDataVisualization
              blocks={dataBlocks}
              chartResults={chartResults}
              loading={chartsLoading}
              gridUnits={gridUnits}
              useChartContainer={false}
              pageStyle={pageStyle || undefined}
            />
          </div>
          
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
    </ResourceLoader>
  );
}
