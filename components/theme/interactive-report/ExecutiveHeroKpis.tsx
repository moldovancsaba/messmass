'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import styles from './executive-view.module.css';

interface ExecutiveHeroKpisProps {
  title?: string;
  subtitle?: string;
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  totalAudience: number;
  analyzedImages: number;
  fanAppearances: number;
  partnerScope?: string;
  isRunning?: boolean;
}

const SPORT_OPTIONS = [
  { id: 'all', label: 'All Leagues', icon: '🏆' },
  { id: 'Basketball', label: 'Basketball', icon: '🏀' },
  { id: 'Football', label: 'Football', icon: '⚽' },
  { id: 'Handball', label: 'Handball', icon: '🤾' },
  { id: 'Ice Hockey', label: 'Ice Hockey', icon: '🏒' },
];

export default function ExecutiveHeroKpis({
  title = 'Szerencsejáték Zrt. & Tippmix',
  subtitle = 'Multi-Sport Brand Exposure, Marketing Value & Visual Intelligence',
  selectedSport,
  onSelectSport,
  totalAudience,
  analyzedImages,
  fanAppearances,
  partnerScope = 'SZRT 2024-2026',
  isRunning = false,
}: ExecutiveHeroKpisProps) {
  const fansPerImage =
    analyzedImages > 0 ? (fanAppearances / analyzedImages).toFixed(1) : '2.1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Executive Header & Scope Switcher */}
      <div className={styles.executiveHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerBadgeRow}>
            <span className={styles.executiveBadge}>Executive Dashboard</span>
            {isRunning ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                <span className={styles.liveDot} /> LIVE STREAMING
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                <span className={styles.liveDot} /> VERIFIED REPORT
              </span>
            )}
          </div>
          <h2 className={styles.executiveTitle}>
            {title}
          </h2>
          <p className={styles.executiveSubtitle}>
            {subtitle}
          </p>
        </div>

        {/* League Scope Switcher Chips */}
        <div className={styles.scopeSwitcher} role="tablist" aria-label="Select sports league scope">
          {SPORT_OPTIONS.map((opt) => {
            const isActive = selectedSport.toLowerCase() === opt.id.toLowerCase();
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectSport(opt.id)}
                className={`${styles.scopeBtn} ${isActive ? styles.scopeBtnActive : ''}`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top-4 Hero KPI Band */}
      <div className={styles.kpiGrid}>
        {/* Audience */}
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrap}
            style={{ background: '#eef2ff', color: '#4f46e5' }}
          >
            👥
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Audience</div>
            <div className={styles.kpiValue}>
              {totalAudience.toLocaleString()}
            </div>
            <div className={styles.kpiSubtext} title="Adjusted for multi-fan visibility and frame coverage">
              <span style={{ color: '#10b981', fontWeight: 700 }}>+6.4% correction</span>
              <span>• model adjusted</span>
            </div>
          </div>
        </div>

        {/* Analyzed Selfies */}
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrap}
            style={{ background: '#e0f2fe', color: '#0284c7' }}
          >
            ☑️
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Analyzed Images</div>
            <div className={styles.kpiValue}>
              {analyzedImages.toLocaleString()}
            </div>
            <div className={styles.kpiSubtext}>
              <span>computer vision verified</span>
            </div>
          </div>
        </div>

        {/* People Appearances */}
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrap}
            style={{ background: '#fef3c7', color: '#d97706' }}
          >
            🧑‍🤝‍🧑
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Fan Appearances</div>
            <div className={styles.kpiValue}>
              {fanAppearances.toLocaleString()}
            </div>
            <div className={styles.kpiSubtext}>
              <span>{fansPerImage} fans per photo</span>
            </div>
          </div>
        </div>

        {/* Scope */}
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrap}
            style={{ background: '#f3e8ff', color: '#7c3aed' }}
          >
            📁
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>National Scope</div>
            <div
              className={styles.kpiValue}
              style={{ fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={partnerScope}
            >
              {partnerScope}
            </div>
            <div className={styles.kpiSubtext}>
              <span>4 Leagues • 20+ Venues</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
