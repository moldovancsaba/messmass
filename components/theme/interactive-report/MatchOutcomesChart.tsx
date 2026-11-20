'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import { MatchItem } from './types';
import styles from './interactive-report.module.css';

interface MatchOutcomesChartProps {
  matches: MatchItem[];
  analytics?: {
    homeWins: number;
    draws: number;
    awayWins: number;
    homeWinRate: number;
    drawRate: number;
    awayWinRate: number;
  };
}

export default function MatchOutcomesChart({ matches, analytics }: MatchOutcomesChartProps) {
  // If no precalculated analytics, derive from matches
  const { homeWins, draws, awayWins, homeWinRate, drawRate, awayWinRate } = React.useMemo(() => {
    if (analytics && (analytics.homeWins > 0 || analytics.draws > 0 || analytics.awayWins > 0)) {
      return analytics;
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
    };
  }, [matches, analytics]);

  const totalMatches = homeWins + draws + awayWins;
  if (totalMatches === 0) return null;

  return (
    <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div className={styles.cardSubtitle}>Competitive Balance & Results</div>
          <h3 className={styles.cardTitle}>Home vs. Visitor Win Distribution</h3>
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
            title={`Home Wins: ${homeWins} (${homeWinRate}%)`}
            style={{
              width: `${homeWinRate}%`,
              backgroundColor: '#059669',
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
            title={`Away Wins: ${awayWins} (${awayWinRate}%)`}
            style={{
              width: `${awayWinRate}%`,
              backgroundColor: '#2563eb',
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
        {/* Home Wins */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #d1fae5',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
            Home Wins
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#065f46' }}>
            {homeWins}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#047857', marginLeft: '6px' }}>({homeWinRate}%)</span>
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

        {/* Away / Visitor Wins */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            border: '1px solid #dbeafe',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            Visitor Wins
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e40af' }}>
            {awayWins}
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#1d4ed8', marginLeft: '6px' }}>({awayWinRate}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
