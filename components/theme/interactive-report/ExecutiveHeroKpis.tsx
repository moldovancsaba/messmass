'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useEffect, useState } from 'react';
import styles from './executive-view.module.css';

interface ExecutiveHeroKpisProps {
  title?: string;
  subtitle?: string;
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  /** Sports present in the measured data. The switcher is hidden unless there are at least two. */
  sportOptions?: string[];
  /** Registered fans; null when nothing was recorded. */
  registeredFans: number | null;
  /** Images analysed by the vision pipeline; null when this scope has no vision data. */
  analyzedImages: number | null;
  /** People detected in the analysed images; null when this scope has no vision data. */
  fanAppearances: number | null;
  scopeLabel?: string;
  eventCount?: number | null;
  /** True when the vision pipeline reports itself as running. */
  isRunning?: boolean;
  /** ISO timestamp of the last vision update. */
  lastUpdated?: string | null;
}

const SPORT_ICONS: Record<string, string> = {
  Basketball: '🏀',
  Football: '⚽',
  Handball: '🤾',
  'Ice Hockey': '🏒',
};

/** A running pipeline only counts as live while its last update is this recent. */
const LIVE_WINDOW_MS = 15 * 60 * 1000;
const CLOCK_REFRESH_MS = 30 * 1000;

interface KpiCard {
  key: string;
  label: string;
  value: string;
  subtext?: string;
  iconBackground: string;
  iconColor: string;
  icon: string;
  valueTitle?: string;
  compactValue?: boolean;
}

export default function ExecutiveHeroKpis({
  title,
  subtitle,
  selectedSport,
  onSelectSport,
  sportOptions = [],
  registeredFans,
  analyzedImages,
  fanAppearances,
  scopeLabel,
  eventCount = null,
  isRunning = false,
  lastUpdated = null,
}: ExecutiveHeroKpisProps) {
  // The clock is read after mount only: server and client renders must agree on first paint.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), CLOCK_REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  const updatedMs = lastUpdated ? Date.parse(lastUpdated) : Number.NaN;
  const hasUpdate = Number.isFinite(updatedMs);
  const isLive = isRunning && hasUpdate && now !== null && now - updatedMs <= LIVE_WINDOW_MS;
  const showLastUpdate = !isLive && hasUpdate && now !== null;

  const sportChips = [
    { id: 'all', label: 'All Sports', icon: '🏆' },
    ...sportOptions.map((sport) => ({
      id: sport,
      label: sport,
      icon: SPORT_ICONS[sport] || '🏅',
    })),
  ];
  const showSwitcher = sportOptions.length >= 2;

  const peoplePerImage =
    analyzedImages !== null &&
    fanAppearances !== null &&
    analyzedImages > 0 &&
    fanAppearances > 0
      ? (fanAppearances / analyzedImages).toFixed(1)
      : null;

  // A card is only shown when it has a stored value behind it.
  const cards: KpiCard[] = [];
  if (registeredFans !== null && registeredFans > 0) {
    cards.push({
      key: 'registered',
      label: 'Registered Fans',
      value: registeredFans.toLocaleString(),
      icon: '👥',
      iconBackground: '#eef2ff',
      iconColor: '#4f46e5',
    });
  }
  if (analyzedImages !== null && analyzedImages > 0) {
    cards.push({
      key: 'analyzed',
      label: 'Analyzed Images',
      value: analyzedImages.toLocaleString(),
      icon: '☑️',
      iconBackground: '#e0f2fe',
      iconColor: '#0284c7',
    });
  }
  if (fanAppearances !== null && fanAppearances > 0) {
    cards.push({
      key: 'people',
      label: 'People Detected',
      value: fanAppearances.toLocaleString(),
      subtext: peoplePerImage ? `${peoplePerImage} people per analyzed image` : undefined,
      icon: '🧑‍🤝‍🧑',
      iconBackground: '#fef3c7',
      iconColor: '#d97706',
    });
  }
  if (scopeLabel) {
    cards.push({
      key: 'scope',
      label: 'Scope',
      value: scopeLabel,
      valueTitle: scopeLabel,
      compactValue: true,
      subtext:
        eventCount !== null && eventCount > 0
          ? `${eventCount.toLocaleString()} ${eventCount === 1 ? 'event' : 'events'}`
          : undefined,
      icon: '📁',
      iconBackground: '#f3e8ff',
      iconColor: '#7c3aed',
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Executive Header & Scope Switcher */}
      <div className={styles.executiveHeader}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.headerBadgeRow}>
            <span className={styles.executiveBadge}>Executive Dashboard</span>
            {isLive && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                <span className={styles.liveDot} /> LIVE STREAMING
              </span>
            )}
            {showLastUpdate && (
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                Vision data updated {new Date(updatedMs).toLocaleString()}
              </span>
            )}
          </div>
          {title && <h2 className={styles.executiveTitle}>{title}</h2>}
          {subtitle && <p className={styles.executiveSubtitle}>{subtitle}</p>}
        </div>

        {/* Sport Scope Switcher Chips */}
        {showSwitcher && (
          <div className={styles.scopeSwitcher} role="tablist" aria-label="Select sport">
            {sportChips.map((opt) => {
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
        )}
      </div>

      {/* 2. Hero KPI Band: only cards that have stored data */}
      {cards.length > 0 && (
        <div className={styles.kpiGrid}>
          {cards.map((card) => (
            <div key={card.key} className={styles.kpiCard}>
              <div
                className={styles.kpiIconWrap}
                style={{ background: card.iconBackground, color: card.iconColor }}
              >
                {card.icon}
              </div>
              <div className={styles.kpiContent}>
                <div className={styles.kpiLabel}>{card.label}</div>
                <div
                  className={styles.kpiValue}
                  style={
                    card.compactValue
                      ? { fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                      : undefined
                  }
                  title={card.valueTitle}
                >
                  {card.value}
                </div>
                {card.subtext && (
                  <div className={styles.kpiSubtext}>
                    <span>{card.subtext}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
