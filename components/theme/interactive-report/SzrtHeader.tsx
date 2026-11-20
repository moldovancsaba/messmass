'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';
import { InteractiveReportData } from './types';
import { getReportSlug } from './reportSlug';
import type { DashboardTab } from './InteractiveReportDashboard';
import type { HashtagReport } from '@/lib/hashtagReport/types';
import { proofNameKey } from '@/lib/hashtagReport/cameraProof';
import styles from './interactive-report.module.css';

interface SzrtHeaderProps {
  data: InteractiveReportData;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  /** The Fanmass report: Fanmass header figures and tabs only (InteractiveReportDashboard). */
  fanmass?: HashtagReport;
}

export default function SzrtHeader({ data, activeTab, onTabChange, fanmass }: SzrtHeaderProps) {
  const [copied, setCopied] = useState(false);
  const { summary, partner, scope } = data;

  const isHashtag = scope?.type === 'hashtag';
  const isEvent = scope?.type === 'event';
  const isFilter = scope?.type === 'filter';
  const isOrganization = scope?.type === 'organization';

  const badgeText = isOrganization
    ? 'Organization Report'
    : isHashtag
      ? 'Campaign Analytics Report'
      : isFilter
        ? 'Campaign Filter Report'
        : isEvent
          ? 'Event Activation Report'
          : 'Interactive Analytics Report';

  const subBadgeText = isFilter && scope?.hashtags && scope.hashtags.length > 0
    ? scope.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')
    : null;

  const titleText = scope?.name || partner.name;
  const descriptionText =
    scope?.subtitle ||
    (summary.totalMatches > 0
      ? `Fan engagement, photo volume and marketing opt-in metrics across ${summary.totalMatches.toLocaleString()} ${summary.totalMatches === 1 ? 'event' : 'events'}.`
      : null);

  const reportSlug = getReportSlug(data);
  // The dedicated map page reads the clicker matches; the Fanmass report keeps its map in the Territory tab
  const mapHref = reportSlug && !fanmass ? `/interactive-report/${reportSlug}/map` : null;
  const emoji = scope?.emoji || partner.emoji;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Names read in the drive photos and in the Camera photos, each name once
  const brandsRead = fanmass
    ? [...fanmass.measured.drive.brands, ...fanmass.measured.photos.brands]
        .reduce<Array<{ name: string; count: number }>>((list, row) => {
          const found = list.find((item) => proofNameKey(item.name) === proofNameKey(row.name));
          if (found) found.count += row.count;
          else list.push({ ...row });
          return list;
        }, [])
        .sort((a, b) => b.count - a.count)
    : [];
  const optIn = fanmass ? fanmass.calculated.photoOptInShare : null;

  const vision = data.vision;
  const hasTerritoryData = (data.matches?.length ?? 0) > 0 || !!vision;
  const visionLabel =
    vision && vision.totalImages > 0
      ? `Visual Analytics (${vision.processedCount.toLocaleString()}/${vision.totalImages.toLocaleString()})`
      : 'Visual Analytics';

  const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = fanmass ? [
    // The Fanmass report: what the local AI measured only; the clicker tabs live in the clicker report. The overview
    // carries the victory podiums and the demographics quadrant (vision data); its clicker parts hide without data.
    ...(vision ? [{ id: 'overview' as const, label: 'Executive Overview', icon: '🏆' }] : []),
    ...(vision ? [{ id: 'vision' as const, label: visionLabel, icon: '📸' }] : []),
    ...(hasTerritoryData ? [{ id: 'territory' as const, label: 'Territory Map', icon: '🗺️' }] : []),
    ...((data.matches?.length ?? 0) > 0 ? [{ id: 'table' as const, label: 'All Match Data', icon: '⚽' }] : []),
    ...(data.demographics ? [{ id: 'demographics' as const, label: 'Audience Demographics', icon: '👥' }] : []),
    { id: 'figures', label: 'Figures and events', icon: '📋' },
  ] : [
    { id: 'overview', label: 'Executive Overview', icon: '📊' },
    // The vision tab only exists for scopes that have vision data.
    ...(vision ? [{ id: 'vision' as const, label: visionLabel, icon: '📸' }] : []),
    ...(hasTerritoryData ? [{ id: 'territory' as const, label: 'Territory Map', icon: '🗺️' }] : []),
    { id: 'bubble', label: 'Match Explorer', icon: '🫧' },
    { id: 'funnel', label: 'Marketing Funnel', icon: '📈' },
    { id: 'demographics', label: 'Audience Demographics', icon: '👥' },
    { id: 'table', label: 'All Match Data', icon: '📋' },
  ];

  return (
    <header className={styles.headerContainer}>
      {/* Brand Hero Banner */}
      <div className={styles.brandHero}>
        <div className={styles.brandTop}>
          <div>
            <div className={styles.brandTitleGroup}>
              {emoji && <span className={styles.partnerEmoji}>{emoji}</span>}
              <span className={styles.badgePill}>
                {badgeText}
              </span>
              {subBadgeText && (
                <span className={styles.tippmixPill}>
                  {subBadgeText}
                </span>
              )}
            </div>
            <h1 className={styles.partnerTitle}>
              {titleText}
            </h1>
            {descriptionText && (
              <p className={styles.partnerDescription}>
                {descriptionText}
              </p>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className={styles.actionsGroup}>
            {mapHref && (
              <a
                href={mapHref}
                className={styles.mapActionBtn}
                title="Open dedicated full-screen territory and venue analytics map"
              >
                🗺️ Territory Map ➔
              </a>
            )}
            <button onClick={handleCopyLink} className={styles.shareActionBtn}>
              🔗 {copied ? 'Copied Link!' : 'Share Report'}
            </button>
            <button onClick={() => window.print()} className={styles.printActionBtn}>
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        {/* High-level KPI Cards Strip: every value comes from the report data, n/a when nothing is stored */}
        {fanmass ? (
          /* Fanmass figures only: what the local AI measured (lib/hashtagReport), n/a when nothing is measured */
          <div className={styles.kpiGrid}>
            {[
              { label: 'Photos', value: fanmass.measured.drive.photos + fanmass.measured.photos.analysed, text: fanmass.measured.drive.placed > 0 ? `${fanmass.measured.drive.placed.toLocaleString()} placed in an event` : null },
              { label: 'AI Analysed Photos', value: fanmass.measured.drive.analysed + fanmass.measured.photos.analysed, text: null },
              { label: 'People seen', value: fanmass.measured.drive.people + fanmass.measured.photos.people.measured, text: null },
              { label: 'Brands read', value: brandsRead.length, text: brandsRead[0] ? `Most seen: ${brandsRead[0].name}` : null },
              { label: 'Events', value: fanmass.coverage.events, text: null },
            ].map((card) => (
              <div key={card.label} className={styles.kpiCard}>
                <span className={styles.kpiLabel}>{card.label}</span>
                <span className={styles.kpiValue}>{card.value > 0 ? card.value.toLocaleString() : 'n/a'}</span>
                {card.value > 0 && card.text && <span className={styles.kpiSubtext}>{card.text}</span>}
              </div>
            ))}
            {/* The opt-in headline (owner answer 512): photos with a stored opt-in record, drive and Camera, never a
                marketing opt-in typed for a campaign; the share with its two counts, or Not measured */}
            {optIn && (
              <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Photos with opt-in</span>
                <span className={styles.kpiValueHighlight}>{optIn.value !== null ? `${optIn.value}%` : 'Not measured'}</span>
                {optIn.numerator !== null && optIn.denominator !== null && (
                  <span className={styles.kpiSubtext}>{optIn.numerator.toLocaleString()} of {optIn.denominator.toLocaleString()} {optIn.basis}</span>
                )}
              </div>
            )}
          </div>
        ) : (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Photos Taken</span>
            <span className={styles.kpiValue}>
              {summary.totalPhotos > 0 ? summary.totalPhotos.toLocaleString() : 'n/a'}
            </span>
            {summary.totalPhotos > 0 && summary.hostessPhotos > 0 && summary.selfies > 0 && (
              <span className={styles.kpiSubtext}>
                {summary.hostessShare}% Hostess • {summary.selfieShare}% Fan Selfies
              </span>
            )}
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Fan Registrations</span>
            <span className={styles.kpiValue}>
              {summary.totalRegistered > 0 ? summary.totalRegistered.toLocaleString() : 'n/a'}
            </span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Marketing Opt-In</span>
            {/* The stored count is the figure; the rate is shown under it only when it can be derived from the stored counts */}
            <span className={styles.kpiValueHighlight}>
              {summary.totalOptIns > 0 ? summary.totalOptIns.toLocaleString() : 'n/a'}
            </span>
            {summary.optInRate !== null ? (
              <span className={styles.kpiSubtext}>{summary.optInRate}% of registrations</span>
            ) : summary.totalOptIns > summary.totalRegistered && summary.totalRegistered > 0 ? (
              <span className={styles.kpiSubtext}>
                Rate not shown: more opt-ins than registrations ({summary.totalRegistered.toLocaleString()}) are stored
              </span>
            ) : null}
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Vetting Approval</span>
            <span className={styles.kpiValue}>
              {summary.vettingApprovalRate !== null ? `${summary.vettingApprovalRate}%` : 'n/a'}
            </span>
            {summary.vettingApprovalRate !== null && (
              <span className={styles.kpiSubtext}>Approved of submitted photos</span>
            )}
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Events</span>
            <span className={styles.kpiValue}>
              {summary.totalMatches > 0 ? summary.totalMatches.toLocaleString() : 'n/a'}
            </span>
          </div>
        </div>
        )}
      </div>

      {/* Navigation Tab Pills */}
      <nav className={styles.tabNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
