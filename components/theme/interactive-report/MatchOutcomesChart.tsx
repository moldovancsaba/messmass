'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import { MatchItem } from './types';
import styles from './interactive-report.module.css';

interface MatchOutcomesChartProps {
  matches: MatchItem[];
  scopeType?: string;
  partnerName?: string;
  analytics?: {
    homeWins: number;
    draws: number;
    awayWins: number;
    homeWinRate: number;
    drawRate: number;
    awayWinRate: number;
  };
}

function clubMatchesSide(side: string, partnerName: string): boolean {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const s = norm(side);
  const p = norm(partnerName);
  if (!s || !p) return false;
  if (s.includes(p) || p.includes(s)) return true;
  const pWords = partnerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter((w) => w.length >= 3 && !['fc', 'sc', 'kc', 'hc', 'budapest', 'sport'].includes(w));
  return pWords.some((w) => s.includes(w));
}

export default function MatchOutcomesChart({ matches, scopeType, partnerName, analytics }: MatchOutcomesChartProps) {
  const isClubScope = scopeType === 'partner' && Boolean(partnerName);

  // If partner scope, compute Club Wins / Draws / Losses; otherwise Home Wins / Draws / Visitor Wins
  const { homeWins, draws, awayWins, homeWinRate, drawRate, awayWinRate, clubMode } = React.useMemo(() => {
    if (isClubScope && partnerName) {
      let cw = 0;
      let dr = 0;
      let cl = 0;
      for (const m of matches) {
        const outcome = m.outcome ?? (
          m.homeScore !== null && m.homeScore !== undefined && m.visitorScore !== null && m.visitorScore !== undefined
            ? (m.homeScore > m.visitorScore ? 'home_win' : m.homeScore < m.visitorScore ? 'away_win' : 'draw')
            : undefined
        );
        if (!outcome || outcome === 'unrecorded') continue;
        if (outcome === 'draw') {
          dr++;
          continue;
        }
        const parts = (m.cleanName || m.matchName || '').split(/\s+(?:x|vs\.?)\s+|\s*#\s*/i);
        const homeSide = parts[0] || '';
        const awaySide = parts[1] || '';
        const isHome = clubMatchesSide(homeSide, partnerName);
        const isAway = !isHome && clubMatchesSide(awaySide, partnerName);
        if (isHome) {
          if (outcome === 'home_win') cw++;
          else cl++;
        } else if (isAway) {
          if (outcome === 'away_win') cw++;
          else cl++;
        } else {
          if (outcome === 'home_win') cw++;
          else cl++;
        }
      }
      const total = cw + dr + cl || 1;
      return {
        homeWins: cw,
        draws: dr,
        awayWins: cl,
        homeWinRate: Math.round((cw / total) * 1000) / 10,
        drawRate: Math.round((dr / total) * 1000) / 10,
        awayWinRate: Math.round((cl / total) * 1000) / 10,
        clubMode: true,
      };
    }

    if (analytics && (analytics.homeWins > 0 || analytics.draws > 0 || analytics.awayWins > 0)) {
      return { ...analytics, clubMode: false };
    }
    let hw = 0;
    let dr = 0;
    let aw = 0;
    for (const m of matches) {
      if (m.outcome === 'home_win') hw++;
      else if (m.outcome === 'draw') dr++;
      else if (m.outcome === 'away_win') aw++;
      else if (m.homeScore !== null && m.homeScore !== undefined && m.visitorScore !== null && m.visitorScore !== undefined) {
        if (m.homeScore > m.visitorScore) hw++;
        else if (m.homeScore < m.visitorScore) aw++;
        else dr++;
      }
    }
    const total = hw + dr + aw || 1;
    return {
      homeWins: hw,
      draws: dr,
      awayWins: aw,
      homeWinRate: Math.round((hw / total) * 1000) / 10,
      drawRate: Math.round((dr / total) * 1000) / 10,
      awayWinRate: Math.round((aw / total) * 1000) / 10,
      clubMode: false,
    };
  }, [matches, analytics, isClubScope, partnerName]);

  const totalMatches = homeWins + draws + awayWins;
  if (totalMatches === 0) return null;

  const firstLabel = clubMode ? `${partnerName} Wins` : 'Home Wins';
  const thirdLabel = clubMode ? 'Losses' : 'Visitor Wins';

  return (
    <div className={`${styles.executiveCard} ${styles.gdsStack}`}>
      <div className={styles.gdsRowBetween}>
        <div>
          <div className={styles.gdsEyebrow}>{clubMode ? 'Club Match Record' : 'Competitive Balance & Results'}</div>
          <h3 className={styles.gdsCardTitle}>{clubMode ? `${partnerName} Results (Win / Draw / Loss)` : 'Home vs. Visitor Win Distribution'}</h3>
        </div>
        <div className={`${styles.gdsCaption} ${styles.gdsNum}`}>
          {totalMatches} Completed Fixtures
        </div>
      </div>

      {/* Tri-color Stacked Ratio Bar */}
      <div
        style={{
          display: 'flex',
          height: '24px',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'var(--mm-gray-100)',
        }}
      >
        {homeWinRate > 0 && (
          <div
            title={`${firstLabel}: ${homeWins} (${homeWinRate}%)`}
            style={{ width: `${homeWinRate}%`, backgroundColor: 'var(--report-primary, var(--mm-gray-800))' }}
          />
        )}
        {drawRate > 0 && (
          <div
            title={`Draws: ${draws} (${drawRate}%)`}
            style={{ width: `${drawRate}%`, backgroundColor: 'var(--mm-gray-400)' }}
          />
        )}
        {awayWinRate > 0 && (
          <div
            title={`${thirdLabel}: ${awayWins} (${awayWinRate}%)`}
            style={{ width: `${awayWinRate}%`, backgroundColor: 'var(--report-accent, var(--mm-gray-600))' }}
          />
        )}
      </div>

      {/* Outcome Cards Grid */}
      <div className={styles.suiteGrid3}>
        <div className={styles.gdsSubCard}>
          <div className={`${styles.gdsEyebrow} ${styles.gdsPrimaryText}`}>{firstLabel}</div>
          <div className={styles.gdsSectionKpi}>
            {homeWins}{' '}
            <span className={styles.gdsCaption}>({homeWinRate}%)</span>
          </div>
        </div>

        <div className={styles.gdsSubCard}>
          <div className={styles.gdsEyebrow}>Draws</div>
          <div className={styles.gdsSectionKpi}>
            {draws}{' '}
            <span className={styles.gdsCaption}>({drawRate}%)</span>
          </div>
        </div>

        <div className={styles.gdsSubCard}>
          <div className={styles.gdsEyebrow}>{thirdLabel}</div>
          <div className={styles.gdsSectionKpi}>
            {awayWins}{' '}
            <span className={styles.gdsCaption}>({awayWinRate}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
