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
    <div className={`${styles.executiveCard} ${styles.gdsStack} ${className}`}>
      <div className={styles.gdsRowBetween}>
        <div>
          <div className={styles.gdsEyebrow}>Environmental Intelligence</div>
          <h3 className={styles.gdsCardTitle}>Weather vs. Stadium Attendance Matrix</h3>
          <p className={styles.gdsCaption}>
            Correlation between kickoff climate conditions, ambient temperature, and stadium capacity fill rates
          </p>
        </div>

        {/* Sport Filter Pills */}
        <div className={styles.gdsRow}>
          <button
            type="button"
            onClick={() => setSelectedSport('all')}
            className={`${styles.sportFilterBtn} ${selectedSport === 'all' ? styles.sportFilterBtnActive : ''}`}
          >
            All Disciplines ({validMatches.length})
          </button>
          {sportsList.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`${styles.sportFilterBtn} ${selectedSport === sport ? styles.sportFilterBtnActive : ''}`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Climate Tier Comparison Banners */}
      <div className={styles.weatherBandGrid}>
        <div className={styles.weatherBandWarm}>
          <div className={styles.gdsEyebrow}>☀️ Warm (&gt;18°C)</div>
          <div className={styles.gdsSectionKpi}>
            {climateBands.warm.avgFill !== null ? `${climateBands.warm.avgFill}%` : 'N/A'}
          </div>
          <div className={styles.gdsCaption}>{climateBands.warm.count} outdoor matches</div>
        </div>

        <div className={styles.weatherBandMild}>
          <div className={styles.gdsEyebrow}>⛅ Mild (10–18°C)</div>
          <div className={styles.gdsSectionKpi}>
            {climateBands.mild.avgFill !== null ? `${climateBands.mild.avgFill}%` : 'N/A'}
          </div>
          <div className={styles.gdsCaption}>{climateBands.mild.count} outdoor matches</div>
        </div>

        <div className={styles.weatherBandCold}>
          <div className={styles.gdsEyebrow}>❄️ Cold (&lt;10°C)</div>
          <div className={styles.gdsSectionKpi}>
            {climateBands.cold.avgFill !== null ? `${climateBands.cold.avgFill}%` : 'N/A'}
          </div>
          <div className={styles.gdsCaption}>{climateBands.cold.count} outdoor matches</div>
        </div>

        <div className={styles.weatherBandIndoor}>
          <div className={styles.gdsEyebrow}>🏟️ Indoor Arenas</div>
          <div className={styles.gdsSectionKpi}>
            {climateBands.indoor.avgFill !== null ? `${climateBands.indoor.avgFill}%` : 'N/A'}
          </div>
          <div className={styles.gdsCaption}>{climateBands.indoor.count} arena fixtures</div>
        </div>
      </div>

      {/* Interactive Scatter Canvas */}
      <div className={styles.weatherCanvas}>
        <div className={styles.weatherYLabel}>Fill %</div>
        {[100, 75, 50, 25, 0].map((tick) => {
          const topPct = (1 - tick / 100) * 76 + 14;
          return (
            <div key={tick} className={styles.weatherGridline} style={{ top: `${topPct}%` }}>
              <span className={styles.weatherTick}>{tick}%</span>
            </div>
          );
        })}

        <div className={styles.weatherXAxis}>
          <span>{Math.round(minTemp)}°C (Cold)</span>
          <span>Kickoff Ambient Temperature (°C)</span>
          <span>{Math.round(maxTemp)}°C (Warm)</span>
        </div>

        {/* Match Scatter Points */}
        <div className={styles.weatherPlotArea}>
          {filteredMatches.map((m) => {
            const fillRate = Math.min(
              100,
              Math.max(0, m.capacityUtilizationRate ?? (m.attendance && m.venueCapacity ? (m.attendance / m.venueCapacity) * 100 : 0))
            );
            const temp = m.weather!.tempC;
            const leftPct = ((temp - minTemp) / tempRange) * 94 + 3;
            const topPct = (1 - fillRate / 100) * 76 + 14;
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
          <div className={styles.weatherTooltip}>
            <div className={styles.gdsNum}>
              {hoveredMatch.cleanName || hoveredMatch.matchName}
            </div>
            <div>
              📍 {hoveredMatch.venue} • {hoveredMatch.date}
            </div>
            <div className={styles.weatherTooltipDivider}>
              <span>Turnout:</span>
              <strong className={styles.gdsNum}>
                {hoveredMatch.attendance?.toLocaleString()} / {hoveredMatch.venueCapacity?.toLocaleString()}{' '}
                ({hoveredMatch.capacityUtilizationRate}%)
              </strong>
            </div>
            <div className={styles.gdsRowBetween}>
              <span>Weather:</span>
              <span>
                {hoveredMatch.weather?.tempC}°C · {hoveredMatch.weather?.condition}{' '}
                {hoveredMatch.weather?.isIndoor ? '(Indoor 🏟️)' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Insight Footer */}
      <div className={styles.gdsRowBetween}>
        <div className={styles.gdsRow}>
          {sportsList.map((sp) => (
            <span key={sp} className={styles.gdsCaption}>
              <span className={styles.weatherLegendDot} style={{ background: SPORT_COLORS[sp] || 'var(--report-primary)' }} /> {sp}
            </span>
          ))}
          <span className={styles.gdsCaption}>
            <span className={`${styles.weatherLegendDot} ${styles.weatherLegendDotOutdoor}`} /> Outdoor
          </span>
          <span className={styles.gdsCaption}>
            <span className={`${styles.weatherLegendDot} ${styles.weatherLegendDotIndoor}`} /> Indoor Arena
          </span>
        </div>
        <span className={styles.gdsCaption}>Hover or focus any plot point for fixture turnout details</span>
      </div>
    </div>
  );
}
