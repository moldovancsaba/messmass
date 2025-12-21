'use client';

/**
 * Partner Analytics Dashboard
 * 
 * WHAT: Comprehensive analytics view for individual partners
 * WHY: Enable stakeholders to track partner performance, trends, and demographics
 * 
 * Route: /admin/partners/[partnerId]/analytics
 * 
 * Features:
 * - Overview: Summary metrics, best event, trends
 * - Events: All partner events with performance table
 * - Demographics: Gender, age, venue distribution
 * - Trends: Time-series charts for key metrics
 * - Comparisons: Season-over-season, home vs away
 * 
 * Version: 11.39.0
 * Created: 2025-12-20T20:10:00.000Z (UTC)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import styles from './analytics.module.css';

// Tab types
type TabType = 'overview' | 'events' | 'demographics' | 'trends' | 'comparisons';

interface PartnerAnalyticsData {
  partnerId: string;
  partnerName: string;
  partnerType: 'team' | 'league' | 'sponsor' | 'venue';
  partnerEmoji?: string;
  eventCount: number;
  summary: {
    totalEvents: number;
    totalFans: number;
    totalImages: number;
    totalMerched: number;
    totalAdValue: number;
    avgEngagementRate: number;
    avgPenetrationRate: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
  events: Array<{
    projectId: string;
    eventDate: string;
    isHomeGame?: boolean;
    opponentName?: string;
    fans: number;
    merched: number;
    adValue: number;
    engagementRate: number;
  }>;
}

export default function PartnerAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const [partnerId, setPartnerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [analyticsData, setAnalyticsData] = useState<PartnerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Unwrap params
  useEffect(() => {
    params.then((resolvedParams) => {
      setPartnerId(resolvedParams.id);
    });
  }, [params]);

  // Fetch partner analytics data
  useEffect(() => {
    if (!partnerId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/analytics/partner/${partnerId}?includeEvents=true`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch partner analytics');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load analytics');
        }

        setAnalyticsData(result.data);
      } catch (err) {
        console.error('Error fetching partner analytics:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [partnerId]);

  // Auth check
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/admin/login');
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-card">
          <p>Loading partner analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !analyticsData) {
    return (
      <div className="admin-container">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error || 'Failed to load partner analytics'}</p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
            style={{ marginTop: 'var(--mm-space-4)' }} /* Token-driven: legitimate */
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Empty state - no events
  if (analyticsData.eventCount === 0) {
    return (
      <div className="admin-container">
        <div className="card card-lg p-xl">
          <h2 className="section-title">
            {analyticsData.partnerEmoji} {analyticsData.partnerName}
          </h2>
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No events found for this partner.
            </p>
            <button
              onClick={() => router.push('/admin/partners')}
              className="btn btn-primary"
            >
              Back to Partners
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="card card-md p-lg mb-lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--mm-space-4)' }}>
          <div>
            <h1 className="section-title" style={{ margin: 0 }}>
              {analyticsData.partnerEmoji} {analyticsData.partnerName}
            </h1>
            <p style={{ color: 'var(--mm-gray-600)', fontSize: 'var(--mm-font-size-sm)', margin: '0.5rem 0 0 0' }}>
              Partner Analytics Dashboard • {analyticsData.summary.totalEvents} Events
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/partners')}
            className="btn btn-secondary"
          >
            Back to Partners
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-container" style={{ marginTop: 'var(--mm-space-6)' }}>
          <button
            className={`tab-button ${activeTab === 'overview' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'events' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📅 Events
          </button>
          <button
            className={`tab-button ${activeTab === 'demographics' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('demographics')}
          >
            👥 Demographics
          </button>
          <button
            className={`tab-button ${activeTab === 'trends' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            📈 Trends
          </button>
          <button
            className={`tab-button ${activeTab === 'comparisons' ? 'tab-button-active' : ''}`}
            onClick={() => setActiveTab('comparisons')}
          >
            ⚖️ Comparisons
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card card-md p-lg">
        {activeTab === 'overview' && (
          <OverviewTab data={analyticsData} />
        )}
        {activeTab === 'events' && (
          <EventsTab data={analyticsData} />
        )}
        {activeTab === 'demographics' && (
          <DemographicsTab partnerId={partnerId} />
        )}
        {activeTab === 'trends' && (
          <TrendsTab partnerId={partnerId} />
        )}
        {activeTab === 'comparisons' && (
          <ComparisonsTab partnerId={partnerId} />
        )}
      </div>
    </div>
  );
}

/**
 * Overview Tab Component
 * Shows summary metrics, best event, and trend indicators
 */
function OverviewTab({ data }: { data: PartnerAnalyticsData }) {
  return (
    <div>
      <h2 className="section-subtitle">Overview</h2>

      {/* Summary Cards */}
      <div className="stats-grid-admin" style={{ marginBottom: '2rem' }}>
        <div className="stat-card-admin success-manager">
          <div className="stat-label-admin">Total Events</div>
          <div className="stat-value-admin">{data.summary.totalEvents}</div>
          <div className="stat-subtitle">
            {new Date(data.summary.dateRange.earliest).toLocaleDateString()} -{' '}
            {new Date(data.summary.dateRange.latest).toLocaleDateString()}
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-label-admin">Total Fans</div>
          <div className="stat-value-admin">{data.summary.totalFans.toLocaleString()}</div>
          <div className="stat-subtitle">
            Avg: {Math.round(data.summary.totalFans / data.summary.totalEvents).toLocaleString()} per event
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-label-admin">Total Ad Value</div>
          <div className="stat-value-admin">
            €{Math.round(data.summary.totalAdValue).toLocaleString()}
          </div>
          <div className="stat-subtitle">
            Avg: €{Math.round(data.summary.totalAdValue / data.summary.totalEvents).toLocaleString()} per event
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-label-admin">Avg Engagement Rate</div>
          <div className="stat-value-admin">{(data.summary.avgEngagementRate * 100).toFixed(1)}%</div>
          <div className="stat-subtitle">Images per attendee</div>
        </div>
      </div>

      {/* Best Event (if events available) */}
      {data.events.length > 0 && (
        <div className="card p-lg" style={{ marginBottom: '2rem', background: 'var(--mm-gray-50)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--mm-gray-900)' }}>
            🏆 Best Performing Event
          </h3>
          {(() => {
            const bestEvent = data.events.reduce((max, event) =>
              event.fans > max.fans ? event : max
            );
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {new Date(bestEvent.eventDate).toLocaleDateString()}
                    {bestEvent.opponentName && ` vs ${bestEvent.opponentName}`}
                  </p>
                  <p style={{ color: 'var(--mm-gray-600)', fontSize: 'var(--mm-font-size-sm)' }}>
                    {bestEvent.fans.toLocaleString()} fans • €{Math.round(bestEvent.adValue).toLocaleString()} ad value
                  </p>
                </div>
                <a
                  href={`/admin/projects`}
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  View Details
                </a>
              </div>
            );
          })()}
        </div>
      )}

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card p-md">
          <div style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)', marginBottom: '0.5rem' }}>
            Total Images
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--mm-color-primary-600)' }}>
            {data.summary.totalImages.toLocaleString()}
          </div>
        </div>

        <div className="card p-md">
          <div style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)', marginBottom: '0.5rem' }}>
            Total Merched
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--mm-color-secondary-600)' }}>
            {data.summary.totalMerched.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Events Tab Component
 * Shows table of all partner events
 */
function EventsTab({ data }: { data: PartnerAnalyticsData }) {
  return (
    <div>
      <h2 className="section-subtitle">All Events ({data.events.length})</h2>

      {data.events.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--mm-gray-600)' }}>
          No events found for this partner.
        </p>
      ) : (
        <div className="projects-table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Location</th>
                <th>Fans</th>
                <th>Merched</th>
                <th>Ad Value</th>
                <th>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {data.events
                .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                .map((event) => (
                  <tr key={event.projectId}>
                    <td>{new Date(event.eventDate).toLocaleDateString()}</td>
                    <td>{event.opponentName || '—'}</td>
                    <td>{event.isHomeGame !== undefined ? (event.isHomeGame ? '🏠 Home' : '✈️ Away') : '—'}</td>
                    <td style={{ fontWeight: 'bold' }}>{event.fans.toLocaleString()}</td>
                    <td>{event.merched.toLocaleString()}</td>
                    <td>€{Math.round(event.adValue).toLocaleString()}</td>
                    <td>{(event.engagementRate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Demographics Tab Component
 * Placeholder - will fetch and display demographic aggregates
 */
function DemographicsTab({ partnerId }: { partnerId: string }) {
  return (
    <div>
      <h2 className="section-subtitle">Demographics</h2>
      <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--mm-gray-600)' }}>
        Demographics charts coming in next update.
      </p>
    </div>
  );
}

/**
 * Trends Tab Component
 * Placeholder - will fetch and display time-series trends
 */
function TrendsTab({ partnerId }: { partnerId: string }) {
  return (
    <div>
      <h2 className="section-subtitle">Trends</h2>
      <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--mm-gray-600)' }}>
        Trend charts coming in next update.
      </p>
    </div>
  );
}

/**
 * Comparisons Tab Component
 * Implements season-over-season and home vs away analysis
 */
function ComparisonsTab({ partnerId }: { partnerId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState<PartnerAnalyticsData | null>(null);
  const [selectedSeason1, setSelectedSeason1] = useState<string>('');
  const [selectedSeason2, setSelectedSeason2] = useState<string>('');

  // Fetch partner analytics with events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/partner/${partnerId}?includeEvents=true`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        setAnalyticsData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [partnerId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading comparison data...</p>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--mm-error)' }}>
        <p>Error: {error || 'Failed to load data'}</p>
      </div>
    );
  }

  // Detect seasons from event dates
  const seasons = detectSeasons(analyticsData.events);
  
  // Calculate home vs away stats
  const homeAwayStats = calculateHomeAwayStats(analyticsData.events);

  // Calculate season comparison if two seasons selected
  let seasonComparison: SeasonComparisonData | null = null;
  if (selectedSeason1 && selectedSeason2) {
    seasonComparison = compareSeasons(
      analyticsData.events,
      selectedSeason1,
      selectedSeason2
    );
  }

  return (
    <div>
      <h2 className="section-subtitle">Comparisons</h2>

      {/* Season-over-Season Comparison */}
      {seasons.length >= 2 ? (
        <div className="card p-lg" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Season-over-Season Comparison</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="form-label-block">Season 1</label>
              <select
                className="form-input"
                value={selectedSeason1}
                onChange={(e) => setSelectedSeason1(e.target.value)}
              >
                <option value="">Select season...</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.label} ({season.eventCount} events)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label-block">Season 2</label>
              <select
                className="form-input"
                value={selectedSeason2}
                onChange={(e) => setSelectedSeason2(e.target.value)}
              >
                <option value="">Select season...</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.label} ({season.eventCount} events)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {seasonComparison && (
            <div>
              <div className="stats-grid-admin" style={{ marginBottom: '1rem' }}>
                <ComparisonMetric
                  label="Total Events"
                  value1={seasonComparison.season1.totalEvents}
                  value2={seasonComparison.season2.totalEvents}
                  format="number"
                />
                <ComparisonMetric
                  label="Total Fans"
                  value1={seasonComparison.season1.totalFans}
                  value2={seasonComparison.season2.totalFans}
                  format="number"
                />
                <ComparisonMetric
                  label="Avg Fans per Event"
                  value1={seasonComparison.season1.avgFans}
                  value2={seasonComparison.season2.avgFans}
                  format="number"
                />
                <ComparisonMetric
                  label="Avg Engagement Rate"
                  value1={seasonComparison.season1.avgEngagement}
                  value2={seasonComparison.season2.avgEngagement}
                  format="percent"
                />
              </div>
            </div>
          )}

          {!selectedSeason1 || !selectedSeason2 ? (
            <p style={{ textAlign: 'center', color: 'var(--mm-gray-600)', fontSize: 'var(--mm-font-size-sm)' }}>
              Select two seasons to compare
            </p>
          ) : null}
        </div>
      ) : (
        <div className="card p-lg" style={{ marginBottom: '2rem', background: 'var(--mm-gray-50)' }}>
          <p style={{ textAlign: 'center', color: 'var(--mm-gray-600)' }}>
            Not enough data for season comparison. Need at least 2 seasons worth of events.
          </p>
        </div>
      )}

      {/* Home vs Away Performance */}
      {homeAwayStats && (homeAwayStats.homeGames.count > 0 || homeAwayStats.awayGames.count > 0) ? (
        <div className="card p-lg">
          <h3 style={{ marginBottom: '1rem' }}>Home vs. Away Performance</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Home Games */}
            <div>
              <h4 style={{ marginBottom: '1rem', color: 'var(--mm-color-primary-600)' }}>
                🏠 Home Games ({homeAwayStats.homeGames.count})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <StatRow label="Avg Fans" value={Math.round(homeAwayStats.homeGames.avgFans).toLocaleString()} />
                <StatRow label="Avg Merched" value={Math.round(homeAwayStats.homeGames.avgMerched).toLocaleString()} />
                <StatRow label="Avg Ad Value" value={`€${Math.round(homeAwayStats.homeGames.avgAdValue).toLocaleString()}`} />
                <StatRow label="Avg Engagement" value={`${(homeAwayStats.homeGames.avgEngagement * 100).toFixed(1)}%`} />
              </div>
            </div>

            {/* Away Games */}
            <div>
              <h4 style={{ marginBottom: '1rem', color: 'var(--mm-color-secondary-600)' }}>
                ✈️ Away Games ({homeAwayStats.awayGames.count})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <StatRow label="Avg Fans" value={Math.round(homeAwayStats.awayGames.avgFans).toLocaleString()} />
                <StatRow label="Avg Merched" value={Math.round(homeAwayStats.awayGames.avgMerched).toLocaleString()} />
                <StatRow label="Avg Ad Value" value={`€${Math.round(homeAwayStats.awayGames.avgAdValue).toLocaleString()}`} />
                <StatRow label="Avg Engagement" value={`${(homeAwayStats.awayGames.avgEngagement * 100).toFixed(1)}%`} />
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--mm-gray-50)', borderRadius: '8px' }}>
            <p style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-700)' }}>
              <strong>Insight:</strong>{' '}
              {homeAwayStats.homeGames.avgFans > homeAwayStats.awayGames.avgFans
                ? `Home games average ${Math.round(((homeAwayStats.homeGames.avgFans - homeAwayStats.awayGames.avgFans) / homeAwayStats.awayGames.avgFans) * 100)}% more fans than away games.`
                : homeAwayStats.awayGames.avgFans > homeAwayStats.homeGames.avgFans
                ? `Away games average ${Math.round(((homeAwayStats.awayGames.avgFans - homeAwayStats.homeGames.avgFans) / homeAwayStats.homeGames.avgFans) * 100)}% more fans than home games.`
                : 'Home and away games have similar fan attendance.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-lg" style={{ background: 'var(--mm-gray-50)' }}>
          <p style={{ textAlign: 'center', color: 'var(--mm-gray-600)' }}>
            No home/away data available. Events need isHomeGame field populated.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper Components and Functions

interface SeasonComparisonData {
  season1: {
    totalEvents: number;
    totalFans: number;
    avgFans: number;
    avgEngagement: number;
  };
  season2: {
    totalEvents: number;
    totalFans: number;
    avgFans: number;
    avgEngagement: number;
  };
}

function ComparisonMetric({
  label,
  value1,
  value2,
  format,
}: {
  label: string;
  value1: number;
  value2: number;
  format: 'number' | 'percent';
}) {
  const delta = value1 - value2;
  const deltaPercent = value2 !== 0 ? ((delta / value2) * 100) : 0;
  const isPositive = delta > 0;
  const isNeutral = Math.abs(deltaPercent) < 1;

  const formatValue = (val: number) => {
    if (format === 'percent') {
      return `${(val * 100).toFixed(1)}%`;
    }
    return Math.round(val).toLocaleString();
  };

  return (
    <div className="card p-md">
      <div style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{formatValue(value1)}</span>
        <span style={{ color: 'var(--mm-gray-400)' }}>vs</span>
        <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--mm-gray-600)' }}>{formatValue(value2)}</span>
      </div>
      <div style={{ fontSize: 'var(--mm-font-size-xs)', color: isNeutral ? 'var(--mm-gray-500)' : isPositive ? 'var(--mm-color-secondary-600)' : 'var(--mm-error)' }}>
        {isNeutral ? '≈ No change' : isPositive ? `↑ +${deltaPercent.toFixed(1)}%` : `↓ ${deltaPercent.toFixed(1)}%`}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--mm-gray-200)' }}>
      <span style={{ color: 'var(--mm-gray-600)', fontSize: 'var(--mm-font-size-sm)' }}>{label}</span>
      <span style={{ fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}

function detectSeasons(events: PartnerAnalyticsData['events']): Array<{ id: string; label: string; eventCount: number }> {
  if (events.length === 0) return [];

  // Group events by year or season (e.g., 2024/2025 for sports seasons)
  const seasonMap = new Map<string, number>();

  events.forEach((event) => {
    const date = new Date(event.eventDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Sports season typically runs Aug-May (year/year+1)
    let seasonId: string;
    if (month >= 8) {
      seasonId = `${year}/${year + 1}`;
    } else {
      seasonId = `${year - 1}/${year}`;
    }

    seasonMap.set(seasonId, (seasonMap.get(seasonId) || 0) + 1);
  });

  // Convert to array and sort by season (newest first)
  return Array.from(seasonMap.entries())
    .map(([id, eventCount]) => ({ id, label: id, eventCount }))
    .sort((a, b) => b.id.localeCompare(a.id));
}

function compareSeasons(
  events: PartnerAnalyticsData['events'],
  season1Id: string,
  season2Id: string
): SeasonComparisonData {
  const getSeasonEvents = (seasonId: string) => {
    return events.filter((event) => {
      const date = new Date(event.eventDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      let eventSeasonId: string;
      if (month >= 8) {
        eventSeasonId = `${year}/${year + 1}`;
      } else {
        eventSeasonId = `${year - 1}/${year}`;
      }
      return eventSeasonId === seasonId;
    });
  };

  const season1Events = getSeasonEvents(season1Id);
  const season2Events = getSeasonEvents(season2Id);

  const calculateStats = (seasonEvents: typeof events) => {
    const totalEvents = seasonEvents.length;
    const totalFans = seasonEvents.reduce((sum, e) => sum + e.fans, 0);
    const avgFans = totalEvents > 0 ? totalFans / totalEvents : 0;
    const avgEngagement = totalEvents > 0
      ? seasonEvents.reduce((sum, e) => sum + e.engagementRate, 0) / totalEvents
      : 0;

    return { totalEvents, totalFans, avgFans, avgEngagement };
  };

  return {
    season1: calculateStats(season1Events),
    season2: calculateStats(season2Events),
  };
}

function calculateHomeAwayStats(events: PartnerAnalyticsData['events']) {
  const homeGames = events.filter((e) => e.isHomeGame === true);
  const awayGames = events.filter((e) => e.isHomeGame === false);

  const calculateAvg = (games: typeof events) => {
    if (games.length === 0) return { count: 0, avgFans: 0, avgMerched: 0, avgAdValue: 0, avgEngagement: 0 };
    return {
      count: games.length,
      avgFans: games.reduce((sum, e) => sum + e.fans, 0) / games.length,
      avgMerched: games.reduce((sum, e) => sum + e.merched, 0) / games.length,
      avgAdValue: games.reduce((sum, e) => sum + e.adValue, 0) / games.length,
      avgEngagement: games.reduce((sum, e) => sum + e.engagementRate, 0) / games.length,
    };
  };

  return {
    homeGames: calculateAvg(homeGames),
    awayGames: calculateAvg(awayGames),
  };
}
