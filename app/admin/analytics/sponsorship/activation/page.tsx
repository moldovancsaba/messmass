'use client';

import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ColoredCard from '@/components/ColoredCard';
import MetricCard from '@/components/analytics/MetricCard';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import type {
  SponsorshipHubResponse,
  SponsorshipHubRangePreset,
  SponsorshipHubScopeType,
} from '@/lib/sponsorshipHub';
import styles from '../page.module.css';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
}

function parseScopeType(value: string | null): SponsorshipHubScopeType {
  return value === 'partner' || value === 'organization' || value === 'project' ? value : 'portfolio';
}

function parseRangePreset(value: string | null): SponsorshipHubRangePreset {
  return value === '30d' || value === '90d' || value === '365d' ? value : 'all';
}

export default function SponsorshipActivationWorkspacePage() {
  const searchParams = useSearchParams();
  const [hubData, setHubData] = useState<SponsorshipHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'missing_bitly' | 'missing_report' | 'missing_metrics'>('all');
  const [partnerFilter, setPartnerFilter] = useState('all');

  const scopeType = useMemo(() => parseScopeType(searchParams.get('scopeType')), [searchParams]);
  const scopeId = useMemo(() => searchParams.get('scopeId'), [searchParams]);
  const rangePreset = useMemo(() => parseRangePreset(searchParams.get('rangePreset')), [searchParams]);
  const deferredStatusFilter = useDeferredValue(statusFilter);
  const deferredPartnerFilter = useDeferredValue(partnerFilter);

  useEffect(() => {
    const fetchHub = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ scopeType, rangePreset });
        if (scopeType !== 'portfolio' && scopeId) {
          params.set('scopeId', scopeId);
        }
        const response = await fetch(`/api/analytics/sponsorship-hub?${params.toString()}`);
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || 'Failed to load activation workspace');
        }
        const result = await response.json();
        setHubData(result.data);
      } catch (fetchError) {
        console.error('Failed to load sponsorship activation workspace:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load activation workspace');
      } finally {
        setLoading(false);
      }
    };

    fetchHub();
  }, [rangePreset, scopeId, scopeType]);

  const filteredProofItems = useMemo(() => {
    if (!hubData) return [];

    return hubData.activationWorkspace.proofItems.filter((item) => {
      if (deferredPartnerFilter !== 'all' && item.partnerId !== deferredPartnerFilter) {
        return false;
      }

      if (deferredStatusFilter === 'ready') {
        return item.readinessScore === 100;
      }
      if (deferredStatusFilter === 'missing_bitly') {
        return !item.hasBitlyEvidence;
      }
      if (deferredStatusFilter === 'missing_report') {
        return !item.hasReportLink;
      }
      if (deferredStatusFilter === 'missing_metrics') {
        return !item.hasFanEvidence || !item.hasMediaEvidence;
      }
      return true;
    });
  }, [deferredPartnerFilter, deferredStatusFilter, hubData]);

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="✅ Partner Activation Workspace"
        subtitle="Operational proof-of-performance queue for sponsor-ready reporting, built directly on the Sponsorship Hub evidence model."
        backLink="/admin/analytics/sponsorship"
        showSearch={false}
      />

      <div className={styles.page}>
        {error && (
          <ColoredCard accentColor="var(--mm-error)" hoverable={false}>
            <div className={styles.emptyState}>{error}</div>
          </ColoredCard>
        )}

        {!error && hubData && (
          <>
            <div className={styles.metricGrid}>
              <MetricCard title="Readiness Score" value={hubData.activationWorkspace.readinessScore} format="percentage" loading={loading} icon="✅" />
              <MetricCard title="Ready Projects" value={hubData.activationWorkspace.readyProjects} format="number" loading={loading} icon="📦" />
              <MetricCard title="Needs Bitly" value={hubData.activationWorkspace.needsBitlyProjects} format="number" loading={loading} icon="🔗" />
              <MetricCard title="Needs Report Link" value={hubData.activationWorkspace.needsReportProjects} format="number" loading={loading} icon="📝" />
            </div>

            <ColoredCard accentColor="var(--mm-chart-teal)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Current Workspace Scope</h2>
                  <p className={styles.sectionSubtitle}>{hubData.scope.description}</p>
                </div>
                <div className={styles.insightGrid}>
                  <div className={styles.insightItem}>
                    <span className={styles.insightLabel}>Scope</span>
                    <span className={styles.insightValue}>{hubData.scope.name}</span>
                  </div>
                  <div className={styles.insightItem}>
                    <span className={styles.insightLabel}>Date Window</span>
                    <span className={styles.insightValue}>
                      {hubData.filters.startDate ? formatDate(hubData.filters.startDate) : 'Earliest'} - {hubData.filters.endDate ? formatDate(hubData.filters.endDate) : 'Latest'}
                    </span>
                  </div>
                  <div className={styles.insightItem}>
                    <span className={styles.insightLabel}>Tracked Events</span>
                    <span className={styles.insightValue}>{hubData.summary.eventCount}</span>
                  </div>
                  <div className={styles.insightItem}>
                    <span className={styles.insightLabel}>Partners</span>
                    <span className={styles.insightValue}>{hubData.summary.partnerCount}</span>
                  </div>
                </div>
                <div className={styles.actionRow}>
                  <Link href="/admin/analytics/sponsorship" className={styles.actionLink}>Back to Sponsorship Hub</Link>
                  {hubData.scopeActions.reportUrl && (
                    <Link href={hubData.scopeActions.reportUrl} className={styles.actionLink}>Open Scope Report</Link>
                  )}
                  {hubData.scopeActions.adminUrl && (
                    <Link href={hubData.scopeActions.adminUrl} className={styles.actionLink}>Open Scope Admin</Link>
                  )}
                </div>
              </div>
            </ColoredCard>

            <ColoredCard accentColor="var(--mm-chart-purple)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Activation Priorities</h2>
                  <p className={styles.sectionSubtitle}>
                    These are the next operational fixes required before all scoped projects can be used as sponsor proof packages.
                  </p>
                </div>
                <div className={styles.noteList}>
                  {hubData.activationWorkspace.nextActions.length > 0 ? hubData.activationWorkspace.nextActions.map((item) => (
                    <p key={item} className={styles.detailNote}>{item}</p>
                  )) : (
                    <p className={styles.detailNote}>No activation gaps detected for the current scope.</p>
                  )}
                </div>
              </div>
            </ColoredCard>

            <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
              <div className={styles.controlsCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Queue Filters</h2>
                  <p className={styles.sectionSubtitle}>
                    Narrow the activation queue by gap type or by partner so commercial follow-up can stay focused.
                  </p>
                </div>
                <div className={styles.controlsGrid}>
                  <div className={styles.controlGroup}>
                    <label htmlFor="statusFilter" className={styles.controlLabel}>Status</label>
                    <select
                      id="statusFilter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                      className={`form-input ${styles.selectInput}`}
                    >
                      <option value="all">All Projects</option>
                      <option value="ready">Ready Now</option>
                      <option value="missing_bitly">Missing Bitly</option>
                      <option value="missing_report">Missing Report</option>
                      <option value="missing_metrics">Missing Fan or Media Evidence</option>
                    </select>
                  </div>
                  <div className={styles.controlGroup}>
                    <label htmlFor="partnerFilter" className={styles.controlLabel}>Partner</label>
                    <select
                      id="partnerFilter"
                      value={partnerFilter}
                      onChange={(event) => setPartnerFilter(event.target.value)}
                      className={`form-input ${styles.selectInput}`}
                    >
                      <option value="all">All Partners</option>
                      {hubData.activationWorkspace.partnerQueues.map((partner) => (
                        <option key={partner.partnerId} value={partner.partnerId}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className={styles.scopeSummary}>
                  Showing <strong>{filteredProofItems.length}</strong> project{filteredProofItems.length === 1 ? '' : 's'} in the current activation queue.
                </p>
              </div>
            </ColoredCard>

            <ColoredCard accentColor="var(--mm-color-secondary-500)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Proof Queue</h2>
                  <p className={styles.sectionSubtitle}>
                    Project-by-project evidence readiness for partner recap and renewal workflows.
                  </p>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Date</th>
                        <th>Readiness</th>
                        <th>Gap Reasons</th>
                        <th>Fans</th>
                        <th>Media Value</th>
                        <th>Bitly</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProofItems.length > 0 ? filteredProofItems.map((item) => (
                        <tr key={item.projectId}>
                          <td>
                            <strong>{item.eventName}</strong>
                            <div className={styles.cellMeta}>{item.partnerLabel}</div>
                          </td>
                          <td>{formatDate(item.eventDate)}</td>
                          <td>{item.readinessScore.toFixed(0)}%</td>
                          <td>{item.missingReasons.length > 0 ? item.missingReasons.join(', ') : 'Ready'}</td>
                          <td>{item.hasFanEvidence ? item.fans.toLocaleString('en-US') : 'Missing'}</td>
                          <td>{item.hasMediaEvidence ? `€${Math.round(item.adValue).toLocaleString('en-US')}` : 'Missing'}</td>
                          <td>{item.hasBitlyEvidence ? item.bitlyClicks.toLocaleString('en-US') : 'Missing'}</td>
                          <td>
                            <div className={styles.actionRow}>
                              {item.reportUrl && <Link href={item.reportUrl} className={styles.inlineLink}>Report</Link>}
                              {item.partnerAnalyticsUrl && <Link href={item.partnerAnalyticsUrl} className={styles.inlineLink}>Analytics</Link>}
                              {item.partnerReportUrl && <Link href={item.partnerReportUrl} className={styles.inlineLink}>Partner</Link>}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={8}>No scoped proof items match the current filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </ColoredCard>

            <ColoredCard accentColor="var(--mm-chart-orange)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Partner Proof Destinations</h2>
                  <p className={styles.sectionSubtitle}>
                    Partner-level queues ranked by proof gaps first, then by commercial value.
                  </p>
                </div>
                <div className={styles.projectResults}>
                  {hubData.activationWorkspace.partnerQueues.map((partner) => (
                    <ColoredCard
                      key={partner.partnerId}
                      accentColor="var(--mm-chart-orange)"
                      hoverable={false}
                      className={styles.projectResultCard}
                    >
                      <div className={styles.detailCard}>
                        <div className={styles.detailMeta}>
                          <span><strong>{partner.emoji ? `${partner.emoji} ` : ''}{partner.name}</strong></span>
                          <span>{partner.projectCount} project{partner.projectCount === 1 ? '' : 's'} in scope</span>
                          <span>{partner.readyProjectCount} ready • {partner.gapProjectCount} with gaps</span>
                          <span>€{Math.round(partner.totalAdValue).toLocaleString('en-US')} media value • {partner.totalBitlyClicks.toLocaleString('en-US')} Bitly clicks</span>
                        </div>
                        <div className={styles.actionRow}>
                          {partner.actions.adminUrl && (
                            <Link href={partner.actions.adminUrl} className={styles.actionLink}>Open Analytics</Link>
                          )}
                          {partner.actions.reportUrl && (
                            <Link href={partner.actions.reportUrl} className={styles.actionLink}>Open Partner Report</Link>
                          )}
                          {partner.actions.activationUrl && (
                            <Link href={partner.actions.activationUrl} className={styles.actionLink}>Scoped Activation</Link>
                          )}
                        </div>
                      </div>
                    </ColoredCard>
                  ))}
                </div>
              </div>
            </ColoredCard>
          </>
        )}
      </div>
    </div>
  );
}
