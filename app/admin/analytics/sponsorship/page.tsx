'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ColoredCard from '@/components/ColoredCard';
import LineChart from '@/components/analytics/LineChart';
import MetricCard from '@/components/analytics/MetricCard';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import type {
  SponsorshipActionLinks,
  SponsorshipHubResponse,
  SponsorshipHubScopeType,
  SponsorshipHubRangePreset,
  SponsorshipMetricFormat,
  SponsorshipPartnerDrilldown,
  SponsorshipProjectDrilldown,
} from '@/lib/sponsorshipHub';
import styles from './page.module.css';

interface ScopeOption {
  _id: string;
  name: string;
}

interface ProjectOption {
  _id: string;
  eventName: string;
  eventDate?: string;
  partner1?: { name?: string };
  partner2?: { name?: string };
}

const RANGE_OPTIONS: Array<{ value: SponsorshipHubRangePreset; label: string }> = [
  { value: 'all', label: 'All Time' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '365d', label: 'Last 12 Months' },
];

function formatMetric(value: number, format: SponsorshipMetricFormat) {
  if (format === 'currency') {
    return `€${Math.round(value).toLocaleString('en-US')}`;
  }
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return Math.round(value).toLocaleString('en-US');
}

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
}

function projectPartnerLabel(project: ProjectOption) {
  const labels = [project.partner1?.name, project.partner2?.name].filter(Boolean);
  return labels.length > 0 ? labels.join(' vs ') : 'Partner data unavailable';
}

