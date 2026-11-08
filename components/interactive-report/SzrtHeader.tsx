'use client';

import React, { useState } from 'react';
import { InteractiveReportData } from './types';
import styles from './interactive-report.module.css';

interface SzrtHeaderProps {
  data: InteractiveReportData;
  activeTab: 'overview' | 'bubble' | 'funnel' | 'demographics' | 'table';
  onTabChange: (tab: 'overview' | 'bubble' | 'funnel' | 'demographics' | 'table') => void;
}

export default function SzrtHeader({ data, activeTab, onTabChange }: SzrtHeaderProps) {
  const [copied, setCopied] = useState(false);
  const { summary, partner } = data;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = [
    { id: 'overview', label: 'Executive Overview', icon: '📊' },
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
              <span className={styles.partnerEmoji}>{partner.emoji || '🍀'}</span>
              <span className={styles.badgePill}>
                Official Interactive Analytics Report
              </span>
              <span className={styles.tippmixPill}>
                Tippmix Partnership
              </span>
            </div>
            <h1 className={styles.partnerTitle}>
              {partner.name}
            </h1>
            <p className={styles.partnerDescription}>
              Consolidated fan engagement, photo activation volume, and marketing opt-in conversion metrics across 69 national sports events (Football NB1/NB2, Erste Liga Ice Hockey, Basketball & Handball).
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className={styles.actionsGroup}>
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
