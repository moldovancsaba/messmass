'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import ColoredCard from '@/components/ColoredCard';
import MetricCard from '@/components/analytics/MetricCard';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import type {
  SponsorshipActivationRecapPackage,
  SponsorshipHubRangePreset,
  SponsorshipHubResponse,
  SponsorshipHubScopeType,
} from '@/lib/sponsorshipHub';
import styles from './page.module.css';

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString();
}

function buildAbsoluteUrl(path: string) {
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).toString();
}

function parseScopeType(value: string | null): SponsorshipHubScopeType {
  return value === 'partner' || value === 'organization' || value === 'project' ? value : 'portfolio';
}

function parseRangePreset(value: string | null): SponsorshipHubRangePreset {
  return value === '30d' || value === '90d' || value === '365d' ? value : 'all';
}

function buildRecapEmailDraft(partner: SponsorshipActivationRecapPackage) {
  const reportUrl = partner.actions.reportUrl ? buildAbsoluteUrl(partner.actions.reportUrl) : '';
  const subject = `${partner.name} sponsorship recap package`;
  const body = [
    'Hi,',
    '',
    `The ${partner.name} recap package is ${partner.packageStatus === 'ready' ? 'ready to share' : 'partially ready for review'}.`,
    '',
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

function buildRecapSummary(partner: SponsorshipActivationRecapPackage) {
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

function downloadRecapSummary(partner: SponsorshipActivationRecapPackage) {
  const filenameBase = partner.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'partner-recap';
  const blob = new Blob([buildRecapSummary(partner)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenameBase}-recap-brief.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SponsorshipActivationRecapBriefPage() {
  const params = useParams<{ partnerId: string }>();
  const searchParams = useSearchParams();
  const partnerId = Array.isArray(params?.partnerId) ? params.partnerId[0] : params?.partnerId;
  const [hubData, setHubData] = useState<SponsorshipHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const scopeType = useMemo(() => parseScopeType(searchParams.get('scopeType')), [searchParams]);
  const scopeId = useMemo(() => searchParams.get('scopeId'), [searchParams]);
  const rangePreset = useMemo(() => parseRangePreset(searchParams.get('rangePreset')), [searchParams]);

  useEffect(() => {
    const fetchHub = async () => {
      if (!partnerId) {
        setError('Missing partner id');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const query = new URLSearchParams({ scopeType, rangePreset });
        if (scopeType !== 'portfolio' && scopeId) {
          query.set('scopeId', scopeId);
        }

        const response = await fetch(`/api/analytics/sponsorship-hub?${query.toString()}`);
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || 'Failed to load recap brief');
        }

        const result = await response.json();
        setHubData(result.data);
      } catch (fetchError) {
        console.error('Failed to load activation recap brief:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load recap brief');
      } finally {
        setLoading(false);
      }
    };

    fetchHub();
  }, [partnerId, rangePreset, scopeId, scopeType]);

  const recapPackage = useMemo(
    () => hubData?.activationWorkspace.recapPackages.find((item) => item.partnerId === partnerId) || null,
    [hubData, partnerId]
  );

  const partnerProofItems = useMemo(
    () => hubData?.activationWorkspace.proofItems.filter((item) => item.partnerId === partnerId) || [],
    [hubData, partnerId]
  );

  const readyProofItems = useMemo(
    () => partnerProofItems.filter((item) => item.readinessScore === 100),
    [partnerProofItems]
  );

  const gapProofItems = useMemo(
    () => partnerProofItems.filter((item) => item.readinessScore < 100),
    [partnerProofItems]
  );

  const activationHref = useMemo(() => {
    const query = new URLSearchParams({ scopeType, rangePreset });
    if (scopeType !== 'portfolio' && scopeId) {
      query.set('scopeId', scopeId);
    }
    if (partnerId) {
      query.set('partnerFilter', partnerId);
    }
    return `/admin/analytics/sponsorship/activation?${query.toString()}`;
  }, [partnerId, rangePreset, scopeId, scopeType]);

  const handleCopySummary = async () => {
    if (!recapPackage) return;

    try {
      await navigator.clipboard.writeText(buildRecapSummary(recapPackage));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error('Failed to copy recap summary:', copyError);
    }
  };

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="📦 Recipient-Ready Recap Brief"
        subtitle="A stable sponsor-delivery view built from the activation-ready recap package."
        backLink={activationHref}
        showSearch={false}
      />

      <div className={styles.page}>
        {hubData && (
          <div className={styles.heroMeta}>
            <span>Scope: {hubData.scope.name}</span>
            <span>Date window: {hubData.filters.startDate ? formatDate(hubData.filters.startDate) : 'Earliest'} - {hubData.filters.endDate ? formatDate(hubData.filters.endDate) : 'Latest'}</span>
          </div>
        )}

        {error && (
          <ColoredCard accentColor="var(--mm-error)" hoverable={false}>
            <p className={styles.emptyState}>{error}</p>
          </ColoredCard>
        )}

        {!error && loading && (
          <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
            <p className={styles.emptyState}>Preparing sponsor-ready package...</p>
          </ColoredCard>
        )}

        {!error && !loading && !recapPackage && (
          <ColoredCard accentColor="var(--mm-chart-orange)" hoverable={false}>
            <p className={styles.emptyState}>
              No recap package was found for this partner in the current scope. Return to the activation workspace and confirm the partner has ready proof in this date window.
            </p>
          </ColoredCard>
        )}

        {!error && recapPackage && (
          <>
            <div className={styles.doubleGrid}>
              <MetricCard title="Ready Projects" value={recapPackage.readyProjectCount} format="number" icon="📦" />
              <MetricCard title="Scoped Projects" value={recapPackage.totalProjectCount} format="number" icon="🗂️" />
              <MetricCard title="Fans" value={recapPackage.totalFans} format="number" icon="👥" />
              <MetricCard title="Media Value" value={recapPackage.totalAdValue} format="currency" icon="💶" />
              <MetricCard title="Bitly Clicks" value={recapPackage.totalBitlyClicks} format="number" icon="🔗" />
            </div>

            <ColoredCard accentColor="var(--mm-color-success-500, #16a34a)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {recapPackage.emoji ? `${recapPackage.emoji} ` : ''}{recapPackage.name}
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    {recapPackage.packageStatus === 'ready'
                      ? 'This recap package is ready for sponsor-facing delivery.'
                      : 'This recap package is partially ready. Use the linked activation queue for remaining proof completion before external delivery.'}
                  </p>
                </div>
                <div className={styles.actionRow}>
                  <button type="button" className={styles.actionButton} onClick={handleCopySummary}>
                    {copied ? 'Copied Summary' : 'Copy Brief Summary'}
                  </button>
                  <Link href={buildRecapEmailDraft(recapPackage)} className={styles.actionLink}>
                    Draft Delivery Email
                  </Link>
                  <button type="button" className={styles.actionButton} onClick={() => downloadRecapSummary(recapPackage)}>
                    Download Brief (.txt)
                  </button>
                  <button type="button" className={styles.actionButton} onClick={() => window.print()}>
                    Print / Export PDF
                  </button>
                  {recapPackage.actions.reportUrl && (
                    <Link href={recapPackage.actions.reportUrl} className={styles.actionLink}>
                      Open Partner Report
                    </Link>
                  )}
                  {recapPackage.actions.activationUrl && (
                    <Link href={recapPackage.actions.activationUrl} className={styles.actionLink}>
                      Open Activation Queue
                    </Link>
                  )}
                </div>
              </div>
            </ColoredCard>

            <div className={styles.doubleGrid}>
              <ColoredCard accentColor="var(--mm-chart-teal)" hoverable={false}>
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Delivery Summary</h2>
                    <p className={styles.sectionSubtitle}>
                      The core sponsor-facing proof totals for the current package.
                    </p>
                  </div>
                  <div className={styles.noteList}>
                    <p className={styles.detailNote}>
                      Status: {recapPackage.packageStatus === 'ready' ? 'Full package ready' : 'Partial package ready'}
                    </p>
                    <p className={styles.detailNote}>
                      Ready projects: {recapPackage.readyProjectCount} of {recapPackage.totalProjectCount}
                    </p>
                    <p className={styles.detailNote}>
                      Latest ready event: {formatDate(recapPackage.latestEventDate)}
                    </p>
                    <p className={styles.detailNote}>
                      Recommended delivery path: send the partner report as the primary artifact and use this brief as the commercial cover summary.
                    </p>
                  </div>
                </div>
              </ColoredCard>

              <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Package Metrics</h2>
                    <p className={styles.sectionSubtitle}>
                      Sponsor-ready totals aggregated from activation-complete scoped events.
                    </p>
                  </div>
                  <div className={styles.insightGrid}>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Fans</span>
                      <span className={styles.insightValue}>{recapPackage.totalFans.toLocaleString('en-US')}</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Media Value</span>
                      <span className={styles.insightValue}>€{Math.round(recapPackage.totalAdValue).toLocaleString('en-US')}</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Bitly Clicks</span>
                      <span className={styles.insightValue}>{recapPackage.totalBitlyClicks.toLocaleString('en-US')}</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Scope</span>
                      <span className={styles.insightValue}>{hubData?.scope.name || 'Current scope'}</span>
                    </div>
                  </div>
                </div>
              </ColoredCard>
            </div>

            <ColoredCard accentColor="var(--mm-chart-purple)" hoverable={false}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Included Ready Events</h2>
                  <p className={styles.sectionSubtitle}>
                    These are the scoped events already ready to support external recap delivery.
                  </p>
                </div>
                {recapPackage.readyProjectNames.length > 0 ? (
                  <ol className={styles.eventsList}>
                    {recapPackage.readyProjectNames.map((eventName) => (
                      <li key={eventName}>{eventName}</li>
                    ))}
                  </ol>
                ) : (
                  <p className={styles.emptyState}>No ready events are currently available in this package.</p>
                )}
              </div>
            </ColoredCard>

            <div className={styles.doubleGrid}>
              <ColoredCard accentColor="var(--mm-chart-orange)" hoverable={false}>
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Delivery Readiness</h2>
                    <p className={styles.sectionSubtitle}>
                      A package-level view of what is already sponsor-safe and what still needs operational proof.
                    </p>
                  </div>
                  <div className={styles.insightGrid}>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Ready Events</span>
                      <span className={styles.insightValue}>{readyProofItems.length}</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Open Gaps</span>
                      <span className={styles.insightValue}>{gapProofItems.length}</span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Ready Rate</span>
                      <span className={styles.insightValue}>
                        {partnerProofItems.length > 0 ? Math.round((readyProofItems.length / partnerProofItems.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className={styles.insightItem}>
                      <span className={styles.insightLabel}>Delivery Status</span>
                      <span className={styles.insightValue}>{recapPackage.packageStatus === 'ready' ? 'Ready to send' : 'Needs follow-up'}</span>
                    </div>
                  </div>
                </div>
              </ColoredCard>

              <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Remaining Proof Gaps</h2>
                    <p className={styles.sectionSubtitle}>
                      Use these direct fix paths when the package is not fully ready for external delivery.
                    </p>
                  </div>
                  {gapProofItems.length > 0 ? (
                    <div className={styles.proofList}>
                      {gapProofItems.map((item) => (
                        <div key={item.projectId} className={styles.proofItem}>
                          <div className={styles.proofHeader}>
                            <strong>{item.eventName}</strong>
                            <span>{item.readinessScore.toFixed(0)}% ready</span>
                          </div>
                          <p className={styles.detailNote}>
                            Missing: {item.missingReasons.join(', ')}
                          </p>
                          <p className={styles.detailNote}>
                            Recommended fix: {item.recommendedActionReason}
                          </p>
                          <div className={styles.actionRow}>
                            {item.recommendedActionUrl && (
                              <Link href={item.recommendedActionUrl} className={styles.actionLink}>
                                {item.recommendedActionLabel}
                              </Link>
                            )}
                            {item.editorUrl && (
                              <Link href={item.editorUrl} className={styles.actionLink}>
                                Open Editor
                              </Link>
                            )}
                            {item.reportUrl && (
                              <Link href={item.reportUrl} className={styles.actionLink}>
                                Open Report
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyState}>No open proof gaps remain for this partner in the current scope.</p>
                  )}
                </div>
              </ColoredCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
