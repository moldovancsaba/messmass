'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import { MatchItem } from './types';
import styles from './interactive-report.module.css';

interface WeatherTurnoutCorrelationMatrixProps {
  matches: MatchItem[];
  className?: string;
}

const SPORT_COLORS: Record<string, string> = {
  Football: '#059669',
  'Ice Hockey': '#0284c7',
  Basketball: '#b45309',
  Handball: '#e11d48',
  Other: '#64748b',
};

export default function WeatherTurnoutCorrelationMatrix({
  matches,
  className = '',
}: WeatherTurnoutCorrelationMatrixProps) {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [hoveredMatch, setHoveredMatch] = useState<MatchItem | null>(null);

  // Filter matches with valid weather and attendance/capacity data
  const validMatches = useMemo(() => {
    return matches.filter(
      (m) =>
        m.weather &&
        typeof m.weather.tempC === 'number' &&
        m.venueCapacity &&
        m.venueCapacity > 0 &&
        m.attendance &&
        m.attendance > 0
    );
  }, [matches]);

  const sportsList = useMemo(() => {
    const set = new Set<string>();
    validMatches.forEach((m) => {
      if (m.sport) set.add(m.sport);
    });
    return Array.from(set);
  }, [validMatches]);

  const filteredMatches = useMemo(() => {
    if (selectedSport === 'all') return validMatches;
    return validMatches.filter((m) => m.sport === selectedSport);
  }, [validMatches, selectedSport]);

  // Aggregate statistics by climate bands (respecting active sport filter)
  const climateBands = useMemo(() => {
    const warm: number[] = [];
    const mild: number[] = [];
    const cold: number[] = [];
    const indoor: number[] = [];

    filteredMatches.forEach((m) => {
      const fillRate = m.capacityUtilizationRate ?? (m.attendance && m.venueCapacity ? (m.attendance / m.venueCapacity) * 100 : 0);
      if (m.weather?.isIndoor) {
        indoor.push(fillRate);
      } else if (m.weather) {
        if (m.weather.tempC >= 18) warm.push(fillRate);
        else if (m.weather.tempC >= 10) mild.push(fillRate);
        else cold.push(fillRate);
      }
    });

    const avg = (arr: number[]) => (arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);

    return {
      warm: { count: warm.length, avgFill: avg(warm) },
      mild: { count: mild.length, avgFill: avg(mild) },
      cold: { count: cold.length, avgFill: avg(cold) },
      indoor: { count: indoor.length, avgFill: avg(indoor) },
    };
  }, [filteredMatches]);

  if (validMatches.length === 0) return null;

  // Scatter plot boundaries (respecting active sport filter)
  const tempSource = filteredMatches.length > 0 ? filteredMatches : validMatches;
  const minTemp = Math.min(...tempSource.map((m) => m.weather!.tempC), 0);
  const maxTemp = Math.max(...tempSource.map((m) => m.weather!.tempC), 30);
  const tempRange = Math.max(maxTemp - minTemp, 10);

  return (
    <div className={`${styles.executiveCard} ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className={styles.cardSubtitle}>Environmental Intelligence</div>
          <h3 className={styles.cardTitle}>Weather vs. Stadium Attendance Matrix</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--gds-sys-color-neutral-60, #64748b)' }}>
            Correlation between kickoff climate conditions, ambient temperature, and stadium capacity fill rates
          </p>
        </div>

        {/* Sport Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedSport('all')}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid var(--gds-sys-color-surface-container-high, #e2e8f0)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: selectedSport === 'all' ? 'var(--gds-sys-color-primary, #0f172a)' : '#ffffff',
              color: selectedSport === 'all' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            All Disciplines ({validMatches.length})
          </button>
          {sportsList.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                border: '1px solid var(--gds-sys-color-surface-container-high, #e2e8f0)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: selectedSport === sport ? (SPORT_COLORS[sport] || '#0f172a') : '#ffffff',
                color: selectedSport === sport ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Climate Tier Comparison Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#b45309' }}>☀️ Warm (&gt;18°C)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#92400e', marginTop: '4px' }}>
            {climateBands.warm.avgFill !== null ? `${climateBands.warm.avgFill}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>{climateBands.warm.count} outdoor matches</div>
        </div>

        <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8' }}>⛅ Mild (10–18°C)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e40af', marginTop: '4px' }}>
            {climateBands.mild.avgFill !== null ? `${climateBands.mild.avgFill}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: '#172554', marginTop: '2px' }}>{climateBands.mild.count} outdoor matches</div>
        </div>

        <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#4338ca' }}>❄️ Cold (&lt;10°C)</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#3730a3', marginTop: '4px' }}>
            {climateBands.cold.avgFill !== null ? `${climateBands.cold.avgFill}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: '#312e81', marginTop: '2px' }}>{climateBands.cold.count} outdoor matches</div>
        </div>

        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#047857' }}>🏟️ Indoor Arenas</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#065f46', marginTop: '4px' }}>
            {climateBands.indoor.avgFill !== null ? `${climateBands.indoor.avgFill}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: '#064e3b', marginTop: '2px' }}>{climateBands.indoor.count} arena fixtures</div>
        </div>
      </div>

      {/* Interactive Scatter Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '260px', background: 'var(--gds-sys-color-surface-container-low, #f8fafc)', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px 32px 36px 44px', boxSizing: 'border-box' }}>
        {/* Y-Axis Label & Gridlines */}
        <div style={{ position: 'absolute', left: '8px', top: '10px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
          Fill %
        </div>
        {[100, 75, 50, 25, 0].map((tick) => {
          const topPct = (1 - tick / 100) * 80 + 10;
          return (
            <div key={tick} style={{ position: 'absolute', left: '44px', right: '16px', top: `${topPct}%`, borderTop: '1px dashed #e2e8f0' }}>
              <span style={{ position: 'absolute', left: '-36px', top: '-7px', fontSize: '10px', color: '#94a3b8', fontWeight: 600, width: '30px', textAlign: 'right' }}>
                {tick}%
              </span>
            </div>
          );
        })}

        {/* X-Axis Labels */}
        <div style={{ position: 'absolute', left: '44px', right: '16px', bottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
          <span>{Math.round(minTemp)}°C (Cold)</span>
          <span style={{ color: '#64748b' }}>Kickoff Ambient Temperature (°C)</span>
          <span>{Math.round(maxTemp)}°C (Warm)</span>
        </div>

        {/* Match Scatter Points */}
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {filteredMatches.map((m) => {
            const fillRate = Math.min(
              100,
              Math.max(0, m.capacityUtilizationRate ?? (m.attendance && m.venueCapacity ? (m.attendance / m.venueCapacity) * 100 : 0))
            );
            const temp = m.weather!.tempC;
            const leftPct = ((temp - minTemp) / tempRange) * 94 + 3;
            const topPct = (1 - fillRate / 100) * 82 + 9;
            const isHovered = hoveredMatch?.id === m.id;
            const sportColor = SPORT_COLORS[m.sport] || '#059669';

            return (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                aria-label={`${m.cleanName || m.matchName}: ${m.weather?.tempC}°C, ${Math.round(fillRate)}% capacity`}
                onMouseEnter={() => setHoveredMatch(m)}
                onMouseLeave={() => setHoveredMatch(null)}
                onFocus={() => setHoveredMatch(m)}
                onBlur={() => setHoveredMatch(null)}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: isHovered ? '18px' : '12px',
                  height: isHovered ? '18px' : '12px',
                  borderRadius: '999px',
                  background: m.weather?.isIndoor ? '#ffffff' : sportColor,
                  border: m.weather?.isIndoor ? `3px solid ${sportColor}` : '2px solid #ffffff',
                  boxShadow: isHovered ? '0 0 0 4px rgba(15, 23, 42, 0.15)' : '0 1px 3px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.15s ease',
                  zIndex: isHovered ? 10 : 2,
                }}
              />
            );
          })}
        </div>

        {/* Hover Tooltip Card */}
        {hoveredMatch && (
          <div
            style={{
              position: 'absolute',
              bottom: '44px',
              right: '24px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '10px 14px',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              zIndex: 30,
              maxWidth: '280px',
              fontSize: '12px',
              pointerEvents: 'none',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
              {hoveredMatch.cleanName || hoveredMatch.matchName}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px' }}>
              📍 {hoveredMatch.venue} • {hoveredMatch.date}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: '6px', marginTop: '4px' }}>
              <span>Turnout:</span>
              <strong style={{ color: '#38bdf8' }}>
                {hoveredMatch.attendance?.toLocaleString()} / {hoveredMatch.venueCapacity?.toLocaleString()}{' '}
                ({hoveredMatch.capacityUtilizationRate}%)
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span>Weather:</span>
              <span style={{ color: '#fbbf24' }}>
                {hoveredMatch.weather?.tempC}°C · {hoveredMatch.weather?.condition}{' '}
                {hoveredMatch.weather?.isIndoor ? '(Indoor 🏟️)' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Insight Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#64748b' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {sportsList.map((sp) => (
            <span key={sp} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: SPORT_COLORS[sp] || '#059669', display: 'inline-block' }} /> {sp}
            </span>
          ))}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#475569', display: 'inline-block' }} /> Outdoor
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#ffffff', border: '2px solid #475569', display: 'inline-block' }} /> Indoor Arena
          </span>
        </div>
        <span>Hover or focus any plot point for fixture turnout details</span>
      </div>
    </div>
  );
}
