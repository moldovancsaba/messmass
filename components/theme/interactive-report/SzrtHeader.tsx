'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';
import { InteractiveReportData } from './types';
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
      : 'Official Interactive Analytics Report';

  const subBadgeText = isHashtag && scope?.id === 'tippmixreport2026'
    ? 'Tippmix Partnership'
    : scope?.type
      ? `${scope.type.toUpperCase()} Scope`
      : 'Tippmix Partnership';

  const titleText = scope?.name || partner.name;
  const descriptionText = scope?.subtitle ||
    `Consolidated fan engagement, photo activation volume, and marketing opt-in conversion metrics across ${summary.totalMatches} national sports events (Football NB1/NB2, Erste Liga Ice Hockey, Basketball & Handball).`;

  const mapHref = scope
    ? `/report/${scope.type}/${scope.id}/map`
    : `/interactive-report/${data.partner.viewSlug === 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd' ? 'szrt' : data.partner.viewSlug}/map`;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = [
    { id: 'overview', label: 'Executive Overview', icon: '📊' },
    {
      id: 'vision',
      label: `Fanmass AI Vision (${data.vision?.processedCount || 0}/${data.vision?.totalImages || 11312})`,
      icon: '🤖',
    },
    { id: 'territory', label: 'Territory Map', icon: '🗺️' },
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
              <span className={styles.partnerEmoji}>{scope?.emoji || partner.emoji || '🍀'}</span>
              <span className={styles.badgePill}>
                {badgeText}
              </span>
              <span className={styles.tippmixPill}>
                {subBadgeText}
              </span>
            </div>
            <h1 className={styles.partnerTitle}>
              {titleText}
            </h1>
            <p className={styles.partnerDescription}>
              {descriptionText}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className={styles.actionsGroup}>
            <a
              href={mapHref}
              className={styles.shareBtn}
              style={{ background: '#0f2c4a', color: '#ffffff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Open dedicated full-screen territory and venue analytics map"
            >
              🗺️ Dedicated Territory Map ➔
            </a>
            <button onClick={handleCopyLink} className={styles.shareBtn}>
              🔗 {copied ? 'Copied to Clipboard!' : 'Share Live Report'}
            </button>
            <button onClick={() => window.print()} className={styles.printBtn}>
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        {/* High-level KPI Cards Strip */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Photos Taken</span>
            <span className={styles.kpiValue}>{summary.totalPhotos.toLocaleString()}</span>
            <span className={styles.kpiSubtext}>
              {summary.hostessShare}% Hostess • {summary.selfieShare}% Fan Selfies
            </span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Fan Registrations</span>
            <span className={styles.kpiValue}>{summary.totalRegistered.toLocaleString()}</span>
            <span className={styles.kpiSubtext}>Unique registered attendees</span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Marketing Opt-In</span>
            <span className={styles.kpiValueHighlight}>{summary.optInRate}%</span>
            <span className={styles.kpiSubtext}>
              {summary.totalOptIns.toLocaleString()} Tippmix consents
            </span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Brand Safety Pass</span>
            <span className={styles.kpiValue}>{summary.brandProtectionRate}%</span>
            <span className={styles.kpiSubtext}>Zero brand or PII violations</span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Activated Matches</span>
            <span className={styles.kpiValue}>{summary.totalMatches}</span>
            <span className={styles.kpiSubtext}>4 major sports leagues</span>
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