function actionLinks(actions: SponsorshipActionLinks) {
  return [
    actions.reportUrl ? { href: actions.reportUrl, label: 'Open Report' } : null,
    actions.adminUrl ? { href: actions.adminUrl, label: 'Open Admin' } : null,
    actions.activationUrl ? { href: actions.activationUrl, label: 'Open Activation' } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;
}

function renderChart(
  title: string,
  subtitle: string,
  trend: SponsorshipHubResponse['trend'],
  datasetConfig: Array<{ key: 'fans' | 'adValue' | 'bitlyClicks'; label: string; color: string; format: SponsorshipMetricFormat }>
) {
  const datasets = datasetConfig
    .map((dataset) => ({
      label: dataset.label,
      color: dataset.color,
      fill: false,
      data: trend.map((point) => ({
        label: point.label,
        value: point[dataset.key],
      })),
      format: dataset.format,
    }))
    .filter((dataset) => dataset.data.length > 0);

  if (datasets.length === 0) return null;

  return (
    <LineChart
      title={title}
      subtitle={subtitle}
      datasets={datasets.map((dataset) => ({
        label: dataset.label,
        color: dataset.color,
        fill: false,
        data: dataset.data,
      }))}
      showLegend={true}
      height={320}
      formatValue={(value) => {
        const matched = datasets.find((dataset) => dataset.data.some((point) => point.value === value));
        return formatMetric(value, matched?.format || 'number');
      }}
    />
  );
}

function EvidenceTable({
  title,
  rows,
}: {
  title: string;
  rows: SponsorshipProjectDrilldown['sourceBreakdown'] | SponsorshipPartnerDrilldown['sourceBreakdown'];
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{title}</th>
            <th>Value</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td><strong>{row.label}</strong></td>
              <td>{formatMetric(row.value, row.format)}</td>
              <td>{row.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SponsorshipHubPage() {
  const [scopeType, setScopeType] = useState<SponsorshipHubScopeType>('portfolio');
  const [selectedScopeId, setSelectedScopeId] = useState('');
  const [rangePreset, setRangePreset] = useState<SponsorshipHubRangePreset>('all');
  const [hubData, setHubData] = useState<SponsorshipHubResponse | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partners, setPartners] = useState<ScopeOption[]>([]);
  const [organizations, setOrganizations] = useState<ScopeOption[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectMatches, setProjectMatches] = useState<ProjectOption[]>([]);
  const [projectSearchLoading, setProjectSearchLoading] = useState(false);

  useEffect(() => {
    const fetchScopeOptions = async () => {
      try {
        const [partnerResponse, organizationResponse] = await Promise.all([
          fetch('/api/admin/partners'),
          fetch('/api/admin/organizations'),
        ]);

        if (partnerResponse.ok) {
          const partnerResult = await partnerResponse.json();
          setPartners(partnerResult.partners || []);
        }

        if (organizationResponse.ok) {
          const organizationResult = await organizationResponse.json();
          setOrganizations(organizationResult.organizations || []);
        }
      } catch (fetchError) {
        console.error('Failed to load sponsorship hub scope options:', fetchError);
      }
    };

    fetchScopeOptions();
  }, []);

  useEffect(() => {
    if (scopeType !== 'project') {
      setProjectMatches([]);
      return;
    }

    const trimmed = projectSearch.trim();
    if (trimmed.length < 2) {
      setProjectMatches([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setProjectSearchLoading(true);
        const params = new URLSearchParams({
          q: trimmed,
          limit: '8',
          sortField: 'eventDate',
          sortOrder: 'desc',
        });
        const response = await fetch(`/api/projects?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Failed to search projects');
        }

        const result = await response.json();
        setProjectMatches(result.projects || []);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Failed to search projects:', fetchError);
        }
      } finally {
        setProjectSearchLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [projectSearch, scopeType]);

  useEffect(() => {
    if (scopeType === 'portfolio') {
      setSelectedScopeId('');
      return;
    }

    if (scopeType === 'partner' && selectedScopeId && partners.some((partner) => partner._id === selectedScopeId)) {
      return;
    }

    if (scopeType === 'organization' && selectedScopeId && organizations.some((organization) => organization._id === selectedScopeId)) {
      return;
    }

    if (scopeType === 'project' && selectedScopeId) {
      return;
    }

    setSelectedScopeId('');
  }, [organizations, partners, scopeType, selectedScopeId]);

  useEffect(() => {
    const fetchHub = async () => {
      if (scopeType !== 'portfolio' && !selectedScopeId) {
        setHubData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ scopeType, rangePreset });
        if (selectedScopeId) {
          params.set('scopeId', selectedScopeId);
        }

        const response = await fetch(`/api/analytics/sponsorship-hub?${params.toString()}`);
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || 'Failed to load sponsorship hub');
        }

        const result = await response.json();
        setHubData(result.data);
      } catch (fetchError) {
        console.error('Failed to load sponsorship hub:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load sponsorship hub');
      } finally {
        setLoading(false);
      }
    };

    fetchHub();
  }, [rangePreset, scopeType, selectedScopeId]);

  useEffect(() => {
    setSelectedProjectId((current) => {
      if (!hubData?.projectDrilldowns.length) return '';
      if (current && hubData.projectDrilldowns.some((project) => project.projectId === current)) {
        return current;
      }
      return hubData.projectDrilldowns[0].projectId;
    });

    setSelectedPartnerId((current) => {
      if (!hubData?.partnerDrilldowns.length) return '';
      if (current && hubData.partnerDrilldowns.some((partner) => partner.partnerId === current)) {
        return current;
      }
      return hubData.partnerDrilldowns[0].partnerId;
    });
  }, [hubData]);

  const scopeLabel = useMemo(() => {
    if (scopeType === 'portfolio') return 'Portfolio';
    if (scopeType === 'partner') return 'Partner';
    if (scopeType === 'organization') return 'Organization';
    return 'Project';
  }, [scopeType]);

  const selectedProject = hubData?.projectDrilldowns.find((project) => project.projectId === selectedProjectId) || null;
  const selectedPartner = hubData?.partnerDrilldowns.find((partner) => partner.partnerId === selectedPartnerId) || null;

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="🤝 Sponsorship Hub"
        subtitle="Unified sponsorship performance, proof evidence, and activation readiness across events, partners, organizations, and tracked links."
        backLink="/admin"
        showSearch={scopeType === 'project'}
        searchValue={projectSearch}
        onSearchChange={scopeType === 'project' ? setProjectSearch : undefined}
        searchPlaceholder="Search events to load one project..."
      />

      <div className={styles.page}>
        <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
          <div className={styles.controlsCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Scope Controls</h2>
              <p className={styles.sectionSubtitle}>
                Start with a portfolio view, then narrow to a partner, organization, or single project.
              </p>
            </div>

            <div className={styles.controlsGrid}>
              <div className={styles.controlGroup}>
                <label htmlFor="scopeType" className={styles.controlLabel}>Scope Type</label>
                <select
                  id="scopeType"
                  value={scopeType}
                  onChange={(event) => {
                    setScopeType(event.target.value as SponsorshipHubScopeType);
                    setSelectedScopeId('');
                  }}
                  className={`form-input ${styles.selectInput}`}
                >
                  <option value="portfolio">Portfolio</option>
                  <option value="partner">Partner</option>
                  <option value="organization">Organization</option>
                  <option value="project">Project</option>
                </select>
              </div>

              <div className={styles.controlGroup}>
                <label htmlFor="rangePreset" className={styles.controlLabel}>Time Range</label>
                <select
                  id="rangePreset"
                  value={rangePreset}
                  onChange={(event) => setRangePreset(event.target.value as SponsorshipHubRangePreset)}
                  className={`form-input ${styles.selectInput}`}
                >
                  {RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {scopeType === 'partner' && (
                <div className={styles.controlGroup}>
                  <label htmlFor="partnerScope" className={styles.controlLabel}>Partner</label>
                  <select
                    id="partnerScope"
                    value={selectedScopeId}
                    onChange={(event) => setSelectedScopeId(event.target.value)}
                    className={`form-input ${styles.selectInput}`}
                  >
                    <option value="">Select a partner</option>
                    {partners.map((partner) => (
                      <option key={partner._id} value={partner._id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {scopeType === 'organization' && (
                <div className={styles.controlGroup}>
                  <label htmlFor="organizationScope" className={styles.controlLabel}>Organization</label>
                  <select
                    id="organizationScope"
                    value={selectedScopeId}
                    onChange={(event) => setSelectedScopeId(event.target.value)}
                    className={`form-input ${styles.selectInput}`}
                  >
                    <option value="">Select an organization</option>
                    {organizations.map((organization) => (
                      <option key={organization._id} value={organization._id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {scopeType === 'project' && (
              <div className={styles.projectPicker}>
                <p className={styles.helperText}>
                  Search by event name, then select the project you want to load into the hub.
                </p>
                {projectSearchLoading && <p className={styles.helperText}>Searching projects...</p>}
                {!projectSearchLoading && projectSearch.trim().length > 0 && projectMatches.length === 0 && (
                  <p className={styles.helperText}>No matching projects found yet.</p>
                )}
                {projectMatches.length > 0 && (
                  <div className={styles.projectResults}>
                    {projectMatches.map((project) => {
                      const isActive = project._id === selectedScopeId;
                      return (
                        <ColoredCard
                          key={project._id}
                          accentColor={isActive ? 'var(--mm-color-primary-500)' : 'var(--mm-chart-cyan)'}
                          hoverable={true}
                          className={`${styles.projectResultCard} ${isActive ? styles.projectResultActive : ''}`}
                        >
                          <button
                            type="button"
                            className={styles.projectResultButton}
                            onClick={() => setSelectedScopeId(project._id)}
                          >
                            <span className={styles.projectResultName}>{project.eventName}</span>
                            <span className={styles.projectResultMeta}>{formatDate(project.eventDate || null)}</span>
                            <span className={styles.projectResultMeta}>{projectPartnerLabel(project)}</span>
                          </button>
                        </ColoredCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <p className={styles.scopeSummary}>
              Current scope: <strong>{scopeLabel}</strong>
              {hubData?.scope.name ? ` • ${hubData.scope.name}` : ''}
            </p>
            {hubData?.filters && (
              <p className={styles.scopeSummary}>
                Date window: <strong>{hubData.filters.startDate ? formatDate(hubData.filters.startDate) : 'Earliest'}</strong>
                {' '}to{' '}
                <strong>{hubData.filters.endDate ? formatDate(hubData.filters.endDate) : 'Latest'}</strong>
              </p>
            )}
            {hubData?.scopeActions && (
              <div className={styles.actionRow}>
                {actionLinks(hubData.scopeActions).map((action) => (
                  <Link key={action.href} href={action.href} className={styles.actionLink}>
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </ColoredCard>

        {error && (
          <ColoredCard accentColor="var(--mm-error)" hoverable={false}>
            <div className={styles.emptyState}>{error}</div>
          </ColoredCard>
        )}

        {!error && hubData && (
          <>
            <div className={styles.metricGrid}>
              <MetricCard title="Tracked Events" value={hubData.summary.eventCount} format="number" loading={loading} icon="📅" />
              <MetricCard title="Total Fans" value={hubData.summary.totalFans} format="number" loading={loading} icon="👥" />
              <MetricCard title="Media Value" value={hubData.summary.totalAdValue} format="currency" loading={loading} icon="💶" />
              <MetricCard title="Bitly Clicks" value={hubData.summary.totalBitlyClicks} format="number" loading={loading} icon="🔗" />
              <MetricCard title="Avg Engagement" value={hubData.summary.avgEngagementRate} format="percentage" loading={loading} icon="📈" />
              <MetricCard title="Partners in Scope" value={hubData.summary.partnerCount} format="number" loading={loading} icon="🤝" />
            </div>

            <div className={styles.channelGrid}>
              {hubData.channels.map((channel) => (
                <ColoredCard
                  key={channel.key}
                  accentColor={
                    channel.key === 'fan'
                      ? 'var(--mm-chart-blue)'
                      : channel.key === 'media'
                        ? 'var(--mm-chart-green)'
                        : 'var(--mm-chart-orange)'
                  }
                  hoverable={false}
                >
                  <div className={styles.channelCard}>
                    <h3 className={styles.channelTitle}>{channel.label}</h3>
                    <div className={styles.channelValue}>{formatMetric(channel.primaryValue, channel.primaryFormat)}</div>
                    <div className={styles.channelMeta}>
                      <span>{channel.secondaryLabel}</span>
                      <strong>{formatMetric(channel.secondaryValue, channel.secondaryFormat)}</strong>
                    </div>
                    <p className={styles.channelDescription}>{channel.description}</p>
                    <span className={styles.channelSource}>Source: {channel.source}</span>
                  </div>
                </ColoredCard>
              ))}
            </div>

            <div className={styles.doubleGrid}>
              <ColoredCard accentColor="var(--mm-chart-teal)" hoverable={false}>
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Coverage and Attribution</h2>
                    <p className={styles.sectionSubtitle}>{hubData.scope.description}</p>
                  </div>
                  <div className={styles.insightGrid}>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Date Coverage</span>
                      <span className={styles.insightValue}>
                        {formatDate(hubData.summary.earliestEventDate)} - {formatDate(hubData.summary.latestEventDate)}
                      </span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Bitly Coverage</span>
                      <span className={styles.insightValue}>{hubData.coverage.bitlyCoverageRate.toFixed(1)}%</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Projects With Bitly</span>
                      <span className={styles.insightValue}>{hubData.coverage.projectsWithBitly}</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Projects Without Bitly</span>
                      <span className={styles.insightValue}>{hubData.coverage.projectsWithoutBitly}</span>
                    </div>
                  </div>
                </div>
              </ColoredCard>

              <ColoredCard accentColor="var(--mm-chart-purple)" hoverable={false}>
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Activation Readiness</h2>
                    <p className={styles.sectionSubtitle}>
                      First `#788` proof-of-performance workspace slice, built from the same evidence model as the hub.
                    </p>
                  </div>
                  <div className={styles.insightGrid}>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Readiness Score</span>
                      <span className={styles.insightValue}>{hubData.activationWorkspace.readinessScore.toFixed(1)}%</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Ready Projects</span>
                      <span className={styles.insightValue}>{hubData.activationWorkspace.readyProjects}</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Needs Bitly</span>
                      <span className={styles.insightValue}>{hubData.activationWorkspace.needsBitlyProjects}</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Needs Report Link</span>
                      <span className={styles.insightValue}>{hubData.activationWorkspace.needsReportProjects}</span>
                    </div>
                  </div>
                  <div className={styles.actionRow}>
                    <Link href={hubData.scopeActions.activationUrl || '/admin/analytics/sponsorship/activation'} className={styles.actionLink}>
                      Open Activation Workspace
                    </Link>
                  </div>
                </div>
              </ColoredCard>
            </div>

            <ColoredCard accentColor="var(--mm-chart-orange)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Scope Trend View</h2>
                  <p className={styles.sectionSubtitle}>
                    Time-window movement across fan volume, media value, and tracked link clicks for the current scope.
                  </p>
                </div>
                {renderChart(
                  'Scope Trend',
                  'One server-side timeline for the current sponsorship scope.',
                  hubData.trend,
                  [
                    { key: 'fans', label: 'Fans', color: '#2563eb', format: 'number' },
                    { key: 'adValue', label: 'Media Value', color: '#059669', format: 'currency' },
                    { key: 'bitlyClicks', label: 'Bitly Clicks', color: '#ea580c', format: 'number' },
                  ]
                )}
              </div>
            </ColoredCard>

            <ColoredCard accentColor="var(--mm-color-secondary-500)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Top Projects</h2>
                  <p className={styles.sectionSubtitle}>
                    Ranked by combined sponsorship value and tracked link activity inside the current scope.
                  </p>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Date</th>
                        <th>Partner</th>
                        <th>Fans</th>
                        <th>Media Value</th>
                        <th>Bitly Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hubData.topProjects.length > 0 ? hubData.topProjects.map((project) => (
                        <tr
                          key={project.projectId}
                          className={project.projectId === selectedProjectId ? styles.selectedRow : ''}
                        >
                          <td>
                            <button
                              type="button"
                              className={styles.selectButton}
                              onClick={() => setSelectedProjectId(project.projectId)}
                            >
                              <strong>{project.eventName}</strong>
                            </button>
                          </td>
                          <td>{formatDate(project.eventDate)}</td>
                          <td>{project.partnerLabel}</td>
                          <td>{project.fans.toLocaleString('en-US')}</td>
                          <td>€{Math.round(project.adValue).toLocaleString('en-US')}</td>
                          <td>{project.bitlyClicks.toLocaleString('en-US')}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6}>No ranked projects available for the current scope.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedProject && (
                  <div className={styles.detailStack}>
                    <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
                      <div className={styles.detailCard}>
                        <div className={styles.sectionHeader}>
                          <h3 className={styles.detailTitle}>Selected Project Drilldown</h3>
                          <p className={styles.sectionSubtitle}>
                            Source-level evidence, report actions, and a project-level trend from the unified payload.
                          </p>
                        </div>
                        <div className={styles.detailMeta}>
                          <span><strong>{selectedProject.eventName}</strong></span>
                          <span>{formatDate(selectedProject.eventDate)} • {selectedProject.partnerLabel}</span>
                          <span>Primary partner: {selectedProject.primaryPartnerName || 'Not resolved'}</span>
                        </div>
                        <div className={styles.actionRow}>
                          {actionLinks(selectedProject.actions).map((action) => (
                            <Link key={action.href} href={action.href} className={styles.actionLink}>
                              {action.label}
                            </Link>
                          ))}
                        </div>
                        <EvidenceTable title="Project Evidence" rows={selectedProject.sourceBreakdown} />
                        <div className={styles.pillGrid}>
                          <div className={styles.pillCard}>
                            <span className={styles.pillTitle}>Top Countries</span>
                            {selectedProject.topCountries.length > 0 ? selectedProject.topCountries.map((item) => (
                              <span key={item.label} className={styles.pill}>{item.label}: {item.clicks}</span>
                            )) : <span className={styles.helperText}>No country-level Bitly evidence captured.</span>}
                          </div>
                          <div className={styles.pillCard}>
                            <span className={styles.pillTitle}>Top Referrers</span>
                            {selectedProject.topReferrers.length > 0 ? selectedProject.topReferrers.map((item) => (
                              <span key={item.label} className={styles.pill}>{item.label}: {item.clicks}</span>
                            )) : <span className={styles.helperText}>No referrer-level Bitly evidence captured.</span>}
                          </div>
                        </div>
                        {renderChart(
                          'Project Trend',
                          'Bitly daily clicks when available, otherwise a project snapshot point.',
                          selectedProject.trend,
                          [{ key: 'bitlyClicks', label: 'Bitly Clicks', color: '#ea580c', format: 'number' }]
                        )}
                      </div>
                    </ColoredCard>
                  </div>
                )}
              </div>
            </ColoredCard>

            <ColoredCard accentColor="var(--mm-chart-purple)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Top Partner Rollups</h2>
                  <p className={styles.sectionSubtitle}>
                    Sponsorship metrics are attributed to the primary partner for each aggregate so the commercial rollup stays explainable and avoids duplicate event credit.
                  </p>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Partner</th>
                        <th>Events in Scope</th>
                        <th>Fans</th>
                        <th>Media Value</th>
                        <th>Bitly Clicks</th>
                        <th>Avg Engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hubData.topPartners.length > 0 ? hubData.topPartners.map((partner) => (
                        <tr
                          key={partner.partnerId}
                          className={partner.partnerId === selectedPartnerId ? styles.selectedRow : ''}
                        >
                          <td>
                            <button
                              type="button"
                              className={styles.selectButton}
                              onClick={() => setSelectedPartnerId(partner.partnerId)}
                            >
                              <strong>{partner.emoji ? `${partner.emoji} ` : ''}{partner.name}</strong>
                            </button>
                          </td>
                          <td>{partner.eventCount}</td>
                          <td>{partner.totalFans.toLocaleString('en-US')}</td>
                          <td>€{Math.round(partner.totalAdValue).toLocaleString('en-US')}</td>
                          <td>{partner.totalBitlyClicks.toLocaleString('en-US')}</td>
                          <td>{partner.avgEngagementRate.toFixed(1)}%</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6}>No partner activity found for the current scope.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedPartner && (
                  <div className={styles.detailStack}>
                    <ColoredCard accentColor="var(--mm-chart-purple)" hoverable={false}>
                      <div className={styles.detailCard}>
                        <div className={styles.sectionHeader}>
                          <h3 className={styles.detailTitle}>Selected Partner Drilldown</h3>
                          <p className={styles.sectionSubtitle}>
                            Attribution evidence, proof links, and partner-level trend data for renewal conversations.
                          </p>
                        </div>
                        <div className={styles.detailMeta}>
                          <span><strong>{selectedPartner.emoji ? `${selectedPartner.emoji} ` : ''}{selectedPartner.name}</strong></span>
                          <span>{selectedPartner.eventCount} primary-partner events in current scope</span>
                          <span>Attribution basis: {selectedPartner.attributionBasis}</span>
                        </div>
                        <div className={styles.actionRow}>
                          {actionLinks(selectedPartner.actions).map((action) => (
                            <Link key={action.href} href={action.href} className={styles.actionLink}>
                              {action.label}
                            </Link>
                          ))}
                        </div>
                        <EvidenceTable title="Partner Evidence" rows={selectedPartner.sourceBreakdown} />
                        {renderChart(
                          'Partner Trend',
                          'Partner-attributed event performance across the selected time window.',
                          selectedPartner.trend,
                          [
                            { key: 'fans', label: 'Fans', color: '#2563eb', format: 'number' },
                            { key: 'adValue', label: 'Media Value', color: '#059669', format: 'currency' },
                            { key: 'bitlyClicks', label: 'Bitly Clicks', color: '#ea580c', format: 'number' },
                          ]
                        )}
                        <p className={styles.detailNote}>{selectedPartner.attributionSummary}</p>
                        <div className={styles.tableWrap}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th>Attributed Project</th>
                                <th>Date</th>
                                <th>Fans</th>
                                <th>Media Value</th>
                                <th>Bitly Clicks</th>
                                <th>Report</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPartner.attributedProjects.map((project) => (
                                <tr key={`${selectedPartner.partnerId}-${project.projectId}`}>
                                  <td><strong>{project.eventName}</strong></td>
                                  <td>{formatDate(project.eventDate)}</td>
                                  <td>{project.fans.toLocaleString('en-US')}</td>
                                  <td>€{Math.round(project.adValue).toLocaleString('en-US')}</td>
                                  <td>{project.bitlyClicks.toLocaleString('en-US')}</td>
                                  <td>
                                    {project.reportUrl ? (
                                      <Link href={project.reportUrl} className={styles.inlineLink}>Open</Link>
                                    ) : (
                                      'Unavailable'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </ColoredCard>
                  </div>
                )}
              </div>
            </ColoredCard>

            <ColoredCard accentColor="var(--mm-chart-teal)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Proof-of-Performance Queue</h2>
                  <p className={styles.sectionSubtitle}>
                    The first activation queue exposes which projects are already sponsor-ready and which ones still need proof artifacts.
                  </p>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Date</th>
                        <th>Fan Evidence</th>
                        <th>Media Value</th>
                        <th>Bitly</th>
                        <th>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hubData.activationWorkspace.proofItems.length > 0 ? hubData.activationWorkspace.proofItems.map((item) => (
                        <tr key={item.projectId}>
                          <td>
                            <strong>{item.eventName}</strong>
                            <div className={styles.cellMeta}>{item.partnerLabel}</div>
                          </td>
                          <td>{formatDate(item.eventDate)}</td>
                          <td>{item.hasFanEvidence ? formatMetric(item.fans, 'number') : 'Missing'}</td>
                          <td>{item.hasMediaEvidence ? formatMetric(item.adValue, 'currency') : 'Missing'}</td>
                          <td>{item.hasBitlyEvidence ? formatMetric(item.bitlyClicks, 'number') : 'Missing'}</td>
                          <td>{item.hasReportLink && item.reportUrl ? <Link href={item.reportUrl} className={styles.inlineLink}>Open</Link> : 'Missing'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6}>No proof items available for the current scope.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {hubData.activationWorkspace.nextActions.length > 0 && (
                  <div className={styles.noteList}>
                    {hubData.activationWorkspace.nextActions.map((item) => (
                      <p key={item} className={styles.detailNote}>{item}</p>
                    ))}
                  </div>
                )}
              </div>
            </ColoredCard>
          </>
        )}
      </div>
    </div>
  );
}
