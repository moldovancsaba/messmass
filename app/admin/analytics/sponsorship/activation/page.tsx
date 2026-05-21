'use client';

import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AnalyticsWorkspaceNav from '@/components/AnalyticsWorkspaceNav';
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

function buildAbsoluteUrl(path: string) {
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
}

function formatPriorityScore(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

function getPriorityTone(value: number) {
  if (value >= 2500) return 'High';
  if (value >= 1000) return 'Medium';
  return 'Low';
}

function parseScopeType(value: string | null): SponsorshipHubScopeType {
  return value === 'partner' || value === 'organization' || value === 'project' ? value : 'portfolio';
}

function parseRangePreset(value: string | null): SponsorshipHubRangePreset {
  return value === '30d' || value === '90d' || value === '365d' ? value : 'all';
}

function parseStatusFilter(value: string | null): 'all' | 'ready' | 'missing_bitly' | 'missing_report' | 'missing_metrics' {
  return value === 'ready' || value === 'missing_bitly' || value === 'missing_report' || value === 'missing_metrics' ? value : 'all';
}

const SAVED_VIEW_PRESETS = [
  {
    key: 'all',
    label: 'All Activation Work',
    description: 'Full queue ordered by urgency and commercial value.',
    statusFilter: 'all' as const,
  },
  {
    key: 'bitly',
    label: 'Bitly Backfill',
    description: 'Projects blocked by missing tracked-link evidence.',
    statusFilter: 'missing_bitly' as const,
  },
  {
    key: 'report',
    label: 'Report Recovery',
    description: 'Projects with evidence but no shareable report route.',
    statusFilter: 'missing_report' as const,
  },
  {
    key: 'metrics',
    label: 'Metrics Proof',
    description: 'Projects missing fan or media proof.',
    statusFilter: 'missing_metrics' as const,
  },
  {
    key: 'ready',
    label: 'Ready to Share',
    description: 'Sponsor-proof projects that can move into recap delivery.',
    statusFilter: 'ready' as const,
  },
];

function buildRecapEmailDraft(partner: SponsorshipHubResponse['activationWorkspace']['recapPackages'][number]) {
  const reportUrl = partner.actions.reportUrl ? buildAbsoluteUrl(partner.actions.reportUrl) : '';
  const subject = `${partner.name} sponsorship recap package`;
  const body = [
    `Hi,`,
    ``,
    `The ${partner.name} recap package is ${partner.packageStatus === 'ready' ? 'ready to share' : 'partially ready for review'}.`,
    ``,
    `Ready projects: ${partner.readyProjectCount}/${partner.totalProjectCount}`,
    `Fans: ${partner.totalFans.toLocaleString('en-US')}`,
    `Media value: €${Math.round(partner.totalAdValue).toLocaleString('en-US')}`,
    `Bitly clicks: ${partner.totalBitlyClicks.toLocaleString('en-US')}`,
    `Latest ready event: ${formatDate(partner.latestEventDate)}`,
    `Included events: ${partner.readyProjectNames.join(', ') || 'None yet'}`,
    reportUrl ? `Report: ${reportUrl}` : '',
  ].filter(Boolean).join('\n');

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildRecapSummary(partner: SponsorshipHubResponse['activationWorkspace']['recapPackages'][number]) {
  const reportUrl = partner.actions.reportUrl ? buildAbsoluteUrl(partner.actions.reportUrl) : 'No partner report link available';
  return [
    `${partner.name} recap package`,
    `Status: ${partner.packageStatus === 'ready' ? 'Full package ready' : 'Partial package ready'}`,
    `Ready projects: ${partner.readyProjectCount}/${partner.totalProjectCount}`,
    `Fans: ${partner.totalFans.toLocaleString('en-US')}`,
    `Media value: €${Math.round(partner.totalAdValue).toLocaleString('en-US')}`,
    `Bitly clicks: ${partner.totalBitlyClicks.toLocaleString('en-US')}`,
    `Latest ready event: ${formatDate(partner.latestEventDate)}`,
    `Included events: ${partner.readyProjectNames.join(', ') || 'None yet'}`,
    `Partner report: ${reportUrl}`,
  ].join('\n');
}

function buildRecapBriefHref(
  partnerId: string,
  scopeType: SponsorshipHubScopeType,
  scopeId: string | null,
  rangePreset: SponsorshipHubRangePreset
) {
  const params = new URLSearchParams({ scopeType, rangePreset });
  if (scopeType !== 'portfolio' && scopeId) {
    params.set('scopeId', scopeId);
  }
  return `/admin/analytics/sponsorship/activation/recap/${partnerId}?${params.toString()}`;
}

function buildAbsoluteRecapBriefUrl(
  partnerId: string,
  scopeType: SponsorshipHubScopeType,
  scopeId: string | null,
  rangePreset: SponsorshipHubRangePreset
) {
  return buildAbsoluteUrl(buildRecapBriefHref(partnerId, scopeType, scopeId, rangePreset));
}

export default function SponsorshipActivationWorkspacePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hubData, setHubData] = useState<SponsorshipHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedRecapPartnerId, setCopiedRecapPartnerId] = useState<string | null>(null);
  const [copiedRecapLinkPartnerId, setCopiedRecapLinkPartnerId] = useState<string | null>(null);
  const [selectedRecapPartnerId, setSelectedRecapPartnerId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'missing_bitly' | 'missing_report' | 'missing_metrics'>(() => parseStatusFilter(searchParams.get('statusFilter')));
  const [partnerFilter, setPartnerFilter] = useState(() => searchParams.get('partnerFilter') || 'all');

  const scopeType = useMemo(() => parseScopeType(searchParams.get('scopeType')), [searchParams]);
  const scopeId = useMemo(() => searchParams.get('scopeId'), [searchParams]);
  const rangePreset = useMemo(() => parseRangePreset(searchParams.get('rangePreset')), [searchParams]);
  const deferredStatusFilter = useDeferredValue(statusFilter);
  const deferredPartnerFilter = useDeferredValue(partnerFilter);
  const currentSavedView = useMemo(
    () => SAVED_VIEW_PRESETS.find((preset) => preset.statusFilter === statusFilter) || SAVED_VIEW_PRESETS[0],
    [statusFilter]
  );

  useEffect(() => {
    setStatusFilter(parseStatusFilter(searchParams.get('statusFilter')));
    setPartnerFilter(searchParams.get('partnerFilter') || 'all');
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));

    if (statusFilter === 'all') {
      params.delete('statusFilter');
    } else {
      params.set('statusFilter', statusFilter);
    }

    if (partnerFilter === 'all') {
      params.delete('partnerFilter');
    } else {
      params.set('partnerFilter', partnerFilter);
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [partnerFilter, pathname, router, searchParams, statusFilter]);

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

  const filteredGapCount = useMemo(
    () => filteredProofItems.filter((item) => item.readinessScore < 100).length,
    [filteredProofItems]
  );

  const filteredReadyCount = useMemo(
    () => filteredProofItems.filter((item) => item.readinessScore === 100).length,
    [filteredProofItems]
  );

  const filteredPotentialValue = useMemo(
    () => filteredProofItems.reduce((sum, item) => sum + item.adValue, 0),
    [filteredProofItems]
  );

  const filteredRecapPackages = useMemo(
    () => (hubData?.activationWorkspace.recapPackages || []).filter((partner) => partnerFilter === 'all' || partner.partnerId === partnerFilter),
    [hubData, partnerFilter]
  );

  useEffect(() => {
    if (filteredRecapPackages.length === 0) {
      setSelectedRecapPartnerId(null);
      return;
    }

    if (selectedRecapPartnerId && filteredRecapPackages.some((item) => item.partnerId === selectedRecapPartnerId)) {
      return;
    }

    setSelectedRecapPartnerId(filteredRecapPackages[0].partnerId);
  }, [filteredRecapPackages, selectedRecapPartnerId]);

  const selectedRecapPackage = useMemo(
    () => filteredRecapPackages.find((item) => item.partnerId === selectedRecapPartnerId) || filteredRecapPackages[0] || null,
    [filteredRecapPackages, selectedRecapPartnerId]
  );

  const handleCopyRecapSummary = async (partner: SponsorshipHubResponse['activationWorkspace']['recapPackages'][number]) => {
    try {
      await navigator.clipboard.writeText(buildRecapSummary(partner));
      setCopiedRecapPartnerId(partner.partnerId);
      window.setTimeout(() => setCopiedRecapPartnerId((current) => (current === partner.partnerId ? null : current)), 2000);
    } catch (copyError) {
      console.error('Failed to copy recap summary:', copyError);
    }
  };

  const handleCopyRecapLink = async (partner: SponsorshipHubResponse['activationWorkspace']['recapPackages'][number]) => {
    try {
      await navigator.clipboard.writeText(buildAbsoluteRecapBriefUrl(partner.partnerId, scopeType, scopeId, rangePreset));
      setCopiedRecapLinkPartnerId(partner.partnerId);
      window.setTimeout(() => setCopiedRecapLinkPartnerId((current) => (current === partner.partnerId ? null : current)), 2000);
    } catch (copyError) {
      console.error('Failed to copy recap brief link:', copyError);
    }
  };

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="✅ Partner Activation Workspace"
        subtitle="Operational proof-of-performance queue for sponsor-ready reporting, built directly on the Sponsorship Hub evidence model."
        backLink="/admin/analytics"
        showSearch={false}
      />

      <div className={styles.page}>
        <AnalyticsWorkspaceNav />

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
              <MetricCard title="Ready Partners" value={hubData.activationWorkspace.readyPartners} format="number" loading={loading} icon="🤝" />
              <MetricCard title="Needs Bitly" value={hubData.activationWorkspace.needsBitlyProjects} format="number" loading={loading} icon="🔗" />
              <MetricCard title="Needs Report Link" value={hubData.activationWorkspace.needsReportProjects} format="number" loading={loading} icon="📝" />
              <MetricCard title="Needs Fan or Media Proof" value={hubData.activationWorkspace.needsMetricsProjects} format="number" loading={loading} icon="📊" />
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
                <div className={styles.pillGrid}>
                  {SAVED_VIEW_PRESETS.map((preset) => {
                    const isActive = currentSavedView.key === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        className={`${styles.pillCardButton} ${isActive ? styles.pillCardActive : ''}`}
                        onClick={() => setStatusFilter(preset.statusFilter)}
                      >
                        <span className={styles.pillTitle}>{preset.label}</span>
                        <span className={styles.helperText}>{preset.description}</span>
                      </button>
                    );
                  })}
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
                <div className={styles.insightGrid}>
                  <div className={styles.insightItem}>
                    <span className={styles.insightLabel}>Current View</span>
                    <span className={styles.insightValue}>{currentSavedView.label}</span>
                  </div>
                  <div className={styles.insightItem}>
                    <span className={styles.insightLabel}>Projects With Gaps</span>
                    <span className={styles.insightValue}>{filteredGapCount}</span>
                  </div>
                  <div className={styles.insightItem}>
                    <span className={styles.insightLabel}>Ready In View</span>
                    <span className={styles.insightValue}>{filteredReadyCount}</span>
                  </div>
                  <div className={styles.insightItem}>
                    <span className={styles.insightLabel}>Media Value In View</span>
                    <span className={styles.insightValue}>€{Math.round(filteredPotentialValue).toLocaleString('en-US')}</span>
                  </div>
                </div>
                <p className={styles.helperText}>
                  Queue order is server-ranked by gap urgency first, then commercial value, so the top rows are the best next fixes. Filter state is stored in the URL so this view can be bookmarked or shared.
                </p>
              </div>
            </ColoredCard>

            <ColoredCard accentColor="var(--mm-color-success-500, #16a34a)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Partner Recap Packages</h2>
                  <p className={styles.sectionSubtitle}>
                    Ready proof grouped into partner-facing recap packages so delivery teams can move from internal triage into external sharing.
                  </p>
                </div>
                <div className={styles.projectResults}>
                  {filteredRecapPackages.map((partner) => (
                      <ColoredCard
                        key={partner.partnerId}
                        accentColor="var(--mm-color-success-500, #16a34a)"
                        hoverable={false}
                        className={`${styles.projectResultCard} ${selectedRecapPackage?.partnerId === partner.partnerId ? styles.projectResultActive : ''}`}
                      >
                        <div className={styles.detailCard}>
                          <div className={styles.detailMeta}>
                            <span>
                              <strong>{partner.emoji ? `${partner.emoji} ` : ''}{partner.name}</strong>
                            </span>
                            <span>
                              {partner.readyProjectCount} ready project{partner.readyProjectCount === 1 ? '' : 's'} • {partner.totalProjectCount} total in scope
                            </span>
                            <span>
                              {partner.packageStatus === 'ready' ? 'Full package ready' : 'Partial package ready'}
                            </span>
                            <span>
                              €{Math.round(partner.totalAdValue).toLocaleString('en-US')} media value • {partner.totalBitlyClicks.toLocaleString('en-US')} Bitly clicks
                            </span>
                            <span>
                              {partner.totalFans.toLocaleString('en-US')} fans • latest ready event {formatDate(partner.latestEventDate)}
                            </span>
                          </div>
                          <div className={styles.noteList}>
                            <p className={styles.detailNote}>
                              Included ready events: {partner.readyProjectNames.join(', ') || 'None'}
                            </p>
                          {copiedRecapPartnerId === partner.partnerId && (
                            <p className={styles.detailNote}>Recap summary copied to clipboard.</p>
                          )}
                            {copiedRecapLinkPartnerId === partner.partnerId && (
                              <p className={styles.detailNote}>Recap brief link copied to clipboard.</p>
                            )}
                          </div>
                          <div className={styles.actionRow}>
                            <button
                              type="button"
                              className={styles.filterButton}
                              onClick={() => setSelectedRecapPartnerId(partner.partnerId)}
                            >
                              {selectedRecapPackage?.partnerId === partner.partnerId ? 'Previewing Brief' : 'Preview Brief'}
                            </button>
                            <Link
                              href={buildRecapBriefHref(partner.partnerId, scopeType, scopeId, rangePreset)}
                              className={styles.actionLink}
                            >
                              Open Recap Brief
                            </Link>
                            {partner.actions.reportUrl && (
                              <Link href={partner.actions.reportUrl} className={styles.actionLink}>Open Partner Report</Link>
                            )}
                            <button
                              type="button"
                              className={styles.filterButton}
                              onClick={() => void handleCopyRecapSummary(partner)}
                            >
                              Copy Recap Summary
                            </button>
                            <button
                              type="button"
                              className={styles.filterButton}
                              onClick={() => void handleCopyRecapLink(partner)}
                            >
                              Copy Brief Link
                            </button>
                            <Link href={buildRecapEmailDraft(partner)} className={styles.actionLink}>
                              Draft Recap Email
                            </Link>
                            {partner.actions.adminUrl && (
                              <Link href={partner.actions.adminUrl} className={styles.actionLink}>Open Partner Analytics</Link>
                            )}
                            {partner.actions.activationUrl && (
                              <Link href={partner.actions.activationUrl} className={styles.actionLink}>Open Activation Queue</Link>
                            )}
                          </div>
                        </div>
                      </ColoredCard>
                    ))}
                  {filteredRecapPackages.length === 0 && (
                    <p className={styles.detailNote}>No partner recap package is ready yet for the current filter scope.</p>
                  )}
                </div>
              </div>
            </ColoredCard>

            {selectedRecapPackage && (
              <ColoredCard accentColor="var(--mm-color-success-500, #16a34a)" hoverable={false}>
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recipient-Ready Recap Brief</h2>
                    <p className={styles.sectionSubtitle}>
                      A concise sponsor-facing handoff built from the currently selected recap package.
                    </p>
                  </div>
                  <div className={styles.doubleGrid}>
                    <div className={styles.detailCard}>
                      <h3 className={styles.detailTitle}>
                        {selectedRecapPackage.emoji ? `${selectedRecapPackage.emoji} ` : ''}{selectedRecapPackage.name}
                      </h3>
                      <div className={styles.noteList}>
                        <p className={styles.detailNote}>
                          {selectedRecapPackage.packageStatus === 'ready'
                            ? 'This package is ready for sponsor-facing sharing.'
                            : 'This package is partially ready and may still need follow-up before external delivery.'}
                        </p>
                        <p className={styles.detailNote}>
                          {selectedRecapPackage.readyProjectCount} of {selectedRecapPackage.totalProjectCount} scoped projects are fully ready.
                        </p>
                        <p className={styles.detailNote}>
                          Latest ready event: {formatDate(selectedRecapPackage.latestEventDate)}
                        </p>
                      </div>
                    </div>
                    <div className={styles.detailCard}>
                      <div className={styles.insightGrid}>
                        <div className={styles.insightItem}>
                          <span className={styles.insightLabel}>Fans</span>
                          <span className={styles.insightValue}>{selectedRecapPackage.totalFans.toLocaleString('en-US')}</span>
                        </div>
                        <div className={styles.insightItem}>
                          <span className={styles.insightLabel}>Media Value</span>
                          <span className={styles.insightValue}>€{Math.round(selectedRecapPackage.totalAdValue).toLocaleString('en-US')}</span>
                        </div>
                        <div className={styles.insightItem}>
                          <span className={styles.insightLabel}>Bitly Clicks</span>
                          <span className={styles.insightValue}>{selectedRecapPackage.totalBitlyClicks.toLocaleString('en-US')}</span>
                        </div>
                        <div className={styles.insightItem}>
                          <span className={styles.insightLabel}>Package Status</span>
                          <span className={styles.insightValue}>{selectedRecapPackage.packageStatus === 'ready' ? 'Ready' : 'Partial'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.noteList}>
                    <p className={styles.detailNote}>
                      Included ready events: {selectedRecapPackage.readyProjectNames.join(', ') || 'None'}
                    </p>
                    <p className={styles.detailNote}>
                      Recommended delivery path: share the partner report first, then use the activation queue if any additional proof items still need to be completed.
                    </p>
                  </div>
                  {selectedRecapPackage.readyProjects.length > 0 && (
                    <div className={styles.projectResults}>
                      {selectedRecapPackage.readyProjects.map((project) => (
                        <ColoredCard
                          key={project.projectId}
                          accentColor="var(--mm-chart-teal)"
                          hoverable={false}
                          className={styles.projectResultCard}
                        >
                          <div className={styles.detailCard}>
                            <h3 className={styles.detailTitle}>{project.eventName}</h3>
                            <div className={styles.detailMeta}>
                              <span>{formatDate(project.eventDate)}</span>
                              <span>Ready for sponsor-facing recap usage</span>
                            </div>
                            <div className={styles.actionRow}>
                              {project.reportUrl && (
                                <Link href={project.reportUrl} className={styles.actionLink}>
                                  Open Event Report
                                </Link>
                              )}
                              {project.editorUrl && (
                                <Link href={project.editorUrl} className={styles.actionLink}>
                                  Open Editor
                                </Link>
                              )}
                              {project.projectAdminUrl && (
                                <Link href={project.projectAdminUrl} className={styles.actionLink}>
                                  Open Event Admin
                                </Link>
                              )}
                            </div>
                          </div>
                        </ColoredCard>
                      ))}
                    </div>
                  )}
                  <div className={styles.actionRow}>
                    <Link
                      href={buildRecapBriefHref(selectedRecapPackage.partnerId, scopeType, scopeId, rangePreset)}
                      className={styles.actionLink}
                    >
                      Open Dedicated Brief
                    </Link>
                    {selectedRecapPackage.actions.reportUrl && (
                      <Link href={selectedRecapPackage.actions.reportUrl} className={styles.actionLink}>Open Partner Report</Link>
                    )}
                    <button
                      type="button"
                      className={styles.filterButton}
                      onClick={() => void handleCopyRecapSummary(selectedRecapPackage)}
                    >
                      Copy Brief Summary
                    </button>
                    <button
                      type="button"
                      className={styles.filterButton}
                      onClick={() => void handleCopyRecapLink(selectedRecapPackage)}
                    >
                      {copiedRecapLinkPartnerId === selectedRecapPackage.partnerId ? 'Copied Brief Link' : 'Copy Brief Link'}
                    </button>
                    <Link href={buildRecapEmailDraft(selectedRecapPackage)} className={styles.actionLink}>
                      Draft Delivery Email
                    </Link>
                    {selectedRecapPackage.actions.activationUrl && (
                      <Link href={selectedRecapPackage.actions.activationUrl} className={styles.actionLink}>Open Partner Activation Queue</Link>
                    )}
                  </div>
                </div>
              </ColoredCard>
            )}

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
                        <th>Priority</th>
                        <th>Gap Reasons</th>
                        <th>Fans</th>
                        <th>Media Value</th>
                        <th>Bitly</th>
                        <th>Recommended Fix</th>
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
                          <td>
                            <div className={styles.detailMeta}>
                              <span>{getPriorityTone(item.priorityScore)}</span>
                              <span>Score {formatPriorityScore(item.priorityScore)}</span>
                            </div>
                          </td>
                          <td>{item.missingReasons.length > 0 ? item.missingReasons.join(', ') : 'Ready'}</td>
                          <td>{item.hasFanEvidence ? item.fans.toLocaleString('en-US') : 'Missing'}</td>
                          <td>{item.hasMediaEvidence ? `€${Math.round(item.adValue).toLocaleString('en-US')}` : 'Missing'}</td>
                          <td>{item.hasBitlyEvidence ? item.bitlyClicks.toLocaleString('en-US') : 'Missing'}</td>
                          <td>
                            <div className={styles.detailMeta}>
                              {item.recommendedActionUrl ? (
                                <Link href={item.recommendedActionUrl} className={styles.inlineLink}>
                                  {item.recommendedActionLabel}
                                </Link>
                              ) : (
                                <span>{item.recommendedActionLabel}</span>
                              )}
                              <span>{item.recommendedActionReason}</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.actionRow}>
                              {item.reportUrl && <Link href={item.reportUrl} className={styles.inlineLink}>Report</Link>}
                              {item.editorUrl && <Link href={item.editorUrl} className={styles.inlineLink}>Editor</Link>}
                              {item.partnerAnalyticsUrl && <Link href={item.partnerAnalyticsUrl} className={styles.inlineLink}>Analytics</Link>}
                              {item.partnerReportUrl && <Link href={item.partnerReportUrl} className={styles.inlineLink}>Partner</Link>}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={10}>No scoped proof items match the current filters.</td>
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
                      className={`${styles.projectResultCard} ${partnerFilter === partner.partnerId ? styles.projectResultActive : ''}`}
                    >
                      <div className={styles.detailCard}>
                        <div className={styles.detailMeta}>
                          <span><strong>{partner.emoji ? `${partner.emoji} ` : ''}{partner.name}</strong></span>
                          <span>{partner.projectCount} project{partner.projectCount === 1 ? '' : 's'} in scope</span>
                          <span>{partner.readyProjectCount} ready • {partner.gapProjectCount} with gaps</span>
                          <span>€{Math.round(partner.totalAdValue).toLocaleString('en-US')} media value • {partner.totalBitlyClicks.toLocaleString('en-US')} Bitly clicks</span>
                        </div>
                        <div className={styles.actionRow}>
                          <button
                            type="button"
                            className={styles.filterButton}
                            onClick={() => setPartnerFilter((current) => (current === partner.partnerId ? 'all' : partner.partnerId))}
                          >
                            {partnerFilter === partner.partnerId ? 'Show All Partners' : 'Focus Queue'}
                          </button>
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
