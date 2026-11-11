'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';
import { InteractiveReportData } from './types';
import { getReportSlug } from './reportSlug';
import styles from './interactive-report.module.css';

interface SzrtHeaderProps {
  data: InteractiveReportData;
  activeTab: 'overview' | 'vision' | 'territory' | 'bubble' | 'funnel' | 'demographics' | 'table';
  onTabChange: (tab: 'overview' | 'vision' | 'territory' | 'bubble' | 'funnel' | 'demographics' | 'table') => void;
}

export default function SzrtHeader({ data, activeTab, onTabChange }: SzrtHeaderProps) {
  const [copied, setCopied] = useState(false);
  const { summary, partner, scope } = data;

  const isHashtag = scope?.type === 'hashtag';
  const isEvent = scope?.type === 'event';

  const badgeText = isHashtag
    ? `Campaign Hashtag #${scope?.id}`
    : isEvent
      ? 'Event Activation Report'
      : 'Interactive Analytics Report';

  const subBadgeText = scope?.type ? `${scope.type.toUpperCase()} Scope` : null;

  const titleText = scope?.name || partner.name;
  const descriptionText =
    scope?.subtitle ||
    (summary.totalMatches > 0
      ? `Fan engagement, photo volume and marketing opt-in metrics across ${summary.totalMatches.toLocaleString()} ${summary.totalMatches === 1 ? 'event' : 'events'}.`
      : null);

  const reportSlug = getReportSlug(data);
  const mapHref = reportSlug ? `/interactive-report/${reportSlug}/map` : null;
  const emoji = scope?.emoji || partner.emoji;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const vision = data.vision;
  const hasTerritoryData = (data.matches?.length ?? 0) > 0 || !!vision;
  const visionLabel =
    vision && vision.totalImages > 0
      ? `Fanmass AI Vision (${vision.processedCount.toLocaleString()}/${vision.totalImages.toLocaleString()})`
      : 'Fanmass AI Vision';

  const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = [
    { id: 'overview', label: 'Executive Overview', icon: '📊' },
    // The vision tab only exists for scopes that have vision data.
    ...(vision ? [{ id: 'vision' as const, label: visionLabel, icon: '🤖' }] : []),
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
                className={styles.shareBtn}
                style={{ background: '#0f2c4a', color: '#ffffff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Open dedicated full-screen territory and venue analytics map"
              >
                🗺️ Dedicated Territory Map ➔
              </a>
            )}
            <button onClick={handleCopyLink} className={styles.shareBtn}>
              🔗 {copied ? 'Copied to Clipboard!' : 'Share Live Report'}
            </button>
            <button onClick={() => window.print()} className={styles.printBtn}>
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        {/* High-level KPI Cards Strip: every value comes from the report data, n/a when nothing is stored */}
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
            <span className={styles.kpiValueHighlight}>
              {summary.optInRate !== null ? `${summary.optInRate}%` : 'n/a'}
            </span>
            {summary.optInRate !== null ? (
              <span className={styles.kpiSubtext}>
                {summary.totalOptIns.toLocaleString()} opt-ins
              </span>
            ) : summary.totalOptIns > summary.totalRegistered && summary.totalRegistered > 0 ? (
              <span className={styles.kpiSubtext}>
                Stored opt-ins ({summary.totalOptIns.toLocaleString()}) exceed registrations (
                {summary.totalRegistered.toLocaleString()})
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
