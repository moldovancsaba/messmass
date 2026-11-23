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
    <article className={styles.bentoPanel}>
      <header className={styles.bentoPanelHeader}>
        <div className={styles.bentoPanelTitle}>
          <span className={styles.bentoPanelIcon} aria-hidden="true">🏆</span>
          <h2 className={styles.gdsCardTitle}>
            {clubMode ? `${partnerName} match results` : 'Match results & win rate'}
          </h2>
        </div>
        <span className={styles.bentoPanelStatus}>{totalMatches} matches</span>
      </header>

      <div className={`${styles.bentoPanelBody} ${styles.gdsStack}`}>
        <p className={styles.bentoBenefit}>
          Tracks wins, draws, and losses—winning runs typically boost crowd energy, attendance, and sponsor exposure.
        </p>
        <div className={styles.bentoOutcomesSplit}>
        <div className={styles.bentoOutcomesDonutWrap}>
          <div className={styles.bentoDonut}>
            <svg viewBox="0 0 42 42" className={styles.donutSvg} aria-hidden="true">
              <circle cx="21" cy="21" r="15.9155" className={styles.donutTrack} />
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                className={styles.donutArcPrimary}
                strokeDasharray={`${homeWinRate} ${Math.max(0, 100 - homeWinRate)}`}
              />
            </svg>
            <div className={styles.bentoDonutCenter}>
              <strong className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{homeWinRate}%</strong>
              <span className={styles.gdsCaption}>{clubMode ? 'Wins' : 'Home'}</span>
            </div>
          </div>

          <div className={styles.bentoLegend}>
            <div className={styles.bentoLegendRow}>
              <span className={styles.bentoLegendDotPrimary} />
              <div>
                <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>
                  {homeWins} <span className={styles.gdsCaption}>({homeWinRate}%)</span>
                </div>
                <div className={styles.gdsCaption}>{firstLabel}</div>
              </div>
            </div>
            <div className={styles.bentoLegendRow}>
              <span className={styles.bentoLegendDotMuted} />
              <div>
                <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>
                  {draws} <span className={styles.gdsCaption}>({drawRate}%)</span>
                </div>
                <div className={styles.gdsCaption}>Draws</div>
              </div>
            </div>
            <div className={styles.bentoLegendRow}>
              <span className={styles.bentoLegendDotSuccess} />
              <div>
                <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>
                  {awayWins} <span className={styles.gdsCaption}>({awayWinRate}%)</span>
                </div>
                <div className={styles.gdsCaption}>{thirdLabel}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bentoBarList}>
          {[
            { label: firstLabel, count: homeWins, rate: homeWinRate, cls: styles.bentoBarFillRect },
            { label: 'Draws', count: draws, rate: drawRate, cls: styles.bentoBarFillMuted },
            { label: thirdLabel, count: awayWins, rate: awayWinRate, cls: styles.bentoBarFillTeal },
          ].map((row) => (
            <div key={row.label} className={styles.bentoBarRow}>
              <span className={styles.gdsCaption}>{row.label}</span>
              <div className={styles.bentoBarTrackWrap}>
                <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                  <rect x="0" y="0" width={Math.max(2, row.rate)} height="8" rx="0" className={row.cls} />
                </svg>
              </div>
              <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>{row.rate}%</span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </article>
  );
}
