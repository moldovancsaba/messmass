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
    <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div className={styles.cardSubtitle}>{clubMode ? 'Club Match Record' : 'Competitive Balance & Results'}</div>
          <h3 className={styles.cardTitle}>{clubMode ? `${partnerName} Results (Win / Draw / Loss)` : 'Home vs. Visitor Win Distribution'}</h3>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--gds-sys-color-neutral-60, #4b5563)', fontWeight: 500 }}>
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
          backgroundColor: '#f3f4f6',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        {homeWinRate > 0 && (
          <div
            title={`${firstLabel}: ${homeWins} (${homeWinRate}%)`}
            style={{
              width: `${homeWinRate}%`,
              backgroundColor: 'var(--report-primary, #059669)',
              transition: 'width 0.4s ease',
            }}
          />
        )}
        {drawRate > 0 && (
          <div
            title={`Draws: ${draws} (${drawRate}%)`}
            style={{
              width: `${drawRate}%`,
              backgroundColor: '#9ca3af',
              transition: 'width 0.4s ease',
            }}
          />
        )}
        {awayWinRate > 0 && (
          <div
            title={`${thirdLabel}: ${awayWins} (${awayWinRate}%)`}
            style={{
              width: `${awayWinRate}%`,
              backgroundColor: clubMode ? '#64748b' : '#2563eb',
              transition: 'width 0.4s ease',
            }}
          />
        )}
      </div>

      {/* Outcome Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        {/* First Outcome */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--report-primary-soft, #ecfdf5)',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--report-primary, #047857)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--report-primary, #059669)' }} />
            {firstLabel}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
            {homeWins}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', marginLeft: '6px' }}>({homeWinRate}%)</span>
          </div>
        </div>

        {/* Draws */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9ca3af' }} />
            Draws
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1f2937' }}>
            {draws}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#4b5563', marginLeft: '6px' }}>({drawRate}%)</span>
          </div>
        </div>

        {/* Away / Losses */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: clubMode ? '#f8fafc' : '#eff6ff',
            border: clubMode ? '1px solid #e2e8f0' : '1px solid #dbeafe',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: clubMode ? '#475569' : '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: clubMode ? '#64748b' : '#2563eb' }} />
            {thirdLabel}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: clubMode ? '#334155' : '#1e40af' }}>
            {awayWins}
            <span style={{ fontSize: '13px', fontWeight: 500, color: clubMode ? '#64748b' : '#1d4ed8', marginLeft: '6px' }}>({awayWinRate}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
